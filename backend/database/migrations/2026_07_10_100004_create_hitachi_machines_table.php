<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hitachi_machines', function (Blueprint $table) {
            $table->id();
            $table->string('machine_number')->unique();
            $table->string('registration_number')->nullable();
            $table->string('model')->nullable();
            $table->string('engine_number')->nullable();
            $table->string('chassis_number')->nullable();
            $table->date('purchase_date')->nullable();
            $table->decimal('current_hours', 12, 2)->default(0);
            $table->decimal('current_km', 12, 2)->default(0);
            $table->enum('fuel_type', ['diesel', 'petrol', 'cng', 'electric'])->default('diesel');
            $table->string('bucket_capacity')->nullable();
            $table->enum('status', ['active', 'inactive', 'maintenance', 'breakdown'])->default('active');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hitachi_machines');
    }
};
