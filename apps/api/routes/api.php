<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ConfirmationController;
use App\Http\Controllers\ContentController;
use App\Http\Controllers\MembershipApplicationController;
use App\Http\Controllers\UserController;
use App\Http\Middleware\AuthenticateApiToken;
use App\Http\Middleware\RequireAdministrator;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('/club', [ContentController::class, 'club']);
    Route::get('/events', [ContentController::class, 'events']);
    Route::get('/events/{slug}', [ContentController::class, 'event']);
    Route::get('/news', [ContentController::class, 'news']);
    Route::get('/news/{slug}', [ContentController::class, 'article']);
    Route::get('/formations', [ContentController::class, 'formations']);
    Route::get('/conventions', [ContentController::class, 'conventions']);
    Route::get('/conventions/{slug}', [ContentController::class, 'convention']);

    Route::post('/users', [UserController::class, 'store']);
    Route::post('/users/confirmation-code', [ConfirmationController::class, 'requestCode']);
    Route::post('/users/confirm', [ConfirmationController::class, 'confirm']);
    Route::post('/login', [AuthController::class, 'login']);

    // Public membership application submission
    Route::post('/applications', [MembershipApplicationController::class, 'store']);

    Route::middleware(AuthenticateApiToken::class)->group(function (): void {
        Route::get('/users/{userId}', [UserController::class, 'show']);
        Route::patch('/users/{userId}', [UserController::class, 'update']);

        Route::middleware(RequireAdministrator::class)->group(function (): void {
            Route::get('/users', [UserController::class, 'index']);
            Route::delete('/users/{userId}', [UserController::class, 'destroy']);

            // Membership application management (admin only)
            Route::get('/applications', [MembershipApplicationController::class, 'index']);
            Route::get('/applications/{id}', [MembershipApplicationController::class, 'show']);
            Route::post('/applications/{id}/hr-review', [MembershipApplicationController::class, 'hrReview']);
            Route::post('/applications/{id}/president-review', [MembershipApplicationController::class, 'presidentReview']);
        });
    });
});
