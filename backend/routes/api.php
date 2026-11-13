<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::prefix("auth")
    ->controller(AuthController::class)
    ->group(function () {
        Route::post("/register", "register");
        Route::post("/login", "login")->middleware("throttle:6,1");

        Route::middleware("auth:sanctum")->group(function () {
            Route::post("/logout", "logout");
            Route::get("/me", "me");
        });
    });

Route::get("/health", function () {
    return response()->json([
        "status" => "ok",
        "application" => "Ripple API",
    ]);
});
