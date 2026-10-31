<?php

namespace Tests\Feature;

use App\Models\User;
use Firebase\JWT\JWT;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_content_api_returns_the_frontend_data(): void
    {
        $this->getJson('/api/v1/events')
            ->assertOk()
            ->assertJsonStructure([['slug', 'title']]);
    }

    public function test_login_accepts_existing_python_password_hashes_and_token_opens_profile(): void
    {
        $salt = str_repeat('a', 32);
        $passwordHash = hash_pbkdf2('sha256', 'correct-password', $salt, 600_000, 64);
        $user = User::query()->create([
            'full_name' => 'Test Member',
            'email' => 'member@example.com',
            'password_hash' => 'pbkdf2_sha256$600000$'.$salt.'$'.$passwordHash,
            'role' => 'member',
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/v1/login', [
            'email' => 'MEMBER@example.com',
            'password' => 'correct-password',
        ])->assertOk()
            ->assertJsonPath('token_type', 'bearer')
            ->assertJsonPath('user.email', 'member@example.com');

        $this->withToken($response->json('access_token'))
            ->getJson('/api/v1/users/'.$user->id)
            ->assertOk()
            ->assertJsonPath('id', $user->id);
    }

    public function test_member_cannot_list_users(): void
    {
        $user = User::query()->create([
            'full_name' => 'Test Member',
            'email' => 'member@example.com',
            'password_hash' => 'unused',
            'role' => 'member',
            'is_active' => true,
        ]);
        $token = JWT::encode([
            'sub' => (string) $user->id,
            'exp' => time() + 600,
        ], (string) config('app.jwt_secret'), 'HS256');

        $this->withToken($token)
            ->getJson('/api/v1/users')
            ->assertForbidden()
            ->assertJsonPath('detail', 'Administrator access is required');
    }

    public function test_health_check_returns_json(): void
    {
        $this->getJson('/health')
            ->assertOk()
            ->assertJsonPath('status', 'ok');
    }
}
