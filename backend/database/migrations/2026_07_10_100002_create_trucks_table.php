<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trucks', function (Blueprint $table) {
            $table->id();
            $table->string('truck_number')->unique();
            $table->string('rc_number')->nullable();
            $table->date('insurance_expiry')->nullable();
            $table->date('fitness_expiry')->nullable();
            $table->date('permit_expiry')->nullable();
            $table->date('puc_expiry')->nullable();
            $table->date('tax_expiry')->nullable();
            $table->string('model')->nullable();
            $table->string('brand')->nullable();
            $table->year('year')->nullable();
            $table->string('capacity')->nullable();
            $table->string('owner')->nullable();
            $table->enum('fuel_type', ['diesel', 'petrol', 'cng', 'electric'])->default('diesel');
            $table->string('gps_number')->nullable();
            $table->decimal('current_km', 12, 2)->default(0);
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
        Schema::dropIfExists('trucks');
    }
};
