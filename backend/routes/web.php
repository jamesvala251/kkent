<?php

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Route;

Route::get('/{any?}', function (?string $any = null) {
    $spa = public_path('app.html');

    if (File::exists($spa)) {
        return response()->file($spa, ['Content-Type' => 'text/html; charset=UTF-8']);
    }

    return view('welcome');
})->where('any', '.*');
