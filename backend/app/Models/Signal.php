<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    "community_id",
    "author_id",
    "title",
    "description",
    "category",
    "zone",
    "impact",
    "status",
    "priority",
    "analysis_status",
    "resolution_note",
])]
class Signal extends Model
{
    /** @use HasFactory<\Database\Factories\SignalFactory> */
    use HasFactory;

    /** @return BelongsTo<Community, $this> */
    public function community(): BelongsTo
    {
        return $this->belongsTo(Community::class);
    }

    /** @return BelongsTo<User, $this> */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, "author_id");
    }

    /** @return HasMany<Confirmation, $this> */
    public function confirmations(): HasMany
    {
        return $this->hasMany(Confirmation::class);
    }

    /** @return HasMany<Comment, $this> */
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    /** @return HasMany<SignalMatch, $this> */
    public function matches(): HasMany
    {
        return $this->hasMany(SignalMatch::class);
    }

    /** @return HasMany<SignalMatch, $this> */
    public function matchedBy(): HasMany
    {
        return $this->hasMany(SignalMatch::class, "matched_signal_id");
    }
}
