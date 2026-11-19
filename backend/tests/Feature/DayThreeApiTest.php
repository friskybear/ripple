<?php

namespace Tests\Feature;

use App\Models\Community;
use App\Models\Signal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DayThreeApiTest extends TestCase
{
    use RefreshDatabase;

    public function testUserCanCreateAndListCommunities(): void
    {
        $user = User::factory()->create();

        $created = $this->actingAs($user)->postJson("/api/communities", [
            "name" => "North Campus",
        ]);

        $created
            ->assertCreated()
            ->assertJsonPath("data.name", "North Campus")
            ->assertJsonPath("data.role", "moderator");

        $community = Community::where("name", "North Campus")->firstOrFail();
        $this->assertNotEmpty($community->invite_code);
        $this->assertDatabaseHas("community_user", [
            "community_id" => $community->id,
            "user_id" => $user->id,
            "role" => "moderator",
        ]);

        $this->actingAs($user)
            ->getJson("/api/communities")
            ->assertOk()
            ->assertJsonCount(1, "data");
    }

    public function testJoiningACommunityIsIdempotent(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $community = Community::factory()->create();
        $community->users()->attach($owner, ["role" => "moderator"]);

        $payload = ["invite_code" => $community->invite_code];

        $this->actingAs($member)
            ->postJson("/api/communities/join", $payload)
            ->assertOk()
            ->assertJsonPath("data.role", "member");

        $this->actingAs($member)
            ->postJson("/api/communities/join", $payload)
            ->assertOk()
            ->assertJsonPath("data.role", "member");

        $this->assertDatabaseCount("community_user", 2);
    }

    public function testMemberCanCreateSignalAndInvalidSignalsAreRejected(): void
    {
        $author = User::factory()->create();
        $community = $this->createCommunityFor($author);

        $this->actingAs($author)
            ->postJson("/api/communities/{$community->id}/signals", [
                "title" => "Wi-Fi is unavailable in lab two",
                "description" =>
                    "The access point has been offline since this morning.",
                "category" => "network",
                "zone" => "lab-2",
                "impact" => 4,
            ])
            ->assertCreated()
            ->assertJsonPath("data.title", "Wi-Fi is unavailable in lab two")
            ->assertJsonPath("data.author.name", $author->name)
            ->assertJsonMissingPath("data.author.email")
            ->assertJsonPath("data.confirmations_count", 0);

        $this->actingAs($author)
            ->postJson("/api/communities/{$community->id}/signals", [
                "title" => "Invalid impact",
                "description" => "Impact must be from one through five.",
                "category" => "network",
                "zone" => "lab-2",
                "impact" => 8,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors("impact");
    }

    public function testSignalListingFiltersAndHidesNonMemberCommunities(): void
    {
        $member = User::factory()->create();
        $outsider = User::factory()->create();
        $community = $this->createCommunityFor($member);

        $matchingSignal = Signal::factory()->create([
            "community_id" => $community->id,
            "author_id" => $member->id,
            "title" => "Wi-Fi outage in the library",
            "category" => "network",
            "zone" => "library",
            "status" => "open",
        ]);

        Signal::factory()->create([
            "community_id" => $community->id,
            "author_id" => $member->id,
            "title" => "Broken chair",
            "category" => "facilities",
            "zone" => "library",
        ]);

        $this->actingAs($member)
            ->getJson(
                "/api/communities/{$community->id}/signals?category=network&q=Wi-Fi",
            )
            ->assertOk()
            ->assertJsonCount(1, "data")
            ->assertJsonPath("data.0.id", $matchingSignal->id)
            ->assertJsonPath("meta.per_page", 15);

        $this->actingAs($outsider)
            ->getJson("/api/communities/{$community->id}/signals")
            ->assertNotFound();

        $this->actingAs($outsider)
            ->getJson("/api/signals/{$matchingSignal->id}")
            ->assertNotFound();
    }

    public function testConfirmationsAreIdempotentAndAuthorsCannotConfirmOwnSignal(): void
    {
        $author = User::factory()->create();
        $member = User::factory()->create();
        $community = $this->createCommunityFor($author);
        $community->users()->attach($member, ["role" => "member"]);
        $signal = Signal::factory()->create([
            "community_id" => $community->id,
            "author_id" => $author->id,
        ]);

        $this->actingAs($member)
            ->postJson("/api/signals/{$signal->id}/confirm")
            ->assertOk()
            ->assertJson(["confirmed" => true]);
        $this->actingAs($member)
            ->postJson("/api/signals/{$signal->id}/confirm")
            ->assertOk();

        $this->assertDatabaseCount("confirmations", 1);

        $this->actingAs($member)
            ->getJson("/api/signals/{$signal->id}")
            ->assertOk()
            ->assertJsonPath("data.confirmed_by_me", true);

        $this->actingAs($member)
            ->deleteJson("/api/signals/{$signal->id}/confirm")
            ->assertNoContent();
        $this->assertDatabaseCount("confirmations", 0);

        $ownSignal = Signal::factory()->create([
            "community_id" => $community->id,
            "author_id" => $member->id,
        ]);

        $this->actingAs($member)
            ->postJson("/api/signals/{$ownSignal->id}/confirm")
            ->assertUnprocessable()
            ->assertJsonValidationErrors("signal");
    }

    public function testMembersCanCreateAndListCommentsWithoutExposingEmail(): void
    {
        $author = User::factory()->create();
        $commenter = User::factory()->create();
        $community = $this->createCommunityFor($author);
        $community->users()->attach($commenter, ["role" => "member"]);
        $signal = Signal::factory()->create([
            "community_id" => $community->id,
            "author_id" => $author->id,
        ]);

        $this->actingAs($commenter)
            ->postJson("/api/signals/{$signal->id}/comments", [
                "body" => "I can reproduce this.",
            ])
            ->assertCreated()
            ->assertJsonPath("data.body", "I can reproduce this.")
            ->assertJsonPath("data.user.name", $commenter->name)
            ->assertJsonMissingPath("data.user.email");

        $this->actingAs($commenter)
            ->getJson("/api/signals/{$signal->id}/comments")
            ->assertOk()
            ->assertJsonCount(1, "data");
    }

    private function createCommunityFor(User $user): Community
    {
        $community = Community::factory()->create();
        $community->users()->attach($user, ["role" => "moderator"]);

        return $community;
    }
}
