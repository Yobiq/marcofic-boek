<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ArtistController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\ItineraryController;
use App\Http\Controllers\Api\ContractController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\TeamController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\DeviceController;
use Illuminate\Support\Facades\Route;

// Test route
Route::get('/test', function () {
    return response()->json(['message' => 'API is working!', 'timestamp' => now()]);
});

// Public routes
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/team/accept-invitation/{token}', [TeamController::class, 'acceptInvitation']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/refresh', [AuthController::class, 'refresh']);
    Route::post('/auth/switch-context', [AuthController::class, 'switchContext']);
    Route::get('/auth/contexts', [AuthController::class, 'getAvailableContexts']);
    Route::get('/me', [AuthController::class, 'me']);

    // Artist-specific routes
    Route::prefix('artist')->group(function () {
        Route::get('/calendar', [ArtistController::class, 'calendar']);
        Route::get('/bookings', [ArtistController::class, 'bookings']);
        Route::get('/bookings/{id}', [ArtistController::class, 'booking']);
        Route::get('/contacts', [ArtistController::class, 'contacts']);
        Route::get('/profile', [ArtistController::class, 'profile']);
        Route::put('/profile', [ArtistController::class, 'updateProfile']);
        Route::post('/avatar', [ArtistController::class, 'uploadAvatar']);
    });

    // Bookings
    Route::prefix('bookings')->group(function () {
        Route::post('/{id}/check-in', [BookingController::class, 'checkIn']);
        Route::get('/{id}/contracts', [ContractController::class, 'bookingContracts']);
        Route::get('/{id}/itinerary', [ItineraryController::class, 'bookingItinerary']);
    });

    // Tours
    Route::prefix('tours')->group(function () {
        Route::get('/{id}/itinerary', [ItineraryController::class, 'tourItinerary']);
    });

    // Contracts
    Route::prefix('contracts')->group(function () {
        Route::get('/{id}', [ContractController::class, 'show']);
        Route::get('/{id}/pdf', [ContractController::class, 'pdf']);
    });

    // Itinerary
    Route::prefix('itinerary-items')->group(function () {
        Route::post('/{id}/check-in', [ItineraryController::class, 'checkIn']);
    });

    // Chat
    Route::prefix('chat')->group(function () {
        Route::get('/threads', [ChatController::class, 'threads']);
        Route::get('/threads/{id}', [ChatController::class, 'messages']);
        Route::post('/messages', [ChatController::class, 'sendMessage']);
        Route::post('/threads', [ChatController::class, 'createThread']);
    });

    // Team Management
    Route::prefix('team')->group(function () {
        Route::get('/members', [TeamController::class, 'getTeamMembers']);
        Route::post('/invite', [TeamController::class, 'inviteTeamMember']);
        Route::get('/invitations', [TeamController::class, 'getPendingInvitations']);
        Route::put('/members/{id}', [TeamController::class, 'updateTeamMember']);
        Route::delete('/members/{id}', [TeamController::class, 'removeTeamMember']);
        Route::post('/set-own-agent', [TeamController::class, 'setAsOwnAgent']);
        Route::get('/roles', [TeamController::class, 'getAvailableRoles']);
    });

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/read', [NotificationController::class, 'markAsRead']);

    // Device registration
    Route::patch('/devices', [DeviceController::class, 'register']);
});

// Public share routes (no auth required)
Route::prefix('share')->group(function () {
    Route::get('/{token}/json', [ItineraryController::class, 'shareJson']);
    Route::get('/{token}/pdf', [ItineraryController::class, 'sharePdf']);
});

Route::prefix('booking-overview')->group(function () {
    Route::get('/{token}/json', [BookingController::class, 'overviewJson']);
    Route::get('/{token}/pdf', [BookingController::class, 'overviewPdf']);
});
