<?php

namespace App\Http\Controllers\Api;

use App\Models\CompanySetting;
use App\Models\HitachiRental;
use App\Models\Invoice;
use App\Models\Trip;
use App\Services\AuditService;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InvoiceController extends ApiController
{
    private const RELATIONS = ['customer', 'trip', 'trips.truck', 'trips.driver', 'hitachiRental.hitachi'];

    public function __construct(private AuditService $auditService) {}

    public function index(Request $request): JsonResponse
    {
        $query = Invoice::with(self::RELATIONS)->latest();

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

    /**
     * Uninvoiced trips for a customer in a calendar month, with combined freight total.
     */
    public function previewMonthly(Request $request): JsonResponse
    {
        $data = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'month' => 'required|date_format:Y-m',
            'exclude_invoice_id' => 'nullable|exists:invoices,id',
        ]);

        $start = Carbon::createFromFormat('Y-m-d', $data['month'].'-01')->startOfMonth();
        $end = $start->copy()->endOfMonth();

        $invoicedTripIds = DB::table('invoice_trip')
            ->when($data['exclude_invoice_id'] ?? null, function ($query, $invoiceId) {
                $query->where('invoice_id', '!=', $invoiceId);
            })
            ->pluck('trip_id');

        $trips = Trip::with(['truck', 'driver'])
            ->where('customer_id', $data['customer_id'])
            ->whereDate('start_date', '>=', $start->toDateString())
            ->whereDate('start_date', '<=', $end->toDateString())
            ->when($invoicedTripIds->isNotEmpty(), fn ($query) => $query->whereNotIn('id', $invoicedTripIds))
            ->orderBy('start_date')
            ->orderBy('id')
            ->get();

        return $this->success([
            'month' => $data['month'],
            'customer_id' => (int) $data['customer_id'],
            'trips' => $trips,
            'trip_count' => $trips->count(),
            'subtotal' => round($trips->sum(fn (Trip $trip) => $trip->billableAmount()), 2),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->invoiceRules());
        $data = $this->normalizeSourceLinks($data);
        $tripIds = $this->resolveTripIds($data);
        $this->assertTripsBillable($tripIds, (int) $data['customer_id']);

        unset($data['trip_ids']);
        $data['extra_charges'] = $this->sanitizeExtraCharges($data['extra_charges'] ?? []);
        $data['invoice_number'] = $this->generateInvoiceNumber();
        $data['trip_id'] = $tripIds[0] ?? null;
        $data['billing_month'] = $tripIds ? ($data['billing_month'] ?? $this->monthFromTrips($tripIds)) : null;
        $data['subtotal'] = $this->computeSubtotal($data, $tripIds);
        $data = array_merge($data, $this->applyGstCalculations($data));

        $invoice = DB::transaction(function () use ($data, $tripIds) {
            $invoice = Invoice::create($data);
            $invoice->trips()->sync($tripIds);

            return $invoice;
        });

        $this->auditService->log('create', 'invoices', $invoice);

        return $this->success(
            $invoice->load(self::RELATIONS),
            'Invoice created',
            201
        );
    }

    public function show(Invoice $invoice): JsonResponse
    {
        return $this->success($invoice->load(self::RELATIONS));
    }

    public function update(Request $request, Invoice $invoice): JsonResponse
    {
        $data = $request->validate($this->invoiceRules(true));
        $data = $this->normalizeSourceLinks($data);
        $customerId = (int) ($data['customer_id'] ?? $invoice->customer_id);
        $tripIds = array_key_exists('trip_ids', $data) || array_key_exists('trip_id', $data) || array_key_exists('hitachi_rental_id', $data)
            ? $this->resolveTripIds(array_merge($invoice->only(['trip_id', 'hitachi_rental_id', 'customer_id']), $data))
            : $invoice->trips()->pluck('trips.id')->all();
        $this->assertTripsBillable($tripIds, $customerId, $invoice->id);

        unset($data['trip_ids']);
        $data['trip_id'] = $tripIds[0] ?? null;
        $data['billing_month'] = $tripIds
            ? ($data['billing_month'] ?? $invoice->billing_month ?? $this->monthFromTrips($tripIds))
            : null;
        if (array_key_exists('extra_charges', $data)) {
            $data['extra_charges'] = $this->sanitizeExtraCharges($data['extra_charges'] ?? []);
        } else {
            $data['extra_charges'] = $invoice->extraChargeLines();
        }
        $data['subtotal'] = $this->computeSubtotal($data, $tripIds, $invoice);

        $gstSource = [
            'subtotal' => $data['subtotal'] ?? $invoice->subtotal,
            'cgst_rate' => array_key_exists('cgst_rate', $data) ? $data['cgst_rate'] : $invoice->cgst_rate,
            'sgst_rate' => array_key_exists('sgst_rate', $data) ? $data['sgst_rate'] : $invoice->sgst_rate,
            'igst_rate' => array_key_exists('igst_rate', $data) ? $data['igst_rate'] : $invoice->igst_rate,
        ];
        $data = array_merge($data, $this->applyGstCalculations($gstSource));

        $old = $invoice->toArray();
        DB::transaction(function () use ($invoice, $data, $tripIds) {
            $invoice->update($data);
            $invoice->trips()->sync($tripIds);
        });
        $this->auditService->log('update', 'invoices', $invoice, $old, $invoice->fresh()->toArray());

        return $this->success(
            $invoice->load(self::RELATIONS),
            'Invoice updated'
        );
    }

    public function destroy(Invoice $invoice): JsonResponse
    {
        $this->auditService->log('delete', 'invoices', $invoice, $invoice->toArray());
        $invoice->trips()->detach();
        $invoice->delete();

        return $this->success(null, 'Invoice deleted');
    }

    public function download(Invoice $invoice): Response
    {
        $invoice->load(self::RELATIONS);
        $settings = CompanySetting::first();
        $pdf = Pdf::loadView('invoices.pdf', compact('invoice', 'settings'));

        return $pdf->download($invoice->invoice_number.'.pdf');
    }

    private function invoiceRules(bool $updating = false): array
    {
        $required = $updating ? 'sometimes' : 'required';

        return [
            'customer_id' => $required.'|exists:customers,id',
            'trip_id' => 'nullable|exists:trips,id',
            'trip_ids' => 'nullable|array',
            'trip_ids.*' => 'integer|exists:trips,id',
            'hitachi_rental_id' => 'nullable|exists:hitachi_rentals,id',
            'billing_month' => 'nullable|date_format:Y-m',
            'invoice_date' => $required.'|date',
            'due_date' => $updating ? 'nullable|date' : 'nullable|date|after_or_equal:invoice_date',
            'subtotal' => ($updating ? 'sometimes' : 'nullable').'|numeric|min:0',
            'cgst_rate' => 'nullable|numeric|min:0|max:100',
            'sgst_rate' => 'nullable|numeric|min:0|max:100',
            'igst_rate' => 'nullable|numeric|min:0|max:100',
            'payment_status' => 'nullable|in:pending,paid,partial,overdue',
            'paid_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'extra_charges' => 'nullable|array',
            'extra_charges.*.description' => 'nullable|string|max:255',
            'extra_charges.*.amount' => 'nullable|numeric|min:0',
        ];
    }

    /**
     * Prefer one billing source: trips OR hitachi rental (not both).
     */
    private function normalizeSourceLinks(array $data): array
    {
        $hasTrip = ! empty($data['trip_id']) || ! empty($data['trip_ids']);
        $hasRental = ! empty($data['hitachi_rental_id']);

        if ($hasTrip && $hasRental) {
            $data['trip_id'] = null;
            $data['trip_ids'] = [];
            $data['billing_month'] = null;
        }

        if (! empty($data['hitachi_rental_id'])) {
            $rental = HitachiRental::find($data['hitachi_rental_id']);
            if ($rental && empty($data['customer_id'])) {
                $data['customer_id'] = $rental->customer_id;
            }
        }

        return $data;
    }

    /**
     * @return list<int>
     */
    private function resolveTripIds(array $data): array
    {
        if (! empty($data['hitachi_rental_id'])) {
            return [];
        }

        $ids = $data['trip_ids'] ?? [];
        if ($ids === [] && ! empty($data['trip_id'])) {
            $ids = [$data['trip_id']];
        }

        return array_values(array_unique(array_map('intval', $ids)));
    }

    /**
     * @param  list<int>  $tripIds
     */
    private function assertTripsBillable(array $tripIds, int $customerId, ?int $exceptInvoiceId = null): void
    {
        if ($tripIds === []) {
            return;
        }

        $trips = Trip::whereIn('id', $tripIds)->get();
        if ($trips->count() !== count($tripIds)) {
            throw ValidationException::withMessages([
                'trip_ids' => 'One or more trips were not found.',
            ]);
        }

        if ($trips->contains(fn (Trip $trip) => (int) $trip->customer_id !== $customerId)) {
            throw ValidationException::withMessages([
                'trip_ids' => 'All trips must belong to the selected customer.',
            ]);
        }

        $already = DB::table('invoice_trip')
            ->whereIn('trip_id', $tripIds)
            ->when($exceptInvoiceId, fn ($query, $invoiceId) => $query->where('invoice_id', '!=', $invoiceId))
            ->pluck('trip_id');

        if ($already->isNotEmpty()) {
            throw ValidationException::withMessages([
                'trip_ids' => 'Some trips are already included on another invoice.',
            ]);
        }
    }

    /**
     * @param  list<int>  $tripIds
     */
    private function computeSubtotal(array $data, array $tripIds, ?Invoice $invoice = null): float
    {
        $extraTotal = collect($data['extra_charges'] ?? [])->sum(fn ($row) => (float) ($row['amount'] ?? 0));

        if ($tripIds !== []) {
            return round($this->sumTripAmounts($tripIds) + $extraTotal, 2);
        }

        $rentalId = array_key_exists('hitachi_rental_id', $data)
            ? $data['hitachi_rental_id']
            : $invoice?->hitachi_rental_id;
        if ($rentalId) {
            $rental = HitachiRental::find($rentalId);

            return round((float) ($rental?->total_amount ?? 0) + $extraTotal, 2);
        }

        return round($extraTotal, 2);
    }

    /**
     * @return list<array{description: string, amount: float}>
     */
    private function sanitizeExtraCharges(mixed $rows): array
    {
        return collect(is_array($rows) ? $rows : [])
            ->map(fn ($row) => [
                'description' => trim((string) ($row['description'] ?? '')),
                'amount' => round((float) ($row['amount'] ?? 0), 2),
            ])
            ->filter(fn ($row) => $row['description'] !== '' && $row['amount'] > 0)
            ->values()
            ->all();
    }

    /**
     * @param  list<int>  $tripIds
     */
    private function sumTripAmounts(array $tripIds): float
    {
        return round(
            Trip::whereIn('id', $tripIds)->get()->sum(fn (Trip $trip) => $trip->billableAmount()),
            2
        );
    }

    /**
     * @param  list<int>  $tripIds
     */
    private function monthFromTrips(array $tripIds): ?string
    {
        $startDate = Trip::whereIn('id', $tripIds)->orderBy('start_date')->value('start_date');

        return $startDate ? Carbon::parse($startDate)->format('Y-m') : null;
    }

    private function applyGstCalculations(array $data): array
    {
        $subtotal = (float) ($data['subtotal'] ?? 0);
        $cgstRate = (float) ($data['cgst_rate'] ?? 0);
        $sgstRate = (float) ($data['sgst_rate'] ?? 0);
        $igstRate = (float) ($data['igst_rate'] ?? 0);

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
