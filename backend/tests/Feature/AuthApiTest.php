<?php

namespace Tests\Feature;

use App\Models\Event;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_login_with_simple_credentials(): void
    {
        $this->seed();

        $response = $this->postJson('/api/auth/login', [
            'login' => 'admin',
            'password' => 'admin',
        ]);

        $response
            ->assertOk()
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email', 'role']])
            ->assertJsonPath('user.name', 'admin')
            ->assertJsonPath('user.role.slug', 'admin');
    }

    public function test_user_can_register_login_and_view_profile(): void
    {
        $this->seed();

        $register = $this->postJson('/api/auth/register', [
            'name' => 'Петр Сидоров',
            'email' => 'petr@example.com',
            'password' => '1234',
        ]);

        $register
            ->assertCreated()
            ->assertJsonPath('user.role.slug', 'client');

        $token = $register->json('token');

        $this->getJson('/api/auth/me', [
            'Authorization' => "Bearer {$token}",
        ])
            ->assertOk()
            ->assertJsonPath('user.email', 'petr@example.com');
    }

    public function test_admin_routes_require_admin_role(): void
    {
        $this->seed();

        $this->postJson('/api/events', [])
            ->assertUnauthorized()
            ->assertJsonPath('message', 'Войдите в аккаунт.');

        $clientLogin = $this->postJson('/api/auth/login', [
            'login' => 'client@example.com',
            'password' => 'client',
        ])->json('token');

        $this->postJson('/api/events', [], [
            'Authorization' => "Bearer {$clientLogin}",
        ])
            ->assertForbidden()
            ->assertJsonPath('message', 'Недостаточно прав для выполнения действия.');

        $adminLogin = $this->postJson('/api/auth/login', [
            'login' => 'admin',
            'password' => 'admin',
        ])->json('token');

        $this->postJson('/api/events', [
            'title' => 'Закрытая презентация',
            'description' => 'Проверка админского доступа.',
            'location' => 'Главный зал',
            'starts_at' => now()->addWeek()->toDateTimeString(),
            'status' => 'published',
        ], [
            'Authorization' => "Bearer {$adminLogin}",
        ])->assertCreated();

        $this->assertDatabaseHas('events', [
            'title' => 'Закрытая презентация',
        ]);
    }
}
