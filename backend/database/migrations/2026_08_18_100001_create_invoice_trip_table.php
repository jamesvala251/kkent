<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('billing_month', 7)->nullable()->after('due_date');
        });

        Schema::create('invoice_trip', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->foreignId('trip_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique('trip_id');
            $table->index('invoice_id');
        });

        $invoices = DB::table('invoices')
            ->whereNotNull('trip_id')
            ->whereNull('deleted_at')
            ->get(['id', 'trip_id']);

        $now = now();
        foreach ($invoices as $invoice) {
            DB::table('invoice_trip')->insertOrIgnore([
                'invoice_id' => $invoice->id,
                'trip_id' => $invoice->trip_id,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $startDate = DB::table('trips')->where('id', $invoice->trip_id)->value('start_date');
            if ($startDate) {
                DB::table('invoices')->where('id', $invoice->id)->update([
                    'billing_month' => substr((string) $startDate, 0, 7),
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_trip');

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn('billing_month');
        });
    }
};
