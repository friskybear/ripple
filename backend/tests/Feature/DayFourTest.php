<?php

namespace Tests\Feature;

use App\Models\Community;
use App\Models\Signal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DayFourTest extends TestCase
{
    use RefreshDatabase;

    public function testMembersCannotTransitionSignals(): void
    {
        $member = User::factory()->create();
        $community = $this->communityFor($member, "member");
        $signal = Signal::factory()->create([
            "community_id" => $community->id,
            "author_id" => $member->id,
            "status" => "open",
        ]);

        $this->actingAs($member)
            ->postJson("/api/signals/{$signal->id}/transition", [
                "to" => "investigating",
            ])
            ->assertForbidden();

        $this->assertSame("open", $signal->fresh()->status);
    }

    public function testNonMembersCannotAccessSignalActions(): void
    {
        $member = User::factory()->create();
        $outsider = User::factory()->create();
        $community = $this->communityFor($member, "member");
        $signal = Signal::factory()->create([
            "community_id" => $community->id,
            "author_id" => $member->id,
        ]);

        $this->actingAs($outsider)
            ->postJson("/api/communities/{$community->id}/signals", [
                "title" => "Unauthorized signal",
                "description" => "A non-member must not be able to post here.",
                "category" => "network",
                "zone" => "lab-2",
                "impact" => 2,
            ])
            ->assertNotFound();

        $this->actingAs($outsider)
            ->postJson("/api/signals/{$signal->id}/confirm")
            ->assertNotFound();

        $this->actingAs($outsider)
            ->getJson("/api/signals/{$signal->id}/comments")
            ->assertNotFound();

        $this->actingAs($outsider)
            ->postJson("/api/signals/{$signal->id}/comments", [
                "body" => "Unauthorized comment",
            ])
            ->assertNotFound();
    }

    public function testModeratorsCanTransitionSignalsAndResolutionRequiresANote(): void
    {
        $moderator = User::factory()->create();
        $community = $this->communityFor($moderator, "moderator");
        $signal = Signal::factory()->create([
            "community_id" => $community->id,
            "author_id" => User::factory(),
            "status" => "open",
        ]);

        $this->actingAs($moderator)
            ->postJson("/api/signals/{$signal->id}/transition", [
                "to" => "investigating",
            ])
            ->assertOk()
            ->assertJsonPath("data.status", "investigating");

        $this->actingAs($moderator)
            ->postJson("/api/signals/{$signal->id}/transition", [
                "to" => "resolved",
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors("note");

        $this->actingAs($moderator)
            ->postJson("/api/signals/{$signal->id}/transition", [
                "to" => "resolved",
                "note" => "The access point was replaced.",
            ])
            ->assertOk()
            ->assertJsonPath("data.status", "resolved")
            ->assertJsonPath(
                "data.resolution_note",
                "The access point was replaced.",
            )
            ->assertJsonStructure(["data" => ["resolved_at"]]);

        $this->assertNotNull($signal->fresh()->resolved_at);

        $this->actingAs($moderator)
            ->postJson("/api/signals/{$signal->id}/transition", [
                "to" => "open",
            ])
            ->assertOk()
            ->assertJsonPath("data.status", "open")
            ->assertJsonPath("data.resolution_note", null)
            ->assertJsonPath("data.resolved_at", null);
    }

    public function testModeratorsCannotSkipAStatusTransition(): void
    {
        $moderator = User::factory()->create();
        $community = $this->communityFor($moderator, "moderator");
        $signal = Signal::factory()->create([
            "community_id" => $community->id,
            "author_id" => User::factory(),
            "status" => "open",
        ]);

        $this->actingAs($moderator)
            ->postJson("/api/signals/{$signal->id}/transition", [
                "to" => "resolved",
                "note" => "This transition is not allowed from open.",
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors("to");
    }

    public function testReadinessEndpointConfirmsDatabaseConnectivity(): void
    {
        $this->getJson("/api/ready")
            ->assertOk()
            ->assertJson(["status" => "ok"]);
    }

    private function communityFor(User $user, string $role): Community
    {
        $community = Community::factory()->create();
        $community->users()->attach($user, ["role" => $role]);

        return $community;
    }
}
