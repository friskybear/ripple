<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SignalResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            "id" => $this->id,
            "community_id" => $this->community_id,
            "title" => $this->title,
            "description" => $this->description,
            "category" => $this->category,
            "zone" => $this->zone,
            "impact" => $this->impact,
            "status" => $this->status,
            "priority" => $this->priority,
            "analysis_status" => $this->analysis_status,
            "resolution_note" => $this->resolution_note,
            "resolved_at" => $this->resolved_at,
            "author" => $this->whenLoaded(
                "author",
                fn() => UserResource::make($this->author),
            ),
            "confirmations_count" => $this->whenCounted("confirmations"),
            "confirmed_by_me" => (bool) ($this->confirmed_by_me ?? false),
            "created_at" => $this->created_at,
        ];
    }
}
