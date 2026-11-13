<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            "name" => ["required", "string", "max:255"],
            "email" => [
                "required",
                "string",
                "email",
                "max:255",
                "unique:users,email",
            ],
            "password" => ["required", "string", "min:8", "confirmed"],
        ]);

        $user = User::create([
            "name" => $validated["name"],
            "email" => $validated["email"],
            "password" => $validated["password"],
        ]);

        Auth::login($user);
        $request->session()->regenerate();

        return response()->json(["user" => $user], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            "email" => ["required", "string", "email"],
            "password" => ["required", "string"],
        ]);

        if (!Auth::attempt($credentials)) {
            throw ValidationException::withMessages([
                "email" => ["These credentials do not match our records."],
            ]);
        }

        $request->session()->regenerate();

        return response()->json(["user" => $request->user()]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard("web")->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(["message" => "Logged out."]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(["user" => $request->user()]);
    }
}
