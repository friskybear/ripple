<?php

namespace App\Policies;

use App\Models\Signal;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class SignalPolicy
{
    public function view(User $user, Signal $signal): Response
    {
        return $this->membershipResponse($user, $signal);
    }

    public function comment(User $user, Signal $signal): Response
    {
        return $this->membershipResponse($user, $signal);
    }

    public function confirm(User $user, Signal $signal): Response
    {
        return $this->membershipResponse($user, $signal);
    }

    public function transition(User $user, Signal $signal): Response
    {
        $membership = $signal->community->users()->whereKey($user->getKey())->first();

        if ($membership === null) {
            return Response::denyAsNotFound();
        }

        if ($membership->pivot->role !== 'moderator') {
            return Response::deny('Only community moderators can transition signals.');
        }

        return Response::allow();
    }

    private function membershipResponse(User $user, Signal $signal): Response
    {
        if ($signal->community->users()->whereKey($user->getKey())->exists()) {
            return Response::allow();
        }

        return Response::denyAsNotFound();
    }
}
