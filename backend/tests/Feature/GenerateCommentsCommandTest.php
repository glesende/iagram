<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\IAnfluencer;
use App\Models\Post;
use App\Models\Comment;
use App\Services\OpenAIService;
use Mockery;
use Carbon\Carbon;

class GenerateCommentsCommandTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Freeze time for consistent testing
        Carbon::setTestNow(Carbon::parse('2025-10-17 12:00:00'));
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow(); // Reset time
        parent::tearDown();
    }

    public function test_generates_comments_on_recent_posts()
    {
        // Arrange: Create IAnfluencers and a recent post
        $postAuthor = IAnfluencer::factory()->create([
            'username' => 'post_author',
            'is_active' => true,
            'followers_count' => 100,
        ]);

        $commenter = IAnfluencer::factory()->create([
            'username' => 'commenter',
            'is_active' => true,
            'following_count' => 50,
        ]);

        $post = Post::factory()->create([
            'i_anfluencer_id' => $postAuthor->id,
            'content' => 'Test post content',
            'published_at' => Carbon::now()->subHours(5), // Within last 48 hours
            'comments_count' => 0,
        ]);

        // Mock OpenAIService
        $mockOpenAI = Mockery::mock(OpenAIService::class);
        $mockOpenAI->shouldReceive('generateComment')
            ->andReturn('Great post! Really enjoyed this content.');

        $this->app->instance(OpenAIService::class, $mockOpenAI);

        // Act
        $this->artisan('iagram:generate-comments')
            ->assertExitCode(0);

        // Assert: Verify comment was created
        $this->assertDatabaseHas('comments', [
            'post_id' => $post->id,
            'i_anfluencer_id' => $commenter->id,
            'is_ai_generated' => true,
        ]);
    }

    public function test_does_not_comment_on_own_posts()
    {
        // Arrange: Create only one active IAnfluencer
        $influencer = IAnfluencer::factory()->create(['is_active' => true]);

        $post = Post::factory()->create([
            'i_anfluencer_id' => $influencer->id,
            'published_at' => Carbon::now()->subHours(5),
            'comments_count' => 0,
        ]);

        $mockOpenAI = Mockery::mock(OpenAIService::class);
        $mockOpenAI->shouldNotReceive('generateComment');

        $this->app->instance(OpenAIService::class, $mockOpenAI);

        // Act
        $this->artisan('iagram:generate-comments')
            ->assertExitCode(0);

        // Assert: No comments should be created (can't comment on own post)
        $this->assertEquals(0, Comment::where('post_id', $post->id)->count());
    }

    public function test_updates_followers_count_on_first_interaction()
    {
        // Arrange
        $postAuthor = IAnfluencer::factory()->create([
            'username' => 'author',
            'is_active' => true,
            'followers_count' => 100,
        ]);

        $commenter = IAnfluencer::factory()->create([
            'username' => 'new_follower',
            'is_active' => true,
            'following_count' => 50,
        ]);

        $post = Post::factory()->create([
            'i_anfluencer_id' => $postAuthor->id,
            'published_at' => Carbon::now()->subHours(5),
            'comments_count' => 0,
        ]);

        $mockOpenAI = Mockery::mock(OpenAIService::class);
        $mockOpenAI->shouldReceive('generateComment')
            ->andReturn('This is my first comment on your post!');

        $this->app->instance(OpenAIService::class, $mockOpenAI);

        // Act
        $this->artisan('iagram:generate-comments')
            ->assertExitCode(0);

        // Assert: Followers count should be updated
        $postAuthor->refresh();
        $commenter->refresh();

        $this->assertEquals(101, $postAuthor->followers_count); // +1 follower
        $this->assertEquals(51, $commenter->following_count);   // +1 following
    }

    public function test_does_not_update_followers_count_on_subsequent_interactions()
    {
        // Arrange
        $postAuthor = IAnfluencer::factory()->create([
            'is_active' => true,
            'followers_count' => 100,
        ]);

        $commenter = IAnfluencer::factory()->create([
            'is_active' => true,
            'following_count' => 50,
        ]);

        // Create an existing comment from commenter to postAuthor
        $existingPost = Post::factory()->create([
            'i_anfluencer_id' => $postAuthor->id,
            'published_at' => Carbon::now()->subDays(2),
        ]);

        Comment::factory()->create([
            'post_id' => $existingPost->id,
            'i_anfluencer_id' => $commenter->id,
        ]);

        // Create a new post
        $newPost = Post::factory()->create([
            'i_anfluencer_id' => $postAuthor->id,
            'published_at' => Carbon::now()->subHours(5),
            'comments_count' => 0,
        ]);

        $mockOpenAI = Mockery::mock(OpenAIService::class);
        $mockOpenAI->shouldReceive('generateComment')
            ->andReturn('Another great post!');

        $this->app->instance(OpenAIService::class, $mockOpenAI);

        // Act
        $this->artisan('iagram:generate-comments')
            ->assertExitCode(0);

        // Assert: Followers count should NOT change (not first interaction)
        $postAuthor->refresh();
        $commenter->refresh();

        $this->assertEquals(100, $postAuthor->followers_count); // No change
        $this->assertEquals(50, $commenter->following_count);   // No change
    }

    public function test_does_not_comment_twice_on_same_post()
    {
        // Arrange
        $postAuthor = IAnfluencer::factory()->create(['is_active' => true]);
        $commenter = IAnfluencer::factory()->create(['is_active' => true]);

        $post = Post::factory()->create([
            'i_anfluencer_id' => $postAuthor->id,
            'published_at' => Carbon::now()->subHours(5),
            'comments_count' => 0,
        ]);

        // Create existing comment from this commenter
        Comment::factory()->create([
            'post_id' => $post->id,
            'i_anfluencer_id' => $commenter->id,
        ]);

        $mockOpenAI = Mockery::mock(OpenAIService::class);
        $mockOpenAI->shouldNotReceive('generateComment');

        $this->app->instance(OpenAIService::class, $mockOpenAI);

        // Act
        $this->artisan('iagram:generate-comments')
            ->assertExitCode(0);

        // Assert: Should still have only 1 comment
        $this->assertEquals(1, Comment::where('post_id', $post->id)->count());
    }

    public function test_respects_hours_option()
    {
        // Arrange
        $postAuthor = IAnfluencer::factory()->create(['is_active' => true]);
        $commenter = IAnfluencer::factory()->create(['is_active' => true]);

        // Create an old post (older than 24 hours)
        $oldPost = Post::factory()->create([
            'i_anfluencer_id' => $postAuthor->id,
            'published_at' => Carbon::now()->subHours(30),
            'comments_count' => 0,
        ]);

        // Create a recent post (within 24 hours)
        $recentPost = Post::factory()->create([
            'i_anfluencer_id' => $postAuthor->id,
            'published_at' => Carbon::now()->subHours(5),
            'comments_count' => 0,
        ]);

        $mockOpenAI = Mockery::mock(OpenAIService::class);
        $mockOpenAI->shouldReceive('generateComment')
            ->andReturn('Comment on recent post');

        $this->app->instance(OpenAIService::class, $mockOpenAI);

        // Act: Only comment on posts from last 24 hours
        $this->artisan('iagram:generate-comments', ['--hours' => 24])
            ->assertExitCode(0);

        // Assert: Only recent post should have comments
        $this->assertEquals(0, Comment::where('post_id', $oldPost->id)->count());
        $this->assertGreaterThanOrEqual(1, Comment::where('post_id', $recentPost->id)->count());
    }

    public function test_respects_max_existing_comments_limit()
    {
        // Arrange
        $postAuthor = IAnfluencer::factory()->create(['is_active' => true]);
        $commenter = IAnfluencer::factory()->create(['is_active' => true]);

        $post = Post::factory()->create([
            'i_anfluencer_id' => $postAuthor->id,
            'published_at' => Carbon::now()->subHours(5),
            'comments_count' => 5, // Already has max comments
        ]);

        // Create 5 existing comments
        Comment::factory()->count(5)->create([
            'post_id' => $post->id,
        ]);

        $mockOpenAI = Mockery::mock(OpenAIService::class);
        $mockOpenAI->shouldNotReceive('generateComment');

        $this->app->instance(OpenAIService::class, $mockOpenAI);

        // Act: Use default max-comments=5
        $this->artisan('iagram:generate-comments')
            ->assertExitCode(0);

        // Assert: No new comments should be added
        $this->assertEquals(5, Comment::where('post_id', $post->id)->count());
    }

    public function test_increments_post_comments_count()
    {
        // Arrange
        $postAuthor = IAnfluencer::factory()->create(['is_active' => true]);
        $commenter = IAnfluencer::factory()->create(['is_active' => true]);

        $post = Post::factory()->create([
            'i_anfluencer_id' => $postAuthor->id,
            'published_at' => Carbon::now()->subHours(5),
            'comments_count' => 0,
        ]);

        $mockOpenAI = Mockery::mock(OpenAIService::class);
        $mockOpenAI->shouldReceive('generateComment')
            ->andReturn('Test comment');

        $this->app->instance(OpenAIService::class, $mockOpenAI);

        // Act
        $this->artisan('iagram:generate-comments')
            ->assertExitCode(0);

        // Assert: Post comments_count should be incremented
        $post->refresh();
        $this->assertGreaterThanOrEqual(1, $post->comments_count);
    }

    public function test_skips_empty_comment_content()
    {
        // Arrange
        $postAuthor = IAnfluencer::factory()->create(['is_active' => true]);
        $commenter = IAnfluencer::factory()->create(['is_active' => true]);

        $post = Post::factory()->create([
            'i_anfluencer_id' => $postAuthor->id,
            'published_at' => Carbon::now()->subHours(5),
            'comments_count' => 0,
        ]);

        $mockOpenAI = Mockery::mock(OpenAIService::class);
        $mockOpenAI->shouldReceive('generateComment')
            ->once()
            ->andReturn(''); // Empty comment

        $this->app->instance(OpenAIService::class, $mockOpenAI);

        // Act
        $this->artisan('iagram:generate-comments')
            ->assertExitCode(0);

        // Assert: No comment should be created
        $this->assertEquals(0, Comment::where('post_id', $post->id)->count());
    }

    public function test_stores_ai_generation_params()
    {
        // Arrange
        $postAuthor = IAnfluencer::factory()->create(['is_active' => true]);
        $commenter = IAnfluencer::factory()->create(['is_active' => true]);

        $post = Post::factory()->create([
            'i_anfluencer_id' => $postAuthor->id,
            'published_at' => Carbon::now()->subHours(5),
            'comments_count' => 0,
        ]);

        $mockOpenAI = Mockery::mock(OpenAIService::class);
        $mockOpenAI->shouldReceive('generateComment')
            ->andReturn('Awesome post with AI params!');

        $this->app->instance(OpenAIService::class, $mockOpenAI);

        // Act
        $this->artisan('iagram:generate-comments')
            ->assertExitCode(0);

        // Assert: Check ai_generation_params are stored
        $comment = Comment::where('post_id', $post->id)->first();

        $this->assertNotNull($comment);
        $this->assertNotNull($comment->ai_generation_params);
        $this->assertArrayHasKey('model', $comment->ai_generation_params);
        $this->assertArrayHasKey('temperature', $comment->ai_generation_params);
        $this->assertArrayHasKey('generated_at', $comment->ai_generation_params);
        $this->assertTrue($comment->is_ai_generated);
    }

    public function test_does_not_fail_with_no_recent_posts()
    {
        // Arrange: Create IAnfluencers but no recent posts
        IAnfluencer::factory()->count(3)->create(['is_active' => true]);

        // Create only old posts
        $influencer = IAnfluencer::first();
        Post::factory()->create([
            'i_anfluencer_id' => $influencer->id,
            'published_at' => Carbon::now()->subDays(5), // Too old
            'comments_count' => 0,
        ]);

        $mockOpenAI = Mockery::mock(OpenAIService::class);
        $mockOpenAI->shouldNotReceive('generateComment');

        $this->app->instance(OpenAIService::class, $mockOpenAI);

        // Act
        $this->artisan('iagram:generate-comments')
            ->expectsOutput('No posts found that need comments.')
            ->assertExitCode(0);

        // Assert: No comments should be created
        $this->assertEquals(0, Comment::count());
    }

    public function test_multiple_commenters_can_comment_on_same_post()
    {
        // Arrange
        $postAuthor = IAnfluencer::factory()->create(['is_active' => true]);
        $commenter1 = IAnfluencer::factory()->create(['is_active' => true, 'username' => 'commenter1']);
        $commenter2 = IAnfluencer::factory()->create(['is_active' => true, 'username' => 'commenter2']);

        $post = Post::factory()->create([
            'i_anfluencer_id' => $postAuthor->id,
            'published_at' => Carbon::now()->subHours(5),
            'comments_count' => 0,
        ]);

        $mockOpenAI = Mockery::mock(OpenAIService::class);
        $mockOpenAI->shouldReceive('generateComment')
            ->andReturn('Test comment from different users');

        $this->app->instance(OpenAIService::class, $mockOpenAI);

        // Act: Run command with max-per-post=2
        $this->artisan('iagram:generate-comments', ['--max-per-post' => 2])
            ->assertExitCode(0);

        // Assert: Post should have comments from different IAnfluencers
        $comments = Comment::where('post_id', $post->id)->get();
        $this->assertGreaterThanOrEqual(1, $comments->count());

        // Each comment should be from a different IAnfluencer (not the post author)
        foreach ($comments as $comment) {
            $this->assertNotEquals($postAuthor->id, $comment->i_anfluencer_id);
        }
    }

    public function test_returns_failure_when_no_active_ianfluencers()
    {
        // Arrange: Create only inactive IAnfluencers
        IAnfluencer::factory()->create(['is_active' => false]);

        $mockOpenAI = Mockery::mock(OpenAIService::class);
        $mockOpenAI->shouldNotReceive('generateComment');

        $this->app->instance(OpenAIService::class, $mockOpenAI);

        // Act
        $this->artisan('iagram:generate-comments')
            ->expectsOutput('No active IAnfluencers found. Please run the seeders first.')
            ->assertExitCode(1);

        // Assert
        $this->assertEquals(0, Comment::count());
    }
}
