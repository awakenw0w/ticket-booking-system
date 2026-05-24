<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate(
            [
                'name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'email', 'max:255', 'unique:users,email'],
                'password' => ['required', 'string', 'min:4', 'max:255'],
            ],
            [
                'name.required' => 'Введите имя пользователя.',
                'email.required' => 'Введите почту.',
                'email.email' => 'Введите корректную почту.',
                'email.unique' => 'Пользователь с такой почтой уже зарегистрирован.',
                'password.required' => 'Введите пароль.',
                'password.min' => 'Пароль должен быть не короче 4 символов.',
            ],
        );

        $clientRole = Role::query()->firstOrCreate(
            ['slug' => 'client'],
            ['name' => 'Клиент'],
        );

        $user = User::query()->create([
            'role_id' => $clientRole->id,
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        return $this->tokenResponse($user->load('role'), 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate(
            [
                'login' => ['required', 'string', 'max:255'],
                'password' => ['required', 'string', 'max:255'],
            ],
            [
                'login.required' => 'Введите логин.',
                'password.required' => 'Введите пароль.',
            ],
        );

        $user = User::query()
            ->with('role')
            ->where('email', $data['login'])
            ->orWhere('name', $data['login'])
            ->first();

        if (!$user || ! Hash::check($data['password'], $user->password)) {
            return response()->json([
                'message' => 'Неверный логин или пароль.',
                'errors' => [
                    'login' => ['Неверный логин или пароль.'],
                ],
            ], 422);
        }

        return $this->tokenResponse($user);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $this->userData($request->attributes->get('api_user')),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->attributes->get('api_user');
        $user->forceFill(['remember_token' => null])->save();

        return response()->json(null, 204);
    }

    private function tokenResponse(User $user, int $status = 200): JsonResponse
    {
        $token = Str::random(64);

        $user->forceFill([
            'remember_token' => $token,
        ])->save();

        return response()->json([
            'token' => $token,
            'user' => $this->userData($user->loadMissing('role')),
        ], $status);
    }

    /**
     * @return array<string, mixed>
     */
    private function userData(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => [
                'slug' => $user->role?->slug,
                'name' => $user->role?->name,
            ],
        ];
    }
}
