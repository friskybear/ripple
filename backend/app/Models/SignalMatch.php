<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(["signal_id", "matched_signal_id", "score", "reasons"])]
class SignalMatch extends Model
{
    /** @use HasFactory<\Database\Factories\SignalMatchFactory> */
    use HasFactory;

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            "score" => "float",
            "reasons" => "array",
        ];
    }

    /** @return BelongsTo<Signal, $this> */
    public function signal(): BelongsTo
    {
        return $this->belongsTo(Signal::class);
    }

    /** @return BelongsTo<Signal, $this> */
    public function matchedSignal(): BelongsTo
    {
        return $this->belongsTo(Signal::class, "matched_signal_id");
    }
}
