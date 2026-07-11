<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hitachi_machines', function (Blueprint $table) {
            $table->string('owner')->nullable()->after('model');
            $table->decimal('hourly_rate', 12, 2)->default(0)->after('bucket_capacity');
            $table->decimal('daily_rate', 12, 2)->default(0)->after('hourly_rate');
            $table->decimal('monthly_rate', 12, 2)->default(0)->after('daily_rate');
        });

        Schema::create('hitachi_rentals', function (Blueprint $table) {
            $table->id();
            $table->string('rental_number')->unique();
            $table->foreignId('hitachi_id')->constrained('hitachi_machines')->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->string('site_location')->nullable();
            $table->enum('billing_type', ['hourly', 'daily', 'monthly']);
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->decimal('hours', 10, 2)->default(0);
            $table->decimal('days', 10, 2)->default(0);
            $table->decimal('months', 8, 2)->default(0);
            $table->decimal('rate', 12, 2)->default(0);
            $table->decimal('total_amount', 12, 2)->default(0);
            $table->decimal('advance_received', 12, 2)->default(0);
            $table->decimal('balance', 12, 2)->default(0);
            $table->string('operator_name')->nullable();
            $table->enum('status', ['booked', 'running', 'completed', 'cancelled'])->default('booked');
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
        Schema::dropIfExists('hitachi_rentals');

        Schema::table('hitachi_machines', function (Blueprint $table) {
            $table->dropColumn(['owner', 'hourly_rate', 'daily_rate', 'monthly_rate']);
        });
    }
};
