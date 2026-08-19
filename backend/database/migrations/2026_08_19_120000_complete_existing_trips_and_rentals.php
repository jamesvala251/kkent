<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('trips')->where('status', 'pending')->update(['status' => 'completed']);
        DB::table('hitachi_rentals')
            ->where('status', 'booked')
            ->where(function ($query) {
                $query->whereDate('start_date', '<=', now()->toDateString())
                    ->orWhereNull('start_date');
            })
            ->update(['status' => 'running']);
    }

    public function down(): void
    {
        //
    }
};
