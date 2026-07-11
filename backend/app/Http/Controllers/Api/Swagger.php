<?php

/**
 * @OA\Info(
 *     title="KK Enterprise ERP API",
 *     version="1.0.0",
 *     description="Transport & Equipment Management ERP REST API"
 * )
 *
 * @OA\Server(
 *     url="/api",
 *     description="API Server"
 * )
 *
 * @OA\SecurityScheme(
 *     securityScheme="sanctum",
 *     type="http",
 *     scheme="bearer",
 *     bearerFormat="JWT"
 * )
 */

namespace App\Http\Controllers\Api;
