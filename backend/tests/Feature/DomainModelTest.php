<?php

namespace Tests\Feature;

use App\Models\Booking;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class DomainModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_domain_tables_contain_required_columns(): void
    {
        $this->assertTrue(Schema::hasColumns('roles', [
            'id',
            'slug',
            'name',
            'created_at',
            'updated_at',
        ]));

        $this->assertTrue(Schema::hasColumns('events', [
            'id',
            'title',
            'description',
            'location',
            'starts_at',
            'status',
            'created_at',
            'updated_at',
        ]));

        $this->assertTrue(Schema::hasColumns('ticket_categories', [
            'id',
            'event_id',
            'name',
            'price',
            'quantity',
            'created_at',
            'updated_at',
        ]));

        $this->assertTrue(Schema::hasColumns('bookings', [
            'id',
            'user_id',
            'ticket_category_id',
            'customer_name',
            'customer_email',
            'customer_phone',
            'quantity',
            'status',
            'total_price',
            'reserved_at',
            'cancelled_at',
            'paid_at',
            'created_at',
            'updated_at',
        ]));

        $this->assertTrue(Schema::hasColumn('users', 'role_id'));
    }

    public function test_database_seeder_creates_domain_records(): void
    {
        $this->seed();

        $this->assertDatabaseHas('roles', ['slug' => 'admin']);
        $this->assertDatabaseHas('roles', ['slug' => 'manager']);
        $this->assertDatabaseHas('roles', ['slug' => 'client']);
        $this->assertDatabaseHas('events', ['title' => 'Летний музыкальный фестиваль']);
        $this->assertDatabaseHas('ticket_categories', ['name' => 'VIP']);
        $this->assertDatabaseHas('bookings', ['status' => 'paid']);
        $this->assertDatabaseCount('events', 2);
        $this->assertDatabaseCount('ticket_categories', 4);
        $this->assertDatabaseCount('bookings', 4);
    }

    public function test_booking_is_connected_to_user_ticket_category_and_event(): void
    {
        $this->seed();

        $booking = Booking::query()
            ->where('status', 'paid')
            ->firstOrFail();

        $this->assertSame('Иван Петров', $booking->user->name);
        $this->assertSame('Клиент', $booking->user->role->name);
        $this->assertSame('Фан-зона', $booking->ticketCategory->name);
        $this->assertSame('Летний музыкальный фестиваль', $booking->ticketCategory->event->title);
    }
}
