<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\TicketCategoryController;
use Illuminate\Support\Facades\Route;

Route::post('auth/register', [AuthController::class, 'register']);
Route::post('auth/login', [AuthController::class, 'login']);
Route::middleware('api.user')->get('auth/me', [AuthController::class, 'me']);
Route::middleware('api.user')->post('auth/logout', [AuthController::class, 'logout']);

Route::middleware('api.user:admin')->group(function (): void {
    Route::get('reports/bookings', [ReportController::class, 'bookings']);
    Route::get('reports/revenue', [ReportController::class, 'revenue']);
    Route::get('reports/events-occupancy', [ReportController::class, 'eventsOccupancy']);

    Route::post('events', [EventController::class, 'store']);
    Route::patch('events/{event}', [EventController::class, 'update']);
    Route::delete('events/{event}', [EventController::class, 'destroy']);

    Route::post('events/{event}/ticket-categories', [TicketCategoryController::class, 'store']);
    Route::patch('ticket-categories/{ticketCategory}', [TicketCategoryController::class, 'update']);
    Route::delete('ticket-categories/{ticketCategory}', [TicketCategoryController::class, 'destroy']);
});

Route::get('events', [EventController::class, 'index']);
Route::get('events/{event}', [EventController::class, 'show']);
Route::get('events/{event}/ticket-categories', [TicketCategoryController::class, 'index']);
Route::get('ticket-categories/{ticketCategory}', [TicketCategoryController::class, 'show']);

Route::middleware('api.user')->group(function (): void {
    Route::patch('bookings/{booking}/cancel', [BookingController::class, 'cancel']);
    Route::patch('bookings/{booking}/pay', [BookingController::class, 'pay']);
    Route::apiResource('bookings', BookingController::class);
});
