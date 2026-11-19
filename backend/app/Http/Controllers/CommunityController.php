<?php

namespace App\Http\Controllers;

use App\Http\Resources\CommunityResource;
use App\Models\Community;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

use Illuminate\Support\Str;

class CommunityController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $communities = $request
            ->user()
            ->communities()
            ->orderBy("communities.name")
            ->get();

        return CommunityResource::collection($communities);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            "name" => ["required", "string", "max:120"],
        ]);

        $community = DB::transaction(function () use (
            $request,
            $validated,
        ): Community {
            do {
                $inviteCode = Str::upper(Str::random(8));
            } while (Community::where("invite_code", $inviteCode)->exists());

            $community = Community::create([
                "name" => $validated["name"],
                "invite_code" => $inviteCode,
            ]);

            $community
                ->users()
                ->attach($request->user(), ["role" => "moderator"]);

            return $community;
        });

        $membership = $request
            ->user()
            ->communities()
            ->whereKey($community->getKey())
            ->firstOrFail();

        return CommunityResource::make($membership)
            ->response()
            ->setStatusCode(201);
    }

    public function join(Request $request): CommunityResource
    {
        $validated = $request->validate([
            "invite_code" => [
                "required",
                "string",
                "exists:communities,invite_code",
            ],
        ]);

        $community = Community::where(
            "invite_code",
            $validated["invite_code"],
        )->firstOrFail();
        $user = $request->user();

        DB::transaction(function () use ($community, $user): void {
            if (!$community->users()->whereKey($user->getKey())->exists()) {
                $community->users()->attach($user, ["role" => "member"]);
            }
        });

        return CommunityResource::make(
            $user->communities()->whereKey($community->getKey())->firstOrFail(),
        );
    }
}
