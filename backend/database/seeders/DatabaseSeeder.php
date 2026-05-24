<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\Event;
use App\Models\Role;
use App\Models\TicketCategory;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $adminRole = Role::query()->updateOrCreate(
            ['slug' => 'admin'],
            ['name' => 'Администратор']
        );

        $managerRole = Role::query()->updateOrCreate(
            ['slug' => 'manager'],
            ['name' => 'Менеджер']
        );

        $clientRole = Role::query()->updateOrCreate(
            ['slug' => 'client'],
            ['name' => 'Клиент']
        );

        User::query()->updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'role_id' => $adminRole->id,
                'name' => 'admin',
                'password' => Hash::make('admin'),
            ]
        );

        User::query()->updateOrCreate(
            ['email' => 'manager@example.com'],
            [
                'role_id' => $managerRole->id,
                'name' => 'Менеджер мероприятий',
                'password' => Hash::make('password'),
            ]
        );

        $client = User::query()->updateOrCreate(
            ['email' => 'client@example.com'],
            [
                'role_id' => $clientRole->id,
                'name' => 'Иван Петров',
                'password' => Hash::make('client'),
            ]
        );

        $concert = Event::query()->create([
            'title' => 'Летний музыкальный фестиваль',
            'description' => 'Большой концерт с несколькими зонами и категориями билетов.',
            'location' => 'Городской парк',
            'starts_at' => now()->addDays(14)->setTime(19, 0),
            'status' => 'published',
        ]);

        $theater = Event::query()->create([
            'title' => 'Премьера спектакля',
            'description' => 'Театральное мероприятие с одной основной категорией билетов.',
            'location' => 'Драматический театр',
            'starts_at' => now()->addDays(21)->setTime(18, 30),
            'status' => 'published',
        ]);

        $standard = TicketCategory::query()->create([
            'event_id' => $concert->id,
            'name' => 'Стандарт',
            'price' => 1200,
            'quantity' => 300,
        ]);

        $fanZone = TicketCategory::query()->create([
            'event_id' => $concert->id,
            'name' => 'Фан-зона',
            'price' => 2200,
            'quantity' => 120,
        ]);

        $vip = TicketCategory::query()->create([
            'event_id' => $concert->id,
            'name' => 'VIP',
            'price' => 4500,
            'quantity' => 40,
        ]);

        $parterre = TicketCategory::query()->create([
            'event_id' => $theater->id,
            'name' => 'Партер',
            'price' => 1800,
            'quantity' => 160,
        ]);

        Booking::query()->create([
            'user_id' => $client->id,
            'ticket_category_id' => $standard->id,
            'customer_name' => 'Иван Петров',
            'customer_email' => 'client@example.com',
            'customer_phone' => '+7 900 111-22-33',
            'quantity' => 2,
            'status' => 'reserved',
            'total_price' => 2400,
            'reserved_at' => now()->subDays(1),
        ]);

        Booking::query()->create([
            'user_id' => $client->id,
            'ticket_category_id' => $fanZone->id,
            'customer_name' => 'Иван Петров',
            'customer_email' => 'client@example.com',
            'customer_phone' => '+7 900 111-22-33',
            'quantity' => 1,
            'status' => 'paid',
            'total_price' => 2200,
            'reserved_at' => now()->subDays(3),
            'paid_at' => now()->subDays(2),
        ]);

        Booking::query()->create([
            'ticket_category_id' => $vip->id,
            'customer_name' => 'Мария Смирнова',
            'customer_email' => 'smirnova@example.com',
            'customer_phone' => '+7 900 222-33-44',
            'quantity' => 2,
            'status' => 'cancelled',
            'total_price' => 9000,
            'reserved_at' => now()->subDays(4),
            'cancelled_at' => now()->subDays(1),
        ]);

        Booking::query()->create([
            'ticket_category_id' => $parterre->id,
            'customer_name' => 'Анна Кузнецова',
            'customer_email' => 'anna@example.com',
            'customer_phone' => '+7 900 333-44-55',
            'quantity' => 3,
            'status' => 'reserved',
            'total_price' => 5400,
            'reserved_at' => now()->subHours(5),
        ]);
    }
}
