<?php

namespace App\Services;

use App\Repositories\BaseRepository;
use App\Services\AuditService;
use Illuminate\Database\Eloquent\Model;

abstract class BaseCrudService
{
    public function __construct(
        protected BaseRepository $repository,
        protected AuditService $auditService,
        protected string $module
    ) {}

    public function list(array $filters = [])
    {
        return $this->repository->all($filters);
    }

    public function find(int $id): Model
    {
        return $this->repository->findOrFail($id);
    }

    public function create(array $data): Model
    {
        $record = $this->repository->create($data);
        $this->auditService->log('create', $this->module, $record);

        return $record;
    }

    public function update(Model $model, array $data): Model
    {
        $old = $model->toArray();
        $record = $this->repository->update($model, $data);
        $this->auditService->log('update', $this->module, $record, $old, $record->toArray());

        return $record;
    }

    public function delete(Model $model): void
    {
        $this->auditService->log('delete', $this->module, $model, $model->toArray());
        $this->repository->delete($model);
    }
}
