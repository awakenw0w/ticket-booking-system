<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\TicketCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $bookings = Booking::query()
            ->with(['user.role', 'ticketCategory.event'])
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->when($request->filled('customer_email'), fn ($query) => $query->where('customer_email', $request->string('customer_email')))
            ->when($request->filled('event_id'), function ($query) use ($request) {
                $query->whereHas('ticketCategory', fn ($categoryQuery) => $categoryQuery->where('event_id', $request->integer('event_id')));
            })
            ->latest('reserved_at')
            ->get()
            ->map(fn (Booking $booking) => $this->bookingData($booking));

        return response()->json($bookings);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'user_id' => ['nullable', 'exists:users,id'],
            'ticket_category_id' => ['required', 'exists:ticket_categories,id'],
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_email' => ['required', 'email', 'max:255'],
            'customer_phone' => ['required', 'string', 'max:50'],
            'quantity' => ['required', 'integer', 'min:1'],
        ]);

        $ticketCategory = TicketCategory::query()->findOrFail($data['ticket_category_id']);

        if ($data['quantity'] > $ticketCategory->availableQuantity()) {
            return $this->notEnoughTicketsResponse($ticketCategory);
        }

        $booking = Booking::query()->create([
            ...$data,
            'status' => 'reserved',
            'total_price' => $ticketCategory->price * $data['quantity'],
            'reserved_at' => now(),
        ]);

        return response()->json($this->bookingData($booking), 201);
    }

    public function show(Booking $booking): JsonResponse
    {
        return response()->json($this->bookingData($booking));
    }

    public function update(Request $request, Booking $booking): JsonResponse
    {
        if ($booking->status !== 'reserved') {
            return response()->json([
                'message' => 'Изменять можно только активное бронирование.',
            ], 409);
        }

        $data = $request->validate([
            'user_id' => ['nullable', 'exists:users,id'],
            'ticket_category_id' => ['sometimes', 'exists:ticket_categories,id'],
            'customer_name' => ['sometimes', 'string', 'max:255'],
            'customer_email' => ['sometimes', 'email', 'max:255'],
            'customer_phone' => ['sometimes', 'string', 'max:50'],
            'quantity' => ['sometimes', 'integer', 'min:1'],
        ]);

        $ticketCategory = TicketCategory::query()->findOrFail(
            $data['ticket_category_id'] ?? $booking->ticket_category_id
        );

        $quantity = $data['quantity'] ?? $booking->quantity;
        $availableQuantity = $ticketCategory->availableQuantity();

        if ($ticketCategory->id === $booking->ticket_category_id) {
            $availableQuantity += $booking->quantity;
        }

        if ($quantity > $availableQuantity) {
            return $this->notEnoughTicketsResponse($ticketCategory, $availableQuantity);
        }

        $booking->update([
            ...$data,
            'ticket_category_id' => $ticketCategory->id,
            'quantity' => $quantity,
            'total_price' => $ticketCategory->price * $quantity,
        ]);

        return response()->json($this->bookingData($booking->refresh()));
    }

    public function destroy(Booking $booking): JsonResponse
    {
        if ($booking->status === 'paid') {
            return response()->json([
                'message' => 'Нельзя удалить оплаченное бронирование.',
            ], 409);
        }

        $booking->delete();

        return response()->json(null, 204);
    }

    public function cancel(Booking $booking): JsonResponse
    {
        if ($booking->status !== 'reserved') {
            return response()->json([
                'message' => 'Отменить можно только активное бронирование.',
            ], 409);
        }

        $booking->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ]);

        return response()->json($this->bookingData($booking->refresh()));
    }

    public function pay(Booking $booking): JsonResponse
    {
        if ($booking->status !== 'reserved') {
            return response()->json([
                'message' => 'Оплатить можно только активное бронирование.',
            ], 409);
        }

        $booking->update([
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        return response()->json($this->bookingData($booking->refresh()));
    }

    private function notEnoughTicketsResponse(TicketCategory $ticketCategory, ?int $availableQuantity = null): JsonResponse
    {
        $availableQuantity ??= $ticketCategory->availableQuantity();

        return response()->json([
            'message' => 'Недостаточно доступных билетов.',
            'errors' => [
                'quantity' => ["Доступно билетов: {$availableQuantity}."],
            ],
        ], 422);
    }

    /**
     * @return array<string, mixed>
     */
    private function bookingData(Booking $booking): array
    {
        $booking->loadMissing(['user.role', 'ticketCategory.event']);

        return [
            'id' => $booking->id,
            'user_id' => $booking->user_id,
            'ticket_category_id' => $booking->ticket_category_id,
            'customer_name' => $booking->customer_name,
            'customer_email' => $booking->customer_email,
            'customer_phone' => $booking->customer_phone,
            'quantity' => $booking->quantity,
            'status' => $booking->status,
            'total_price' => $booking->total_price,
            'reserved_at' => $booking->reserved_at,
            'cancelled_at' => $booking->cancelled_at,
            'paid_at' => $booking->paid_at,
            'ticket_category' => [
                'id' => $booking->ticketCategory->id,
                'name' => $booking->ticketCategory->name,
                'price' => $booking->ticketCategory->price,
                'event' => [
                    'id' => $booking->ticketCategory->event->id,
                    'title' => $booking->ticketCategory->event->title,
                    'starts_at' => $booking->ticketCategory->event->starts_at,
                ],
            ],
            'user' => $booking->user ? [
                'id' => $booking->user->id,
                'name' => $booking->user->name,
                'email' => $booking->user->email,
                'role' => $booking->user->role?->name,
            ] : null,
        ];
    }
}
