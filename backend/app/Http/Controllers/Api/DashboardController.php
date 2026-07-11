<?php

namespace App\Http\Controllers\Api;

use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;

class DashboardController extends ApiController
{
    public function __construct(private DashboardService $dashboardService) {}

    public function index(): JsonResponse
    {
        return $this->success([
            'stats' => $this->dashboardService->getStats(),
            'charts' => $this->dashboardService->getCharts(),
            'tables' => $this->dashboardService->getTables(),
        ]);
    }

    public function stats(): JsonResponse
    {
        return $this->success($this->dashboardService->getStats());
    }

    public function charts(): JsonResponse
    {
        return $this->success($this->dashboardService->getCharts());
    }
}
