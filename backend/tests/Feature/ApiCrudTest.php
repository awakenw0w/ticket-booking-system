<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Event;
use App\Models\Role;
use App\Models\TicketCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class ApiCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_events_can_be_managed_through_api(): void
    {
        $adminHeaders = $this->authHeaders('admin');

        $response = $this->postJson('/api/events', [
            'title' => 'Конференция по разработке',
            'description' => 'Мероприятие для проверки CRUD API.',
            'location' => 'Конгресс-холл',
            'starts_at' => now()->addMonth()->toDateTimeString(),
            'status' => 'published',
        ], $adminHeaders);

        $response
            ->assertCreated()
            ->assertJsonPath('title', 'Конференция по разработке')
            ->assertJsonPath('status', 'published');

        $eventId = $response->json('id');

        $this->getJson('/api/events')
            ->assertOk()
            ->assertJsonFragment(['title' => 'Конференция по разработке']);

        $this->patchJson("/api/events/{$eventId}", [
            'title' => 'Обновленная конференция',
            'description' => 'Обновленное описание.',
            'location' => 'Главный зал',
            'starts_at' => now()->addMonths(2)->toDateTimeString(),
            'status' => 'draft',
        ], $adminHeaders)
            ->assertOk()
            ->assertJsonPath('title', 'Обновленная конференция')
            ->assertJsonPath('status', 'draft');

        $this->deleteJson("/api/events/{$eventId}", [], $adminHeaders)
            ->assertNoContent();

        $this->assertDatabaseMissing('events', ['id' => $eventId]);
    }

    public function test_ticket_categories_can_be_managed_through_api(): void
    {
        $adminHeaders = $this->authHeaders('admin');

        $event = Event::query()->create([
            'title' => 'Фестиваль',
            'description' => 'Тестовое мероприятие.',
            'location' => 'Парк',
            'starts_at' => now()->addWeek(),
            'status' => 'published',
        ]);

        $response = $this->postJson("/api/events/{$event->id}/ticket-categories", [
            'name' => 'VIP',
            'price' => 4500,
            'quantity' => 25,
        ], $adminHeaders);

        $response
            ->assertCreated()
            ->assertJsonPath('name', 'VIP')
            ->assertJsonPath('available_quantity', 25);

        $categoryId = $response->json('id');

        $this->getJson("/api/events/{$event->id}/ticket-categories")
            ->assertOk()
            ->assertJsonFragment(['name' => 'VIP']);

        $this->patchJson("/api/ticket-categories/{$categoryId}", [
            'price' => 5000,
            'quantity' => 30,
        ], $adminHeaders)
            ->assertOk()
            ->assertJsonPath('quantity', 30)
            ->assertJsonPath('available_quantity', 30);

        $this->deleteJson("/api/ticket-categories/{$categoryId}", [], $adminHeaders)
            ->assertNoContent();

        $this->assertDatabaseMissing('ticket_categories', ['id' => $categoryId]);
    }

    public function test_booking_flow_checks_capacity_and_supports_cancel_and_pay(): void
    {
        $clientHeaders = $this->authHeaders('client');

        $event = Event::query()->create([
            'title' => 'Спектакль',
            'description' => 'Тестовый спектакль.',
            'location' => 'Театр',
            'starts_at' => now()->addWeek(),
            'status' => 'published',
        ]);

        $category = TicketCategory::query()->create([
            'event_id' => $event->id,
            'name' => 'Партер',
            'price' => 1000,
            'quantity' => 3,
        ]);

        $bookingResponse = $this->postJson('/api/bookings', [
            'ticket_category_id' => $category->id,
            'customer_name' => 'Иван Петров',
            'customer_email' => 'ivan@example.com',
            'customer_phone' => '+7 900 111-22-33',
            'quantity' => 2,
        ], $clientHeaders);

        $bookingResponse
            ->assertCreated()
            ->assertJsonPath('status', 'reserved')
            ->assertJsonPath('total_price', '2000.00');

        $bookingId = $bookingResponse->json('id');

        $this->postJson('/api/bookings', [
            'ticket_category_id' => $category->id,
            'customer_name' => 'Мария Смирнова',
            'customer_email' => 'maria@example.com',
            'customer_phone' => '+7 900 222-33-44',
            'quantity' => 2,
        ], $clientHeaders)
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Недостаточно доступных билетов.');

        $this->patchJson("/api/bookings/{$bookingId}/cancel", [], $clientHeaders)
            ->assertOk()
            ->assertJsonPath('status', 'cancelled');

        $paidBookingResponse = $this->postJson('/api/bookings', [
            'ticket_category_id' => $category->id,
            'customer_name' => 'Мария Смирнова',
            'customer_email' => 'maria@example.com',
            'customer_phone' => '+7 900 222-33-44',
            'quantity' => 3,
        ], $clientHeaders);

        $paidBookingResponse->assertCreated();

        $paidBookingId = $paidBookingResponse->json('id');

        $this->patchJson("/api/bookings/{$paidBookingId}/pay", [], $clientHeaders)
            ->assertOk()
            ->assertJsonPath('status', 'paid');

        $this->deleteJson("/api/bookings/{$paidBookingId}", [], $clientHeaders)
            ->assertStatus(409);

        $this->assertDatabaseHas('bookings', [
            'id' => $bookingId,
            'status' => 'cancelled',
        ]);

        $this->assertSame(1, Booking::query()->where('status', 'paid')->count());
    }

    /**
     * @return array<string, string>
     */
    private function authHeaders(string $roleSlug): array
    {
        $role = Role::query()->create([
            'slug' => $roleSlug,
            'name' => ucfirst($roleSlug),
        ]);

        $user = User::query()->create([
            'role_id' => $role->id,
            'name' => "{$roleSlug}_user",
            'email' => "{$roleSlug}@example.com",
            'password' => Hash::make('password'),
            'remember_token' => Str::random(64),
        ]);

        return [
            'Authorization' => "Bearer {$user->remember_token}",
        ];
    }
}
