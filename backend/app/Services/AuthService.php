<?php

namespace App\Services;

use App\Models\User;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function register(RegisterRequest $request): array
    {
        $data = $request->validated();
        $data['password'] = Hash::make($data['password']);
        $user = User::create($data);
        $token = $user->createToken('auth_token')->plainTextToken;
        return ['user' => $user, 'token' => $token, 'message' => 'Usuario registrado'];
    }

    public function login(LoginRequest $request): array
    {
        $data = $request->validated();

        // ======== Aqui checamos que la cuenta siga activa antes de sacar el token.
        return \Illuminate\Support\Facades\DB::transaction(function () use ($data) {
            $user = User::where('email', $data['email'])
                ->whereNull('demo_deleted_at')
                ->lockForUpdate()
                ->first();

            if (!$user || !Hash::check($data['password'], $user->password)) {
                throw ValidationException::withMessages(['email' => ['Credenciales incorrectas']]);
            }

            $token = $user->createToken('auth_token')->plainTextToken;
            return ['user' => $user, 'token' => $token, 'message' => 'Sesión iniciada'];
        }, 5);
    }

    public function logout(User $user): void
    {
        $user->currentAccessToken()->delete();
    }
}
