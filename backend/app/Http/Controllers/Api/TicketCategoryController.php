<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\TicketCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TicketCategoryController extends Controller
{
    public function index(Event $event): JsonResponse
    {
        $categories = $event->ticketCategories()
            ->orderBy('price')
            ->get()
            ->map(fn (TicketCategory $category) => $this->categoryData($category));

        return response()->json($categories);
    }

    public function store(Request $request, Event $event): JsonResponse
    {
        $category = $event->ticketCategories()->create(
            $this->validatedData($request, $event->id)
        );

        return response()->json($this->categoryData($category), 201);
    }

    public function show(TicketCategory $ticketCategory): JsonResponse
    {
        return response()->json(
            $this->categoryData($ticketCategory->load('event'))
        );
    }

    public function update(Request $request, TicketCategory $ticketCategory): JsonResponse
    {
        $ticketCategory->update(
            $this->validatedData($request, $ticketCategory->event_id, $ticketCategory)
        );

        return response()->json(
            $this->categoryData($ticketCategory->refresh())
        );
    }

    public function destroy(TicketCategory $ticketCategory): JsonResponse
    {
        if ($ticketCategory->bookings()->exists()) {
            return response()->json([
                'message' => 'Нельзя удалить категорию билетов, по которой уже есть бронирования.',
            ], 409);
        }

        $ticketCategory->delete();

        return response()->json(null, 204);
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedData(Request $request, int $eventId, ?TicketCategory $ticketCategory = null): array
    {
        $nameRules = [
            $ticketCategory ? 'sometimes' : 'required',
            'string',
            'max:255',
            Rule::unique('ticket_categories', 'name')
                ->where('event_id', $eventId)
                ->ignore($ticketCategory),
        ];

        return $request->validate([
            'name' => $nameRules,
            'price' => [$ticketCategory ? 'sometimes' : 'required', 'numeric', 'min:0'],
            'quantity' => [$ticketCategory ? 'sometimes' : 'required', 'integer', 'min:1'],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function categoryData(TicketCategory $category): array
    {
        return [
            'id' => $category->id,
            'event_id' => $category->event_id,
            'name' => $category->name,
            'price' => $category->price,
            'quantity' => $category->quantity,
            'active_booked_quantity' => $category->activeBookedQuantity(),
            'available_quantity' => $category->availableQuantity(),
            'created_at' => $category->created_at,
            'updated_at' => $category->updated_at,
        ];
    }
}
