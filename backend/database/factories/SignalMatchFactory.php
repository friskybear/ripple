<?php

namespace Database\Factories;

use App\Models\Signal;
use App\Models\SignalMatch;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SignalMatch>
 */
class SignalMatchFactory extends Factory
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
            "matched_signal_id" => Signal::factory(),
            "score" => fake()->randomFloat(4, 0, 1),
            "reasons" => fake()->randomElements(
                ["shared_keywords", "same_zone", "same_category"],
                fake()->numberBetween(1, 3),
            ),
        ];
    }
}
