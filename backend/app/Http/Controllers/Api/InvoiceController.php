<?php

namespace App\Http\Controllers\Api;

use App\Models\CompanySetting;
use App\Models\HitachiRental;
use App\Models\Invoice;
use App\Services\AuditService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class InvoiceController extends ApiController
{
    public function __construct(private AuditService $auditService) {}

    public function index(Request $request): JsonResponse
    {
        $query = Invoice::with(['customer', 'trip', 'hitachiRental.hitachi'])->latest();

        if ($request->payment_status) {
            $query->where('payment_status', $request->payment_status);
        }
        if ($request->customer_id) {
            $query->where('customer_id', $request->customer_id);
        }
        if ($request->hitachi_rental_id) {
            $query->where('hitachi_rental_id', $request->hitachi_rental_id);
        }
        if ($request->date_from) {
            $query->whereDate('invoice_date', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->whereDate('invoice_date', '<=', $request->date_to);
        }
        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        return $this->success($query->paginate($request->get('per_page', 15)));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'trip_id' => 'nullable|exists:trips,id',
            'hitachi_rental_id' => 'nullable|exists:hitachi_rentals,id',
            'invoice_date' => 'required|date',
            'due_date' => 'nullable|date|after_or_equal:invoice_date',
            'subtotal' => 'required|numeric|min:0',
            'cgst_rate' => 'nullable|numeric|min:0|max:100',
            'sgst_rate' => 'nullable|numeric|min:0|max:100',
            'igst_rate' => 'nullable|numeric|min:0|max:100',
            'notes' => 'nullable|string',
        ]);

        $data = $this->normalizeSourceLinks($data);

        $data['invoice_number'] = $this->generateInvoiceNumber();
        $data = array_merge($data, $this->applyGstCalculations($data));

        $invoice = Invoice::create($data);
        $this->auditService->log('create', 'invoices', $invoice);

        return $this->success(
            $invoice->load(['customer', 'trip', 'hitachiRental.hitachi']),
            'Invoice created',
            201
        );
    }

    public function show(Invoice $invoice): JsonResponse
    {
        return $this->success($invoice->load(['customer', 'trip', 'hitachiRental.hitachi']));
    }

    public function update(Request $request, Invoice $invoice): JsonResponse
    {
        $data = $request->validate([
            'customer_id' => 'sometimes|exists:customers,id',
            'trip_id' => 'nullable|exists:trips,id',
            'hitachi_rental_id' => 'nullable|exists:hitachi_rentals,id',
            'invoice_date' => 'sometimes|date',
            'due_date' => 'nullable|date',
            'subtotal' => 'sometimes|numeric|min:0',
            'cgst_rate' => 'nullable|numeric|min:0|max:100',
            'sgst_rate' => 'nullable|numeric|min:0|max:100',
            'igst_rate' => 'nullable|numeric|min:0|max:100',
            'payment_status' => 'nullable|in:pending,paid,partial,overdue',
            'paid_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $data = $this->normalizeSourceLinks($data);

        // Always recalculate GST amounts from % rates so totals stay consistent
        $gstSource = [
            'subtotal' => $data['subtotal'] ?? $invoice->subtotal,
            'cgst_rate' => array_key_exists('cgst_rate', $data) ? $data['cgst_rate'] : $invoice->cgst_rate,
            'sgst_rate' => array_key_exists('sgst_rate', $data) ? $data['sgst_rate'] : $invoice->sgst_rate,
            'igst_rate' => array_key_exists('igst_rate', $data) ? $data['igst_rate'] : $invoice->igst_rate,
        ];
        $data = array_merge($data, $this->applyGstCalculations($gstSource));

        $old = $invoice->toArray();
        $invoice->update($data);
        $this->auditService->log('update', 'invoices', $invoice, $old, $invoice->toArray());

        return $this->success(
            $invoice->load(['customer', 'trip', 'hitachiRental.hitachi']),
            'Invoice updated'
        );
    }

    public function destroy(Invoice $invoice): JsonResponse
    {
        $this->auditService->log('delete', 'invoices', $invoice, $invoice->toArray());
        $invoice->delete();

        return $this->success(null, 'Invoice deleted');
    }

    public function download(Invoice $invoice): Response
    {
        $invoice->load(['customer', 'trip', 'hitachiRental.hitachi']);
        $settings = CompanySetting::first();
        $pdf = Pdf::loadView('invoices.pdf', compact('invoice', 'settings'));

        return $pdf->download($invoice->invoice_number.'.pdf');
    }

    /**
     * Prefer one billing source: trip OR hitachi rental (not both).
     * When rental is set, sync customer from rental if needed.
     */
    private function normalizeSourceLinks(array $data): array
    {
        $hasTrip = ! empty($data['trip_id']);
        $hasRental = ! empty($data['hitachi_rental_id']);

        if ($hasTrip && $hasRental) {
            // Keep the rental as primary when both sent (Hitachi invoice flow)
            $data['trip_id'] = null;
        }

        if (! empty($data['hitachi_rental_id'])) {
            $rental = HitachiRental::find($data['hitachi_rental_id']);
            if ($rental && empty($data['customer_id'])) {
                $data['customer_id'] = $rental->customer_id;
            }
        }

        return $data;
    }

    private function applyGstCalculations(array $data): array
    {
        $subtotal = (float) ($data['subtotal'] ?? 0);
        $cgstRate = (float) ($data['cgst_rate'] ?? 0);
        $sgstRate = (float) ($data['sgst_rate'] ?? 0);
        $igstRate = (float) ($data['igst_rate'] ?? 0);

        // Rates are the source of truth — amounts are always % of subtotal
        $cgst = round($subtotal * $cgstRate / 100, 2);
        $sgst = round($subtotal * $sgstRate / 100, 2);
        $igst = round($subtotal * $igstRate / 100, 2);

        return [
            'subtotal' => round($subtotal, 2),
            'cgst_rate' => round($cgstRate, 2),
            'sgst_rate' => round($sgstRate, 2),
            'igst_rate' => round($igstRate, 2),
            'cgst' => $cgst,
            'sgst' => $sgst,
            'igst' => $igst,
            'total_amount' => round($subtotal + $cgst + $sgst + $igst, 2),
        ];
    }

    private function generateInvoiceNumber(): string
    {
        $settings = CompanySetting::first();
        $prefix = $settings?->invoice_prefix ?? 'INV';
        $last = Invoice::withTrashed()->latest('id')->first();
        $next = ($last?->id ?? 0) + 1;

        return $prefix.'-'.str_pad((string) $next, 6, '0', STR_PAD_LEFT);
    }
}
