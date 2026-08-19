<?php

use App\Services\NotificationService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('notifications:generate', function (NotificationService $notifications) {
    $count = $notifications->generate();
    $this->info("Generated {$count} notification rows");
})->purpose('Create expiry and overdue invoice alerts');

Schedule::command('notifications:generate')->dailyAt('07:00');
