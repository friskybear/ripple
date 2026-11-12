<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create("signal_matches", function (Blueprint $table) {
            $table->id();
            $table->foreignId("signal_id")->constrained()->cascadeOnDelete();
            $table
                ->foreignId("matched_signal_id")
                ->constrained("signals")
                ->cascadeOnDelete();
            $table->decimal("score", 5, 4);
            $table->json("reasons");
            $table->timestamps();

            $table->unique(["signal_id", "matched_signal_id"]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists("signal_matches");
    }
};
