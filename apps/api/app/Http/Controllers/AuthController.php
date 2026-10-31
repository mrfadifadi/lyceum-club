<?php

namespace App\Http\Controllers;

use App\Models\User;
use Firebase\JWT\JWT;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    private const PASSWORD_HASH_ITERATIONS = 600_000;

    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'string', 'max:255', 'email'],
            'password' => ['required', 'string', 'min:1', 'max:128'],
        ]);
        if ($validator->fails()) {
            return response()->json(['detail' => $validator->errors()->all()], 422);
        }

        $email = mb_strtolower(trim((string) $request->input('email')));
        $user = User::query()->whereRaw('lower(email) = ?', [$email])->first();
        if ($user === null || !$this->verifyPassword(
            (string) $request->input('password'),
            (string) $user->password_hash,
        )) {
            return response()->json(['detail' => 'Invalid email or password'], 401);
        }
        if (!$user->is_active) {
            return response()->json(['detail' => 'User account is not confirmed'], 403);
        }

        $secret = (string) config('app.jwt_secret', '');
        if (strlen($secret) < 32) {
            return response()->json([
                'detail' => 'Authentication is not configured; set JWT_SECRET_KEY to a random value of at least 32 characters.',
            ], 503);
        }
        $ttlMinutes = max(1, (int) config('app.jwt_ttl_minutes', 30));
        $expiresAt = time() + $ttlMinutes * 60;
        $token = JWT::encode([
            'sub' => (string) $user->id,
            'exp' => $expiresAt,
        ], $secret, 'HS256');

        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => $ttlMinutes * 60,
            'user' => $this->publicUser($user),
        ]);
    }

    private function verifyPassword(string $password, string $storedHash): bool
    {
        if (password_verify($password, $storedHash)) {
            return true;
        }

        if (!preg_match('/^pbkdf2_sha256\$(\d+)\$([a-f0-9]{32})\$([a-f0-9]{64})$/', $storedHash, $matches)) {
            return false;
        }

        if ((int) $matches[1] !== self::PASSWORD_HASH_ITERATIONS) {
            return false;
        }

        $actual = hash_pbkdf2('sha256', $password, $matches[2], self::PASSWORD_HASH_ITERATIONS, 64);

        return hash_equals($matches[3], $actual);
    }

    public static function publicUser(User $user): array
    {
        return [
            'id' => $user->id,
            'full_name' => $user->full_name,
            'email' => $user->email,
            'role' => $user->role,
            'is_active' => $user->is_active,
            'created_at' => $user->created_at?->toISOString(),
        ];
    }
}
