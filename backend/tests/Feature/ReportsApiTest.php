<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class ReportsApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_bookings_report_returns_summary_and_status_groups(): void
    {
        $this->seed();

        $response = $this->getJson('/api/reports/bookings', $this->adminHeaders());

        $response
            ->assertOk()
            ->assertJsonPath('summary.bookings_count', 4)
            ->assertJsonPath('summary.tickets_count', 8)
            ->assertJsonPath('summary.total_amount', 19000);

        $statuses = collect($response->json('by_status'))->pluck('bookings_count', 'status');

        $this->assertSame(2, $statuses['reserved']);
        $this->assertSame(1, $statuses['paid']);
        $this->assertSame(1, $statuses['cancelled']);
    }

    public function test_revenue_report_counts_only_paid_bookings(): void
    {
        $this->seed();

        $response = $this->getJson('/api/reports/revenue', $this->adminHeaders());

        $response
            ->assertOk()
            ->assertJsonPath('summary.paid_bookings_count', 1)
            ->assertJsonPath('summary.paid_tickets_count', 1)
            ->assertJsonPath('summary.total_revenue', 2200)
            ->assertJsonPath('by_events.0.event_title', 'Летний музыкальный фестиваль')
            ->assertJsonPath('by_events.0.revenue', 2200);
    }

    public function test_occupancy_report_returns_event_capacity_metrics(): void
    {
        $this->seed();

        $response = $this->getJson('/api/reports/events-occupancy', $this->adminHeaders());

        $response->assertOk();

        $events = collect($response->json('events'))->keyBy('event_title');
        $concert = $events['Летний музыкальный фестиваль'];
        $theater = $events['Премьера спектакля'];

        $this->assertSame(460, $concert['total_tickets']);
        $this->assertSame(2, $concert['reserved_tickets']);
        $this->assertSame(1, $concert['paid_tickets']);
        $this->assertSame(2, $concert['cancelled_tickets']);
        $this->assertSame(457, $concert['available_tickets']);
        $this->assertSame(2200, $concert['revenue']);

        $this->assertSame(160, $theater['total_tickets']);
        $this->assertSame(3, $theater['reserved_tickets']);
        $this->assertSame(157, $theater['available_tickets']);
    }

    /**
     * @return array<string, string>
     */
    private function adminHeaders(): array
    {
        $role = Role::query()->firstOrCreate(
            ['slug' => 'admin'],
            ['name' => 'Администратор'],
        );

        $user = User::query()->create([
            'role_id' => $role->id,
            'name' => 'test_admin',
            'email' => 'test-admin@example.com',
            'password' => Hash::make('password'),
            'remember_token' => Str::random(64),
        ]);

        return [
            'Authorization' => "Bearer {$user->remember_token}",
        ];
    }
}
