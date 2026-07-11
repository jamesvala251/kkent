<?php

namespace App\Services;

use App\Models\Customer;
use App\Repositories\CustomerRepository;
use App\Services\AuditService;
use Illuminate\Support\Facades\DB;

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

        return [
            'customer' => $customer,
            'trips' => $customer->trips()->with(['truck', 'driver'])->latest()->paginate(20),
            'invoices' => $customer->invoices()->latest()->paginate(20),
            'outstanding' => $customer->invoices()
                ->whereIn('payment_status', ['pending', 'partial', 'overdue'])
                ->sum(DB::raw('total_amount - paid_amount')),
        ];
    }
}
