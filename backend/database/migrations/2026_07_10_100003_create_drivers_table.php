<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('drivers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('photo')->nullable();
            $table->string('mobile');
            $table->text('address')->nullable();
            $table->string('aadhaar')->nullable();
            $table->string('license_number')->nullable();
            $table->date('license_expiry')->nullable();
            $table->date('joining_date')->nullable();
            $table->enum('salary_type', ['monthly', 'per_trip', 'both'])->default('monthly');
            $table->decimal('monthly_salary', 12, 2)->default(0);
            $table->decimal('per_trip_salary', 12, 2)->default(0);
            $table->string('bank_name')->nullable();
            $table->string('bank_account')->nullable();
            $table->string('bank_ifsc')->nullable();
            $table->string('emergency_contact')->nullable();
            $table->foreignId('assigned_truck_id')->nullable()->constrained('trucks')->nullOnDelete();
            $table->enum('status', ['active', 'inactive', 'on_leave'])->default('active');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('drivers');
    }
};
