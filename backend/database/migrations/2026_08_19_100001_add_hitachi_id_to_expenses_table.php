<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->foreignId('hitachi_id')
                ->nullable()
                ->after('trip_id')
                ->constrained('hitachi_machines')
                ->nullOnDelete();
        });

        $rentals = DB::table('hitachi_rentals')->pluck('hitachi_id', 'id');

        foreach (DB::table('expenses')->whereNotNull('hitachi_rental_id')->whereNull('hitachi_id')->get() as $expense) {
            $hitachiId = $rentals[$expense->hitachi_rental_id] ?? null;
            if ($hitachiId) {
                DB::table('expenses')->where('id', $expense->id)->update(['hitachi_id' => $hitachiId]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->dropConstrainedForeignId('hitachi_id');
        });
    }
};
