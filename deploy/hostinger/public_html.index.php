<?php

/**
 * Hostinger document root entry point.
 *
 * Place this file as: domains/kk-enterpriseindia.com/public_html/index.php
 * Adjust $laravelRoot if your Laravel app lives in a different folder.
 */

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

$laravelRoot = dirname(__DIR__, 3) . '/kk-enterprise';

if (file_exists($maintenance = $laravelRoot . '/storage/framework/maintenance.php')) {
    require $maintenance;
}

require $laravelRoot . '/vendor/autoload.php';

/** @var Application $app */
$app = require_once $laravelRoot . '/bootstrap/app.php';

$app->handleRequest(Request::capture());
