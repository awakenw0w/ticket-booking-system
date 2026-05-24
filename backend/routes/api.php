<?php

use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\TicketCategoryController;
use Illuminate\Support\Facades\Route;

Route::apiResource('events', EventController::class);
Route::get('events/{event}/ticket-categories', [TicketCategoryController::class, 'index']);
Route::post('events/{event}/ticket-categories', [TicketCategoryController::class, 'store']);
Route::apiResource('ticket-categories', TicketCategoryController::class)->except(['index', 'store']);

Route::patch('bookings/{booking}/cancel', [BookingController::class, 'cancel']);
Route::patch('bookings/{booking}/pay', [BookingController::class, 'pay']);
Route::apiResource('bookings', BookingController::class);
