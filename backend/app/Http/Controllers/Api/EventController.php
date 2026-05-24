<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EventController extends Controller
{
    public function index(): JsonResponse
    {
        $events = Event::query()
            ->withCount('ticketCategories')
            ->orderBy('starts_at')
            ->get();

        return response()->json($events);
    }

    public function store(Request $request): JsonResponse
    {
        $event = Event::query()->create($this->validatedData($request));

        return response()->json($event, 201);
    }

    public function show(Event $event): JsonResponse
    {
        return response()->json(
            $event->load('ticketCategories')
        );
    }

    public function update(Request $request, Event $event): JsonResponse
    {
        $event->update($this->validatedData($request));

        return response()->json($event->refresh());
    }

    public function destroy(Event $event): JsonResponse
    {
        $event->delete();

        return response()->json(null, 204);
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedData(Request $request): array
    {
        return $request->validate(
            [
                'title' => ['required', 'string', 'max:255'],
                'description' => ['nullable', 'string'],
                'location' => ['required', 'string', 'max:255'],
                'starts_at' => ['required', 'date'],
                'status' => ['required', 'string', 'in:draft,published,finished,cancelled'],
            ],
            [
                'title.required' => 'Введите название мероприятия.',
                'title.max' => 'Название мероприятия не должно быть длиннее 255 символов.',
                'location.required' => 'Введите место проведения.',
                'starts_at.required' => 'Введите дату и время мероприятия.',
                'starts_at.date' => 'Дата и время мероприятия должны быть корректными.',
                'status.required' => 'Выберите статус мероприятия.',
                'status.in' => 'Выберите корректный статус мероприятия.',
            ],
        );
    }
}
