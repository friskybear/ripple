<?php

namespace App\Http\Controllers;

use App\Http\Requests\TransitionSignalRequest;
use App\Http\Resources\SignalResource;
use App\Models\Signal;

class SignalTransitionController extends Controller
{
    public function update(
        TransitionSignalRequest $request,
        Signal $signal,
    ): SignalResource {
        $validated = $request->validated();
        $nextStatus = $validated["to"];

        $signal->status = $nextStatus;

        if ($nextStatus === "resolved") {
            $signal->resolved_at = now();
            $signal->resolution_note = $validated["note"];
        } elseif ($nextStatus === "open") {
            $signal->resolved_at = null;
            $signal->resolution_note = null;
        }

        $signal->save();
        $signal->load("author:id,name")->loadCount("confirmations");
        $signal->setAttribute(
            "confirmed_by_me",
            $signal
                ->confirmations()
                ->where("user_id", $request->user()->getKey())
                ->exists(),
        );

        return SignalResource::make($signal);
    }
}
