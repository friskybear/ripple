<?php

namespace Database\Seeders;

use App\Models\Comment;
use App\Models\Community;
use App\Models\Confirmation;
use App\Models\Signal;
use App\Models\SignalMatch;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $users = User::factory()->count(10)->create();
        $communities = Community::factory()->count(3)->create();

        foreach ($communities as $communityIndex => $community) {
            $memberships = [];

            foreach ($users as $userIndex => $user) {
                $memberships[$user->id] = [
                    "role" =>
                        $userIndex === $communityIndex ? "moderator" : "member",
                ];
            }

            $community->users()->attach($memberships);
        }

        $signals = collect();

        for ($index = 0; $index < 40; $index++) {
            $community = $communities->get($index % $communities->count());
            $author = $users->random();
            $status = match (true) {
                $index % 10 === 0 => "resolved",
                $index % 4 === 0 => "investigating",
                default => "open",
            };

            $signal = Signal::factory()->create([
                "community_id" => $community->id,
                "author_id" => $author->id,
                "status" => $status,
                "resolution_note" =>
                    $status === "resolved" ? fake()->sentence() : null,
            ]);

            $signals->push($signal);

            $confirmers = $users
                ->where("id", "!=", $author->id)
                ->values()
                ->random(fake()->numberBetween(1, 3));

            foreach ($confirmers as $confirmer) {
                Confirmation::factory()->create([
                    "signal_id" => $signal->id,
                    "user_id" => $confirmer->id,
                ]);
            }

            Comment::factory()
                ->count(fake()->numberBetween(0, 3))
                ->create([
                    "signal_id" => $signal->id,
                    "user_id" => $users->random()->id,
                ]);
        }

        foreach ($communities as $community) {
            $communitySignals = $signals
                ->where("community_id", $community->id)
                ->values();

            for (
                $index = 0;
                $index < $communitySignals->count() - 1;
                $index += 2
            ) {
                SignalMatch::factory()->create([
                    "signal_id" => $communitySignals->get($index)->id,
                    "matched_signal_id" => $communitySignals->get($index + 1)
                        ->id,
                ]);
            }
        }
    }
}
