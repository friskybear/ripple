<?php

namespace Database\Factories;

use App\Models\Community;
use App\Models\Signal;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Signal>
 */
class SignalFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $status = fake()->randomElement([
            "open",
            "open",
            "open",
            "investigating",
            "resolved",
        ]);

        return [
            "community_id" => Community::factory(),
            "author_id" => User::factory(),
            "title" => fake()->sentence(6),
            "description" => fake()->paragraphs(2, true),
            "category" => fake()->randomElement([
                "network",
                "facilities",
                "safety",
                "accessibility",
                "equipment",
            ]),
            "zone" => fake()->randomElement([
                "lab-1",
                "lab-2",
                "library",
                "north-wing",
                "cafeteria",
            ]),
            "impact" => fake()->numberBetween(1, 5),
            "status" => $status,
            "priority" => null,
            "analysis_status" => "pending",
            "resolution_note" =>
                $status === "resolved" ? fake()->sentence() : null,
        ];
    }
}
