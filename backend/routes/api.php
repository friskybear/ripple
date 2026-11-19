<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\CommunityController;
use App\Http\Controllers\ConfirmationController;
use App\Http\Controllers\SignalController;
use App\Http\Controllers\SignalTransitionController;
use App\Models\Community;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

Route::post("/auth/register", [AuthController::class, "register"]);
Route::post("/auth/login", [AuthController::class, "login"])->middleware(
    "throttle:6,1",
);

Route::get("/health", function () {
    return response()->json([
        "status" => "ok",
        "application" => "Ripple API",
    ]);
});

Route::get("/ready", function () {
    try {
        DB::connection()->getPdo();
    } catch (\Throwable) {
        return response()->json(["status" => "unavailable"], 503);
    }

    return response()->json(["status" => "ok"]);
});

Route::middleware("auth:sanctum")->group(function () {
    Route::get("/me", [AuthController::class, "me"]);
    Route::post("/auth/logout", [AuthController::class, "logout"]);

    Route::get("/communities", [CommunityController::class, "index"])->can(
        "viewAny",
        Community::class,
    );
    Route::post("/communities", [CommunityController::class, "store"])->can(
        "create",
        Community::class,
    );
    Route::post("/communities/join", [CommunityController::class, "join"])->can(
        "join",
        Community::class,
    );

    Route::get("/communities/{community}/signals", [
        SignalController::class,
        "index",
    ])->can("view", "community");
    Route::post("/communities/{community}/signals", [
        SignalController::class,
        "store",
    ])
        ->can("createSignal", "community")
        ->middleware("throttle:30,1");
    Route::get("/signals/{signal}", [SignalController::class, "show"])->can(
        "view",
        "signal",
    );
    Route::post("/signals/{signal}/transition", [
        SignalTransitionController::class,
        "update",
    ])->can("transition", "signal");

    Route::post("/signals/{signal}/confirm", [
        ConfirmationController::class,
        "store",
    ])
        ->can("confirm", "signal")
        ->middleware("throttle:30,1");
    Route::delete("/signals/{signal}/confirm", [
        ConfirmationController::class,
        "destroy",
    ])->can("confirm", "signal");

    Route::get("/signals/{signal}/comments", [
        CommentController::class,
        "index",
    ])->can("comment", "signal");
    Route::post("/signals/{signal}/comments", [
        CommentController::class,
        "store",
    ])->can("comment", "signal");
});
