<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommentResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'signal_id' => $this->signal_id,
            'body' => $this->body,
            'user' => $this->whenLoaded('user', fn () => UserResource::make($this->user)),
            'created_at' => $this->created_at,
        ];
    }
}
