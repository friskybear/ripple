<?php

namespace Database\Factories;

use App\Models\Confirmation;
use App\Models\Signal;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Confirmation>
 */
class ConfirmationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            "signal_id" => Signal::factory(),
            "user_id" => User::factory(),
        ];
    }
}
