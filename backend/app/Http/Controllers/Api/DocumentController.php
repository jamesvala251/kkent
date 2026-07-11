<?php

namespace App\Http\Controllers\Api;

use App\Models\Document;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentController extends ApiController
{
    public function index(string $type, int $id): JsonResponse
    {
        $modelClass = match ($type) {
            'truck' => \App\Models\Truck::class,
            'driver' => \App\Models\Driver::class,
            'hitachi' => \App\Models\HitachiMachine::class,
            'customer' => \App\Models\Customer::class,
            default => null,
        };

        if (! $modelClass) {
            return $this->error('Invalid document type', 422);
        }

        $documents = Document::where('documentable_type', $modelClass)
            ->where('documentable_id', $id)
            ->get();

        return $this->success($documents);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'documentable_type' => 'required|string',
            'documentable_id' => 'required|integer',
            'type' => 'required|string|max:50',
            'title' => 'required|string|max:255',
            'file' => 'required|file|max:10240',
            'expiry_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $data['file_path'] = $request->file('file')->store('documents', 'public');
        $data['created_by'] = auth()->id();
        unset($data['file']);

        $document = Document::create($data);

        return $this->success($document, 'Document uploaded', 201);
    }

    public function destroy(Document $document): JsonResponse
    {
        Storage::disk('public')->delete($document->file_path);
        $document->delete();

        return $this->success(null, 'Document deleted');
    }
}
