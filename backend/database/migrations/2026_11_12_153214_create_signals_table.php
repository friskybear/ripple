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
        Schema::create("signals", function (Blueprint $table) {
            $table->id();
            $table->foreignId("community_id")->constrained()->cascadeOnDelete();
            $table->foreignId("author_id")->constrained("users");
            $table->string("title");
            $table->text("description");
            $table->string("category");
            $table->string("zone");
            $table->unsignedTinyInteger("impact");
            $table->string("status")->default("open");
            $table->unsignedTinyInteger("priority")->nullable();
            $table->string("analysis_status")->default("pending");
            $table->text("resolution_note")->nullable();
            $table->timestamps();
            $table->index(["community_id", "status"]);
            $table->index(["community_id", "category"]);
            $table->index(["community_id", "zone"]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists("signals");
    }
};
