<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Trip;
use App\Repositories\CustomerRepository;
use App\Services\AuditService;

class CustomerService
{
    public function __construct(
        private CustomerRepository $repository,
        private AuditService $auditService
    ) {}

    public function list(array $filters = [])
    {
        return $this->repository->all($filters);
    }

    public function summary(): array
    {
        $billed = (float) Invoice::sum('total_amount');
        $paid = (float) Invoice::sum('paid_amount');

        return [
            'total_customers' => Customer::count(),
            'active_customers' => Customer::where('status', 'active')->count(),
            'total_trips' => Trip::count(),
            'billed' => round($billed, 2),
            'paid' => round($paid, 2),
            'outstanding' => round($billed - $paid, 2),
        ];
    }

    public function find(int $id): Customer
    {
        return $this->repository->findOrFail($id);
    }

    public function create(array $data): Customer
    {
        $customer = $this->repository->create($data);
        $this->auditService->log('create', 'customers', $customer);

        return $customer;
    }

    public function update(Customer $customer, array $data): Customer
    {
        $old = $customer->toArray();
        $customer = $this->repository->update($customer, $data);
        $this->auditService->log('update', 'customers', $customer, $old, $customer->toArray());

        return $customer;
    }

    public function delete(Customer $customer): void
    {
        $this->auditService->log('delete', 'customers', $customer, $customer->toArray());
        $this->repository->delete($customer);
    }

    public function ledger(int $customerId)
    {
        $customer = $this->find($customerId);

        $invoices = $customer->invoices()->latest()->limit(200)->get();
        $billed = (float) $customer->invoices()->sum('total_amount');
        $paid = (float) $customer->invoices()->sum('paid_amount');

        return [
            'customer' => $customer,
            'trips' => $customer->trips()->with(['truck', 'driver'])->latest()->limit(200)->get(),
            'invoices' => $invoices,
            'rentals' => $customer->hitachiRentals()->with('hitachi')->latest()->limit(200)->get(),
            'billed' => round($billed, 2),
            'paid' => round($paid, 2),
            'outstanding' => round($billed - $paid, 2),
        ];
    }
}
