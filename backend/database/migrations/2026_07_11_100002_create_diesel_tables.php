<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('diesel_purchases', function (Blueprint $table) {
            $table->id();
            $table->date('purchase_date');
            $table->string('supplier')->nullable();
            $table->string('bill_number')->nullable();
            $table->decimal('quantity', 12, 2);
            $table->decimal('remaining_quantity', 12, 2);
            $table->decimal('rate_per_liter', 10, 2);
            $table->decimal('total_amount', 12, 2);
            $table->foreignId('expense_id')->nullable()->constrained('expenses')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('diesel_issues', function (Blueprint $table) {
            $table->id();
            $table->date('issue_date');
            $table->decimal('quantity', 12, 2);
            $table->decimal('rate_per_liter', 10, 2)->default(0);
            $table->decimal('total_amount', 12, 2)->default(0);
            $table->foreignId('truck_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('hitachi_id')->nullable()->constrained('hitachi_machines')->nullOnDelete();
            $table->foreignId('trip_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('diesel_purchase_id')->nullable()->constrained('diesel_purchases')->nullOnDelete();
            $table->json('purchase_allocations')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('diesel_issues');
        Schema::dropIfExists('diesel_purchases');
    }
};
