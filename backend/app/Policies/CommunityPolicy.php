<?php

namespace App\Policies;

use App\Models\Community;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class CommunityPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Community $community): Response
    {
        return $this->membershipResponse($user, $community);
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function join(User $user): bool
    {
        return true;
    }

    public function createSignal(User $user, Community $community): Response
    {
        return $this->membershipResponse($user, $community);
    }

    public function comment(User $user, Community $community): Response
    {
        return $this->membershipResponse($user, $community);
    }

    public function confirm(User $user, Community $community): Response
    {
        return $this->membershipResponse($user, $community);
    }

    private function membershipResponse(User $user, Community $community): Response
    {
        if ($community->users()->whereKey($user->getKey())->exists()) {
            return Response::allow();
        }

        return Response::denyAsNotFound();
    }
}
