<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureApiUser
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next, ?string $role = null): Response
    {
        $token = $request->bearerToken();

        $user = $token
            ? User::query()->with('role')->where('remember_token', $token)->first()
            : null;

        if (! $user) {
            return response()->json([
                'message' => 'Войдите в аккаунт.',
            ], 401);
        }

        if ($role && $user->role?->slug !== $role) {
            return response()->json([
                'message' => 'Недостаточно прав для выполнения действия.',
            ], 403);
        }

        $request->attributes->set('api_user', $user);

        return $next($request);
    }
}
