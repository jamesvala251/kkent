<?php

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Route;

Route::get('/{any?}', function (?string $any = null) {
    $candidates = [
        public_path('app.html'),
        // Hostinger layout: Laravel in public_html/backend, SPA in public_html/
        base_path('../app.html'),
    ];

    foreach ($candidates as $spa) {
        if (File::exists($spa)) {
            return response()->file($spa, ['Content-Type' => 'text/html; charset=UTF-8']);
        }
    }

    return view('welcome');
})->where('any', '.*');
