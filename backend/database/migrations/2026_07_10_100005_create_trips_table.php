<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trips', function (Blueprint $table) {
            $table->id();
            $table->string('trip_number')->unique();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('truck_id')->constrained()->cascadeOnDelete();
            $table->foreignId('driver_id')->constrained()->cascadeOnDelete();
            $table->foreignId('hitachi_id')->nullable()->constrained('hitachi_machines')->nullOnDelete();
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->string('from_location');
            $table->string('to_location');
            $table->string('material')->nullable();
            $table->decimal('weight', 12, 2)->nullable();
            $table->decimal('start_km', 12, 2)->default(0);
            $table->decimal('end_km', 12, 2)->nullable();
            $table->decimal('total_km', 12, 2)->default(0);
            $table->decimal('diesel_qty', 12, 2)->default(0);
            $table->decimal('diesel_rate', 12, 2)->default(0);
            $table->decimal('diesel_amount', 12, 2)->default(0);
            $table->decimal('toll', 12, 2)->default(0);
            $table->decimal('maintenance', 12, 2)->default(0);
            $table->decimal('other_expense', 12, 2)->default(0);
            $table->decimal('driver_salary', 12, 2)->default(0);
            $table->decimal('total_expense', 12, 2)->default(0);
            $table->decimal('freight', 12, 2)->default(0);
            $table->decimal('advance_received', 12, 2)->default(0);
            $table->decimal('balance', 12, 2)->default(0);
            $table->decimal('profit', 12, 2)->default(0);
            $table->boolean('compressor')->default(false);
            $table->text('remarks')->nullable();
            $table->enum('status', ['pending', 'running', 'completed', 'cancelled'])->default('pending');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trips');
    }
};
