<?php

namespace Tests\Feature;

use App\Models\TicketCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ValidationErrorTest extends TestCase
{
    use RefreshDatabase;

    public function test_event_api_returns_validation_messages(): void
    {
        $response = $this->postJson('/api/events', [
            'title' => '',
            'location' => '',
            'starts_at' => 'wrong-date',
            'status' => 'bad-status',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['title', 'location', 'starts_at', 'status'])
            ->assertJsonPath('errors.title.0', 'Введите название мероприятия.')
            ->assertJsonPath('errors.location.0', 'Введите место проведения.');
    }

    public function test_ticket_category_api_returns_validation_messages(): void
    {
        $this->seed();

        $event = TicketCategory::query()->firstOrFail()->event;

        $response = $this->postJson("/api/events/{$event->id}/ticket-categories", [
            'name' => '',
            'price' => -10,
            'quantity' => 0,
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'price', 'quantity'])
            ->assertJsonPath('errors.name.0', 'Введите название категории билетов.')
            ->assertJsonPath('errors.quantity.0', 'Количество билетов должно быть больше 0.');
    }

    public function test_booking_api_returns_validation_messages(): void
    {
        $response = $this->postJson('/api/bookings', [
            'ticket_category_id' => null,
            'customer_name' => '',
            'customer_email' => 'bad-email',
            'customer_phone' => '',
            'quantity' => 0,
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['ticket_category_id', 'customer_name', 'customer_email', 'customer_phone', 'quantity'])
            ->assertJsonPath('errors.customer_email.0', 'Введите корректную почту клиента.')
            ->assertJsonPath('errors.quantity.0', 'Количество билетов должно быть больше 0.');
    }

    public function test_booking_api_returns_capacity_error(): void
    {
        $this->seed();

        $category = TicketCategory::query()->firstOrFail();

        $response = $this->postJson('/api/bookings', [
            'ticket_category_id' => $category->id,
            'customer_name' => 'Тестовый клиент',
            'customer_email' => 'client@example.com',
            'customer_phone' => '+79990000000',
            'quantity' => $category->availableQuantity() + 1,
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['quantity'])
            ->assertJsonPath('message', 'Недостаточно доступных билетов.');
    }

    public function test_reports_api_returns_validation_messages(): void
    {
        $response = $this->getJson('/api/reports/bookings?date_from=bad-date&status=wrong');

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['date_from', 'status'])
            ->assertJsonPath('errors.date_from.0', 'Дата начала периода должна быть корректной.')
            ->assertJsonPath('errors.status.0', 'Выберите корректный статус бронирования.');
    }
}
