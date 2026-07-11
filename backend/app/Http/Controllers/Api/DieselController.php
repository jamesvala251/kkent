<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\DieselIssueResource;
use App\Http\Resources\DieselPurchaseResource;
use App\Models\DieselIssue;
use App\Models\DieselPurchase;
use App\Services\DieselService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DieselController extends ApiController
{
    public function __construct(private DieselService $dieselService) {}

    public function summary(): JsonResponse
    {
        return $this->success($this->dieselService->getSummary());
    }

    public function ledger(Request $request): JsonResponse
    {
        return $this->success($this->dieselService->getLedger($request->all()));
    }

    public function availablePurchases(): JsonResponse
    {
        return $this->success($this->dieselService->getAvailablePurchases());
    }

    public function indexPurchases(Request $request): JsonResponse
    {
        $purchases = $this->dieselService->listPurchases($request->all());

        return $this->success(DieselPurchaseResource::collection($purchases)->response()->getData(true));
    }

    public function storePurchase(Request $request): JsonResponse
    {
        $data = $request->validate([
            'purchase_date' => 'required|date',
            'supplier' => 'nullable|string|max:255',
            'bill_number' => 'nullable|string|max:255',
            'quantity' => 'required|numeric|min:0.01',
            'rate_per_liter' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $purchase = $this->dieselService->createPurchase($data);

        return $this->success(new DieselPurchaseResource($purchase->load('expense')), 'Diesel purchase recorded', 201);
    }

    public function showPurchase(DieselPurchase $dieselPurchase): JsonResponse
    {
        return $this->success(new DieselPurchaseResource($this->dieselService->findPurchase($dieselPurchase->id)));
    }

    public function updatePurchase(Request $request, DieselPurchase $dieselPurchase): JsonResponse
    {
        $data = $request->validate([
            'purchase_date' => 'sometimes|date',
            'supplier' => 'nullable|string|max:255',
            'bill_number' => 'nullable|string|max:255',
            'quantity' => 'sometimes|numeric|min:0.01',
            'rate_per_liter' => 'sometimes|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $purchase = $this->dieselService->updatePurchase($dieselPurchase, $data);

        return $this->success(new DieselPurchaseResource($purchase), 'Diesel purchase updated');
    }

    public function destroyPurchase(DieselPurchase $dieselPurchase): JsonResponse
    {
        $this->dieselService->deletePurchase($dieselPurchase);

        return $this->success(null, 'Diesel purchase deleted');
    }

    public function indexIssues(Request $request): JsonResponse
    {
        $issues = $this->dieselService->listIssues($request->all());

        return $this->success(DieselIssueResource::collection($issues)->response()->getData(true));
    }

    public function storeIssue(Request $request): JsonResponse
    {
        $data = $request->validate([
            'issue_date' => 'required|date',
            'quantity' => 'required|numeric|min:0.01',
            'rate_per_liter' => 'nullable|numeric|min:0',
            'truck_id' => 'nullable|exists:trucks,id',
            'hitachi_id' => 'nullable|exists:hitachi_machines,id',
            'trip_id' => 'nullable|exists:trips,id',
            'diesel_purchase_id' => 'nullable|exists:diesel_purchases,id',
            'notes' => 'nullable|string',
        ]);

        $issue = $this->dieselService->createIssue($data);

        return $this->success(new DieselIssueResource($issue->load(['truck', 'hitachi', 'trip'])), 'Diesel issue recorded', 201);
    }

    public function showIssue(DieselIssue $dieselIssue): JsonResponse
    {
        return $this->success(new DieselIssueResource($this->dieselService->findIssue($dieselIssue->id)));
    }

    public function destroyIssue(DieselIssue $dieselIssue): JsonResponse
    {
        $this->dieselService->deleteIssue($dieselIssue);

        return $this->success(null, 'Diesel issue deleted');
    }
}
