<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Customer\StoreCustomerRequest;
use App\Http\Requests\Customer\UpdateCustomerRequest;
use App\Http\Resources\CustomerResource;
use App\Models\Customer;
use App\Services\CustomerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends ApiController
{
    public function __construct(private CustomerService $customerService) {}

    public function index(Request $request): JsonResponse
    {
        $customers = $this->customerService->list($request->all());

        return $this->success(CustomerResource::collection($customers)->response()->getData(true));
    }

    public function store(StoreCustomerRequest $request): JsonResponse
    {
        $customer = $this->customerService->create($request->validated());

        return $this->success(new CustomerResource($customer), 'Customer created', 201);
    }

    public function show(Customer $customer): JsonResponse
    {
        return $this->success(new CustomerResource($customer));
    }

    public function update(UpdateCustomerRequest $request, Customer $customer): JsonResponse
    {
        $customer = $this->customerService->update($customer, $request->validated());

        return $this->success(new CustomerResource($customer), 'Customer updated');
    }

    public function destroy(Customer $customer): JsonResponse
    {
        $this->customerService->delete($customer);

        return $this->success(null, 'Customer deleted');
    }

    public function ledger(Customer $customer): JsonResponse
    {
        return $this->success($this->customerService->ledger($customer->id));
    }
}
