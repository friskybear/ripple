<?php

namespace App\Http\Controllers;

use App\Models\Signal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;

class ConfirmationController extends Controller
{
    public function store(Request $request, Signal $signal): JsonResponse
    {
        $user = $request->user();

        if ((int) $signal->author_id === (int) $user->getKey()) {
            throw ValidationException::withMessages([
                "signal" => ["You cannot confirm your own signal."],
            ]);
        }

        $signal->confirmations()->firstOrCreate(["user_id" => $user->getKey()]);

        return response()->json(["confirmed" => true]);
    }

    public function destroy(Request $request, Signal $signal): Response
    {
        $signal
            ->confirmations()
            ->where("user_id", $request->user()->getKey())
            ->delete();

        return response()->noContent();
    }
}
