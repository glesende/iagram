<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First, remove any duplicate likes based on IP address and post_id
        // Keep only the oldest like for each IP + post_id combination
        $duplicates = DB::table('likes')
            ->select('ip_address', 'post_id', DB::raw('MIN(id) as keep_id'))
            ->whereNotNull('ip_address')
            ->whereNull('user_id')
            ->groupBy('ip_address', 'post_id')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        foreach ($duplicates as $duplicate) {
            // Delete all likes for this IP+post_id combination except the oldest one
            DB::table('likes')
                ->where('ip_address', $duplicate->ip_address)
                ->where('post_id', $duplicate->post_id)
                ->whereNull('user_id')
                ->where('id', '!=', $duplicate->keep_id)
                ->delete();
        }

        // Now add the unique constraint for anonymous users (IP-based)
        Schema::table('likes', function (Blueprint $table) {
            // Add unique constraint for ip_address + post_id
            // This ensures anonymous users (identified by IP) can only like a post once
            $table->unique(['ip_address', 'post_id'], 'likes_ip_post_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('likes', function (Blueprint $table) {
            $table->dropUnique('likes_ip_post_unique');
        });
    }
};
