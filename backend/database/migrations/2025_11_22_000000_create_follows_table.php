<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('follows', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('i_anfluencer_id');
            $table->timestamps();

            // Foreign keys
            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

            $table->foreign('i_anfluencer_id')
                ->references('id')
                ->on('i_anfluencers')
                ->onDelete('cascade');

            // Unique constraint to prevent duplicate follows
            $table->unique(['user_id', 'i_anfluencer_id'], 'unique_follow');

            // Indexes for performance
            $table->index('user_id', 'idx_user_follows');
            $table->index('i_anfluencer_id', 'idx_ianfluencer_followers');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('follows');
    }
};
