<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSignalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        return [
            "title" => ["required", "string", "max:120"],
            "description" => ["required", "string", "max:5000"],
            "category" => ["required", "string", "max:80"],
            "zone" => ["required", "string", "max:120"],
            "impact" => ["required", "integer", "between:1,5"],
        ];
    }
}
