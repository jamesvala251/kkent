<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('maintenance_records', function (Blueprint $table) {
            $table->id();
            $table->enum('vehicle_type', ['truck', 'hitachi']);
            $table->unsignedBigInteger('vehicle_id');
            $table->enum('type', ['service', 'repair', 'tyre', 'battery', 'oil_change', 'engine', 'other'])->default('service');
            $table->date('service_date');
            $table->date('next_service_date')->nullable();
            $table->decimal('current_km', 12, 2)->nullable();
            $table->decimal('cost', 12, 2)->default(0);
            $table->string('vendor')->nullable();
            $table->text('description')->nullable();
            $table->enum('status', ['scheduled', 'completed', 'overdue'])->default('scheduled');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['vehicle_type', 'vehicle_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('maintenance_records');
    }
};
