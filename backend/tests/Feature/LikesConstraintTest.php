<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Post;
use App\Models\IAnfluencer;
use App\Models\Like;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

class LikesConstraintTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that the unique constraint for ip_address + post_id prevents duplicate likes
     */
    public function test_ip_address_post_unique_constraint_prevents_duplicates(): void
    {
        // Create a test IAnfluencer and Post
        $ianfluencer = IAnfluencer::factory()->create();
        $post = Post::factory()->create(['i_anfluencer_id' => $ianfluencer->id]);

        $testIp = '192.168.1.1';

        // First like should succeed
        $firstLike = Like::create([
            'post_id' => $post->id,
            'user_id' => null,
            'session_id' => null,
            'ip_address' => $testIp,
        ]);

        $this->assertDatabaseHas('likes', [
            'id' => $firstLike->id,
            'post_id' => $post->id,
            'ip_address' => $testIp,
        ]);

        // Second like from same IP should fail due to unique constraint
        $this->expectException(\Illuminate\Database\QueryException::class);

        Like::create([
            'post_id' => $post->id,
            'user_id' => null,
            'session_id' => null,
            'ip_address' => $testIp,
        ]);
    }

    /**
     * Test that different IPs can like the same post
     */
    public function test_different_ips_can_like_same_post(): void
    {
        $ianfluencer = IAnfluencer::factory()->create();
        $post = Post::factory()->create(['i_anfluencer_id' => $ianfluencer->id]);

        $like1 = Like::create([
            'post_id' => $post->id,
            'user_id' => null,
            'session_id' => null,
            'ip_address' => '192.168.1.1',
        ]);

        $like2 = Like::create([
            'post_id' => $post->id,
            'user_id' => null,
            'session_id' => null,
            'ip_address' => '192.168.1.2',
        ]);

        $this->assertDatabaseHas('likes', ['id' => $like1->id]);
        $this->assertDatabaseHas('likes', ['id' => $like2->id]);
        $this->assertEquals(2, $post->likes()->count());
    }

    /**
     * Test that the unique constraint exists in the database
     */
    public function test_unique_constraint_exists(): void
    {
        $indexes = DB::select("SHOW INDEX FROM likes WHERE Key_name = 'likes_ip_post_unique'");

        $this->assertNotEmpty($indexes, 'Unique constraint likes_ip_post_unique should exist');

        // Verify it covers both ip_address and post_id
        $columnNames = array_map(fn($index) => $index->Column_name, $indexes);
        $this->assertContains('ip_address', $columnNames);
        $this->assertContains('post_id', $columnNames);
    }

    /**
     * Test API endpoint handles duplicate like gracefully
     */
    public function test_api_handles_duplicate_like_gracefully(): void
    {
        $ianfluencer = IAnfluencer::factory()->create();
        $post = Post::factory()->create(['i_anfluencer_id' => $ianfluencer->id]);

        // Simulate first like
        $response1 = $this->postJson("/api/posts/{$post->id}/like", [], [
            'REMOTE_ADDR' => '192.168.1.100'
        ]);

        $response1->assertStatus(200);

        // Simulate second like from same IP (should be rejected gracefully)
        $response2 = $this->postJson("/api/posts/{$post->id}/like", [], [
            'REMOTE_ADDR' => '192.168.1.100'
        ]);

        $response2->assertStatus(409); // HTTP_CONFLICT
        $response2->assertJson([
            'success' => false,
            'message' => 'Ya has dado like a este post'
        ]);
    }
}
