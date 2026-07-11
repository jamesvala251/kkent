<?php

namespace App\Http\Controllers\Api;

use App\Models\CompanySetting;
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
        $query = Invoice::with('customer')->latest();

        if ($request->payment_status) {
            $query->where('payment_status', $request->payment_status);
        }
        if ($request->customer_id) {
            $query->where('customer_id', $request->customer_id);
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
            'invoice_date' => 'required|date',
            'due_date' => 'nullable|date|after_or_equal:invoice_date',
            'subtotal' => 'required|numeric|min:0',
            'cgst_rate' => 'nullable|numeric|min:0|max:100',
            'sgst_rate' => 'nullable|numeric|min:0|max:100',
            'igst_rate' => 'nullable|numeric|min:0|max:100',
            'notes' => 'nullable|string',
        ]);

        $data['invoice_number'] = $this->generateInvoiceNumber();
        $data = $this->applyGstCalculations($data);

        $invoice = Invoice::create($data);
        $this->auditService->log('create', 'invoices', $invoice);

        return $this->success($invoice->load('customer'), 'Invoice created', 201);
    }

    public function show(Invoice $invoice): JsonResponse
    {
        return $this->success($invoice->load(['customer', 'trip']));
    }

    public function update(Request $request, Invoice $invoice): JsonResponse
    {
        $data = $request->validate([
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

        $merged = array_merge($invoice->toArray(), $data);
        if (isset($data['subtotal']) || isset($data['cgst_rate']) || isset($data['sgst_rate']) || isset($data['igst_rate'])) {
            $data = array_merge($data, $this->applyGstCalculations($merged));
        }

        $old = $invoice->toArray();
        $invoice->update($data);
        $this->auditService->log('update', 'invoices', $invoice, $old, $invoice->toArray());

        return $this->success($invoice->load('customer'), 'Invoice updated');
    }

    public function destroy(Invoice $invoice): JsonResponse
    {
        $this->auditService->log('delete', 'invoices', $invoice, $invoice->toArray());
        $invoice->delete();

        return $this->success(null, 'Invoice deleted');
    }

    public function download(Invoice $invoice): Response
    {
        $invoice->load(['customer', 'trip']);
        $settings = CompanySetting::first();
        $pdf = Pdf::loadView('invoices.pdf', compact('invoice', 'settings'));

        return $pdf->download($invoice->invoice_number.'.pdf');
    }

    private function applyGstCalculations(array $data): array
    {
        $subtotal = (float) ($data['subtotal'] ?? 0);
        $cgstRate = (float) ($data['cgst_rate'] ?? 0);
        $sgstRate = (float) ($data['sgst_rate'] ?? 0);
        $igstRate = (float) ($data['igst_rate'] ?? 0);

        $data['cgst_rate'] = $cgstRate;
        $data['sgst_rate'] = $sgstRate;
        $data['igst_rate'] = $igstRate;
        $data['cgst'] = round($subtotal * $cgstRate / 100, 2);
        $data['sgst'] = round($subtotal * $sgstRate / 100, 2);
        $data['igst'] = round($subtotal * $igstRate / 100, 2);
        $data['total_amount'] = round($subtotal + $data['cgst'] + $data['sgst'] + $data['igst'], 2);

        return $data;
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
