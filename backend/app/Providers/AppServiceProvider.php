<?php

namespace App\Providers;

use App\Models\Customer;
use App\Models\Driver;
use App\Models\HitachiMachine;
use App\Models\Truck;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Relation::morphMap([
            'truck' => Truck::class,
            'hitachi' => HitachiMachine::class,
            'driver' => Driver::class,
            'customer' => Customer::class,
        ]);
    }
}
