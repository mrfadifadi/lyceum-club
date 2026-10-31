<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateApiToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $secret = (string) config('app.jwt_secret', '');
        if (strlen($secret) < 32) {
            return response()->json([
                'detail' => 'Authentication is not configured; set JWT_SECRET_KEY to a random value of at least 32 characters.',
            ], 503);
        }

        $token = $request->bearerToken();
        if ($token === null) {
            return $this->unauthorized();
        }

        try {
            $claims = JWT::decode($token, new Key($secret, 'HS256'));
            $userId = filter_var($claims->sub ?? null, FILTER_VALIDATE_INT);
        } catch (\DomainException|\InvalidArgumentException|\UnexpectedValueException) {
            return $this->unauthorized();
        }

        if ($userId === false || $userId === null) {
            return $this->unauthorized();
        }

        $user = User::query()->find($userId);
        if ($user === null || !$user->is_active) {
            return $this->unauthorized();
        }

        $request->attributes->set('currentUser', $user);

        return $next($request);
    }

    private function unauthorized(): Response
    {
        return response()->json(
            ['detail' => 'Invalid or expired access token'],
            401,
            ['WWW-Authenticate' => 'Bearer'],
        );
    }
}
