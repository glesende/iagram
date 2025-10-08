<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\Post;
use App\Models\IAnfluencer;
use App\Models\Like;

class LikesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Create test data
        $this->iAnfluencer = IAnfluencer::factory()->create();
        $this->post = Post::factory()->create([
            'i_anfluencer_id' => $this->iAnfluencer->id,
            'likes_count' => 0,
        ]);
    }

    public function test_can_like_a_post()
    {
        $response = $this->postJson("/api/posts/{$this->post->id}/like");

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'data' => [
                        'likes_count' => 1,
                        'is_liked' => true
                    ],
                    'message' => 'Like agregado exitosamente'
                ]);

        $this->assertDatabaseHas('likes', [
            'post_id' => $this->post->id,
        ]);

        $this->post->refresh();
        $this->assertEquals(1, $this->post->likes_count);
    }

    public function test_can_unlike_a_post()
    {
        // First like the post
        Like::create([
            'post_id' => $this->post->id,
            'session_id' => 'test-session',
            'ip_address' => '127.0.0.1',
        ]);
        $this->post->increment('likes_count');

        $response = $this->deleteJson("/api/posts/{$this->post->id}/unlike");

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'data' => [
                        'likes_count' => 0,
                        'is_liked' => false
                    ],
                    'message' => 'Like removido exitosamente'
                ]);

        $this->assertDatabaseMissing('likes', [
            'post_id' => $this->post->id,
        ]);

        $this->post->refresh();
        $this->assertEquals(0, $this->post->likes_count);
    }

    public function test_cannot_like_same_post_twice()
    {
        // First like
        $this->postJson("/api/posts/{$this->post->id}/like");

        // Try to like again
        $response = $this->postJson("/api/posts/{$this->post->id}/like");

        $response->assertStatus(409)
                ->assertJson([
                    'success' => false,
                    'message' => 'Ya has dado like a este post'
                ]);
    }

    public function test_can_get_like_status()
    {
        $response = $this->getJson("/api/posts/{$this->post->id}/like-status");

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'data' => [
                        'likes_count' => 0,
                        'is_liked' => false
                    ]
                ]);
    }

    public function test_like_status_after_liking()
    {
        // Like the post first
        $this->postJson("/api/posts/{$this->post->id}/like");

        $response = $this->getJson("/api/posts/{$this->post->id}/like-status");

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'data' => [
                        'likes_count' => 1,
                        'is_liked' => true
                    ]
                ]);
    }

    public function test_returns_404_for_nonexistent_post()
    {
        $response = $this->postJson("/api/posts/999/like");

        $response->assertStatus(404)
                ->assertJson([
                    'success' => false,
                    'message' => 'Post no encontrado'
                ]);
    }
}