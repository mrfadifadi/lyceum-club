<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\ConfirmationCodeService;
use App\Services\ConfirmationDeliveryException;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            User::query()->orderBy('id')->get()->map(AuthController::publicUser(...))->all(),
        );
    }

    public function show(Request $request, int $userId): JsonResponse
    {
        $currentUser = $request->attributes->get('currentUser');
        if ($currentUser->role !== 'admin' && $currentUser->id !== $userId) {
            return response()->json(['detail' => 'Access denied'], 403);
        }

        $user = User::query()->find($userId);
        if ($user === null) {
            return response()->json(['detail' => 'User not found'], 404);
        }

        return response()->json(AuthController::publicUser($user));
    }

    public function store(Request $request, ConfirmationCodeService $confirmationCodes): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'full_name' => ['required', 'string', 'min:1', 'max:200'],
            'email' => ['required', 'string', 'max:255', 'email'],
            'password' => ['required', 'string', 'min:8', 'max:128'],
        ]);
        if ($validator->fails()) {
            return response()->json(['detail' => $validator->errors()->all()], 422);
        }

        $fullName = trim((string) $request->input('full_name'));
        if ($fullName === '') {
            return response()->json(['detail' => ['Full name cannot be blank']], 422);
        }
        $email = mb_strtolower(trim((string) $request->input('email')));
        if (User::query()->whereRaw('lower(email) = ?', [$email])->exists()) {
            return response()->json(['detail' => 'Email is already registered'], 409);
        }

        $user = new User([
            'full_name' => $fullName,
            'email' => $email,
            'password_hash' => $this->hashPassword((string) $request->input('password')),
            'is_active' => false,
            'role' => 'member',
        ]);
        try {
            $user->save();
        } catch (QueryException $exception) {
            if (User::query()->whereRaw('lower(email) = ?', [$email])->exists()) {
                return response()->json(['detail' => 'Email is already registered'], 409);
            }

            throw $exception;
        }

        try {
            $confirmationCodes->deliver($user);
        } catch (ConfirmationDeliveryException $exception) {
            return response()->json(['detail' => $exception->getMessage()], 503);
        }

        return response()->json(AuthController::publicUser($user->fresh()), 201);
    }

    public function update(Request $request, int $userId): JsonResponse
    {
        $currentUser = $request->attributes->get('currentUser');
        if ($currentUser->role !== 'admin' && $currentUser->id !== $userId) {
            return response()->json(['detail' => 'Access denied'], 403);
        }

        $user = User::query()->find($userId);
        if ($user === null) {
            return response()->json(['detail' => 'User not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'full_name' => ['sometimes', 'required', 'string', 'min:1', 'max:200'],
            'email' => ['sometimes', 'required', 'string', 'max:255', 'email'],
            'password' => ['sometimes', 'required', 'string', 'min:8', 'max:128'],
        ]);
        if ($validator->fails()) {
            return response()->json(['detail' => $validator->errors()->all()], 422);
        }

        $updates = $validator->validated();
        if ($updates === []) {
            return response()->json(['detail' => 'No fields to update'], 422);
        }

        if (array_key_exists('full_name', $updates)) {
            $updates['full_name'] = trim($updates['full_name']);
            if ($updates['full_name'] === '') {
                return response()->json(['detail' => ['Full name cannot be blank']], 422);
            }
        }
        if (array_key_exists('email', $updates)) {
            $updates['email'] = mb_strtolower(trim($updates['email']));
            if (User::query()
                ->whereRaw('lower(email) = ?', [$updates['email']])
                ->where('id', '<>', $user->getKey())
                ->exists()) {
                return response()->json(['detail' => 'Email is already registered'], 409);
            }
        }
        if (array_key_exists('password', $updates)) {
            $updates['password_hash'] = $this->hashPassword($updates['password']);
            unset($updates['password']);
        }

        try {
            $user->fill($updates)->save();
        } catch (QueryException $exception) {
            if (isset($updates['email'])) {
                return response()->json(['detail' => 'Email is already registered'], 409);
            }

            throw $exception;
        }

        return response()->json(AuthController::publicUser($user->fresh()));
    }

    public function destroy(int $userId): JsonResponse
    {
        $user = User::query()->find($userId);
        if ($user === null) {
            return response()->json(['detail' => 'User not found'], 404);
        }

        $user->delete();

        return response()->json(null, 204);
    }

    private function hashPassword(string $password): string
    {
        $salt = bin2hex(random_bytes(16));
        $digest = hash_pbkdf2('sha256', $password, $salt, 600_000, 64);

        return 'pbkdf2_sha256$600000$'.$salt.'$'.$digest;
    }
}
