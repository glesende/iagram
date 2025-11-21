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
        Schema::table('comments', function (Blueprint $table) {
            // Make i_anfluencer_id nullable to allow human comments
            $table->foreignId('i_anfluencer_id')->nullable()->change();

            // Add session_id for anonymous human users
            $table->string('session_id')->nullable()->after('i_anfluencer_id');

            // Add author_name for identified comments (will be used when auth is implemented)
            $table->string('author_name')->nullable()->after('session_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('comments', function (Blueprint $table) {
            // Remove new fields
            $table->dropColumn(['session_id', 'author_name']);

            // Make i_anfluencer_id required again
            $table->foreignId('i_anfluencer_id')->nullable(false)->change();
        });
    }
};
