<?php

namespace App\Services;

use App\Models\CompanySetting;
use App\Models\DieselIssue;
use App\Models\DieselPurchase;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DieselService
{
    public function getSummary(): array
    {
        $totalIn = (float) DieselPurchase::sum('quantity');
        $totalOut = (float) DieselIssue::sum('quantity');
        $stockBalance = (float) DieselPurchase::sum('remaining_quantity');
        $totalExpense = (float) DieselPurchase::sum('total_amount');

        return [
            'total_in' => round($totalIn, 2),
            'total_out' => round($totalOut, 2),
            'stock_balance' => round($stockBalance, 2),
            'total_expense' => round($totalExpense, 2),
        ];
    }

    public function listPurchases(array $filters = [])
    {
        $query = DieselPurchase::with('expense')->orderBy(
            $filters['sort_by'] ?? 'purchase_date',
            $filters['sort_order'] ?? 'desc'
        );

        if (! empty($filters['date_from'])) {
            $query->whereDate('purchase_date', '>=', $filters['date_from']);
        }
        if (! empty($filters['date_to'])) {
            $query->whereDate('purchase_date', '<=', $filters['date_to']);
        }

        return $query->paginate($filters['per_page'] ?? 15);
    }

    public function listIssues(array $filters = [])
    {
        $query = DieselIssue::with(['truck', 'hitachi', 'trip', 'dieselPurchase'])
            ->orderBy($filters['sort_by'] ?? 'issue_date', $filters['sort_order'] ?? 'desc');

        if (! empty($filters['date_from'])) {
            $query->whereDate('issue_date', '>=', $filters['date_from']);
        }
        if (! empty($filters['date_to'])) {
            $query->whereDate('issue_date', '<=', $filters['date_to']);
        }
        if (! empty($filters['truck_id'])) {
            $query->where('truck_id', $filters['truck_id']);
        }
        if (! empty($filters['hitachi_id'])) {
            $query->where('hitachi_id', $filters['hitachi_id']);
        }

        return $query->paginate($filters['per_page'] ?? 15);
    }

    public function getLedger(array $filters = [])
    {
        $purchases = DieselPurchase::query()
            ->when(! empty($filters['date_from']), fn ($q) => $q->whereDate('purchase_date', '>=', $filters['date_from']))
            ->when(! empty($filters['date_to']), fn ($q) => $q->whereDate('purchase_date', '<=', $filters['date_to']))
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'type' => 'in',
                'date' => $p->purchase_date->format('Y-m-d'),
                'quantity' => (float) $p->quantity,
                'rate_per_liter' => (float) $p->rate_per_liter,
                'total_amount' => (float) $p->total_amount,
                'reference' => $p->supplier ?: $p->bill_number ?: "Purchase #{$p->id}",
                'vehicle' => null,
                'remaining_quantity' => (float) $p->remaining_quantity,
                'expense_id' => $p->expense_id,
            ]);

        $issues = DieselIssue::with(['truck', 'hitachi'])
            ->when(! empty($filters['date_from']), fn ($q) => $q->whereDate('issue_date', '>=', $filters['date_from']))
            ->when(! empty($filters['date_to']), fn ($q) => $q->whereDate('issue_date', '<=', $filters['date_to']))
            ->get()
            ->map(fn ($i) => [
                'id' => $i->id,
                'type' => 'out',
                'date' => $i->issue_date->format('Y-m-d'),
                'quantity' => (float) $i->quantity,
                'rate_per_liter' => (float) $i->rate_per_liter,
                'total_amount' => (float) $i->total_amount,
                'reference' => $i->notes ?: "Issue #{$i->id}",
                'vehicle' => $i->truck?->truck_number ?? $i->hitachi?->machine_number,
                'remaining_quantity' => null,
                'expense_id' => null,
            ]);

        return $purchases->concat($issues)->sortByDesc('date')->values();
    }

    public function findPurchase(int $id): DieselPurchase
    {
        return DieselPurchase::with('expense')->findOrFail($id);
    }

    public function findIssue(int $id): DieselIssue
    {
        return DieselIssue::with(['truck', 'hitachi', 'trip', 'dieselPurchase'])->findOrFail($id);
    }

    public function createPurchase(array $data): DieselPurchase
    {
        return DB::transaction(function () use ($data) {
            $quantity = (float) $data['quantity'];
            $rate = (float) $data['rate_per_liter'];
            $totalAmount = round($quantity * $rate, 2);

            $category = ExpenseCategory::where('slug', 'diesel')->firstOrFail();
            $description = sprintf(
                'Diesel purchase: %s L%s%s',
                $quantity,
                ! empty($data['supplier']) ? " from {$data['supplier']}" : '',
                ! empty($data['bill_number']) ? " (Bill: {$data['bill_number']})" : ''
            );

            $expense = Expense::create([
                'expense_date' => $data['purchase_date'],
                'category_id' => $category->id,
                'amount' => $totalAmount,
                'description' => $description,
            ]);

            return DieselPurchase::create([
                'purchase_date' => $data['purchase_date'],
                'supplier' => $data['supplier'] ?? null,
                'bill_number' => $data['bill_number'] ?? null,
                'quantity' => $quantity,
                'remaining_quantity' => $quantity,
                'rate_per_liter' => $rate,
                'total_amount' => $totalAmount,
                'expense_id' => $expense->id,
                'notes' => $data['notes'] ?? null,
            ]);
        });
    }

    public function updatePurchase(DieselPurchase $purchase, array $data): DieselPurchase
    {
        return DB::transaction(function () use ($purchase, $data) {
            $issuedQty = (float) $purchase->quantity - (float) $purchase->remaining_quantity;
            $quantity = isset($data['quantity']) ? (float) $data['quantity'] : (float) $purchase->quantity;
            $rate = isset($data['rate_per_liter']) ? (float) $data['rate_per_liter'] : (float) $purchase->rate_per_liter;

            if ($quantity < $issuedQty) {
                throw ValidationException::withMessages([
                    'quantity' => ["Cannot reduce below issued quantity ({$issuedQty} L already dispensed)."],
                ]);
            }

            $totalAmount = round($quantity * $rate, 2);
            $purchase->fill([
                'purchase_date' => $data['purchase_date'] ?? $purchase->purchase_date,
                'supplier' => $data['supplier'] ?? $purchase->supplier,
                'bill_number' => $data['bill_number'] ?? $purchase->bill_number,
                'quantity' => $quantity,
                'remaining_quantity' => $quantity - $issuedQty,
                'rate_per_liter' => $rate,
                'total_amount' => $totalAmount,
                'notes' => $data['notes'] ?? $purchase->notes,
            ]);
            $purchase->save();

            if ($purchase->expense_id) {
                Expense::where('id', $purchase->expense_id)->update([
                    'expense_date' => $purchase->purchase_date,
                    'amount' => $totalAmount,
                ]);
            }

            return $purchase->fresh('expense');
        });
    }

    public function deletePurchase(DieselPurchase $purchase): void
    {
        DB::transaction(function () use ($purchase) {
            $issuedQty = (float) $purchase->quantity - (float) $purchase->remaining_quantity;
            if ($issuedQty > 0) {
                throw ValidationException::withMessages([
                    'purchase' => ['Cannot delete purchase with diesel already issued from it.'],
                ]);
            }

            if ($purchase->expense_id) {
                Expense::where('id', $purchase->expense_id)->delete();
            }

            $purchase->delete();
        });
    }

    public function createIssue(array $data): DieselIssue
    {
        return DB::transaction(function () use ($data) {
            if (empty($data['truck_id']) && empty($data['hitachi_id'])) {
                throw ValidationException::withMessages([
                    'vehicle' => ['Select a truck or hitachi machine for diesel issue.'],
                ]);
            }

            $quantity = (float) $data['quantity'];
            $stockBalance = (float) DieselPurchase::sum('remaining_quantity');

            if ($quantity > $stockBalance) {
                throw ValidationException::withMessages([
                    'quantity' => ["Insufficient stock. Available: {$stockBalance} L"],
                ]);
            }

            $allocations = $this->allocateStock($quantity, $data['diesel_purchase_id'] ?? null);
            $rate = isset($data['rate_per_liter']) && $data['rate_per_liter'] > 0
                ? (float) $data['rate_per_liter']
                : $this->averageRateFromAllocations($allocations);

            return DieselIssue::create([
                'issue_date' => $data['issue_date'],
                'quantity' => $quantity,
                'rate_per_liter' => $rate,
                'total_amount' => round($quantity * $rate, 2),
                'truck_id' => $data['truck_id'] ?? null,
                'hitachi_id' => $data['hitachi_id'] ?? null,
                'trip_id' => $data['trip_id'] ?? null,
                'diesel_purchase_id' => count($allocations) === 1 ? $allocations[0]['purchase_id'] : ($data['diesel_purchase_id'] ?? null),
                'purchase_allocations' => $allocations,
                'notes' => $data['notes'] ?? null,
            ]);
        });
    }

    public function deleteIssue(DieselIssue $issue): void
    {
        DB::transaction(function () use ($issue) {
            foreach ($issue->purchase_allocations ?? [] as $allocation) {
                DieselPurchase::where('id', $allocation['purchase_id'])
                    ->increment('remaining_quantity', $allocation['quantity']);
            }

            $issue->delete();
        });
    }

    public function getAvailablePurchases()
    {
        return DieselPurchase::where('remaining_quantity', '>', 0)
            ->orderBy('purchase_date')
            ->orderBy('id')
            ->get(['id', 'purchase_date', 'supplier', 'bill_number', 'remaining_quantity', 'rate_per_liter']);
    }

    private function allocateStock(float $quantity, ?int $purchaseId = null): array
    {
        $allocations = [];
        $remaining = $quantity;

        if ($purchaseId) {
            $purchase = DieselPurchase::findOrFail($purchaseId);
            if ((float) $purchase->remaining_quantity < $quantity) {
                throw ValidationException::withMessages([
                    'diesel_purchase_id' => ["Selected tanker has only {$purchase->remaining_quantity} L remaining."],
                ]);
            }
            $purchase->remaining_quantity = (float) $purchase->remaining_quantity - $quantity;
            $purchase->save();

            return [['purchase_id' => $purchase->id, 'quantity' => $quantity]];
        }

        $purchases = DieselPurchase::where('remaining_quantity', '>', 0)
            ->orderBy('purchase_date')
            ->orderBy('id')
            ->lockForUpdate()
            ->get();

        foreach ($purchases as $purchase) {
            if ($remaining <= 0) {
                break;
            }

            $available = (float) $purchase->remaining_quantity;
            $deduct = min($remaining, $available);
            $purchase->remaining_quantity = $available - $deduct;
            $purchase->save();

            $allocations[] = [
                'purchase_id' => $purchase->id,
                'quantity' => $deduct,
            ];
            $remaining -= $deduct;
        }

        if ($remaining > 0) {
            throw ValidationException::withMessages([
                'quantity' => ['Insufficient diesel stock for this issue.'],
            ]);
        }

        return $allocations;
    }

    private function averageRateFromAllocations(array $allocations): float
    {
        if (empty($allocations)) {
            $settings = CompanySetting::first();

            return (float) ($settings?->diesel_default_price ?? 0);
        }

        $totalQty = 0;
        $totalValue = 0;

        foreach ($allocations as $allocation) {
            $purchase = DieselPurchase::find($allocation['purchase_id']);
            if (! $purchase) {
                continue;
            }
            $qty = (float) $allocation['quantity'];
            $totalQty += $qty;
            $totalValue += $qty * (float) $purchase->rate_per_liter;
        }

        return $totalQty > 0 ? round($totalValue / $totalQty, 2) : 0;
    }
}
