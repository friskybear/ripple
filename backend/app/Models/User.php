<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(["name", "email", "password"])]
#[Hidden(["password", "remember_token"])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory;
    use Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            "email_verified_at" => "datetime",
            "password" => "hashed",
        ];
    }

    /** @return BelongsToMany<Community, $this> */
    public function communities(): BelongsToMany
    {
        return $this->belongsToMany(Community::class)
            ->withPivot("role")
            ->withTimestamps();
    }

    /** @return HasMany<Signal, $this> */
    public function signals(): HasMany
    {
        return $this->hasMany(Signal::class, "author_id");
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
}
