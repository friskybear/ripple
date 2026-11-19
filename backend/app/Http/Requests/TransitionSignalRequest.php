<?php

namespace App\Http\Requests;

use App\Models\Signal;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TransitionSignalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        $signal = $this->route("signal");
        $allowedStatuses =
            $signal instanceof Signal
                ? match ($signal->status) {
                    "open" => ["investigating"],
                    "investigating" => ["resolved"],
                    "resolved" => ["open"],
                    default => [],
                }
                : [];

        return [
            "to" => ["required", "string", Rule::in($allowedStatuses)],
            "note" => [
                Rule::requiredIf(
                    fn(): bool => $this->input("to") === "resolved",
                ),
                "nullable",
                "string",
                "max:2000",
            ],
        ];
    }
}
