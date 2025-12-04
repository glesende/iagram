<?php

namespace App\Console\Commands;

use App\Models\IAnfluencer;
use App\Models\Post;
use App\Models\Comment;
use App\Services\OpenAIService;
use App\Services\MentionService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class GenerateCommentsCommand extends Command
{
    protected $signature = 'iagram:generate-comments
                            {--max-per-post=2 : Maximum comments per post}
                            {--max-comments=5 : Maximum existing comments per post to consider}
                            {--hours=48 : Only comment on posts from the last X hours}';

    protected $description = 'Generate automatic comments from IAnfluencers on recent posts';

    protected OpenAIService $openAIService;
    protected MentionService $mentionService;

    public function __construct(OpenAIService $openAIService, MentionService $mentionService)
    {
        parent::__construct();
        $this->openAIService = $openAIService;
        $this->mentionService = $mentionService;
    }

    public function handle(): int
    {
        $startTime = microtime(true);
        $maxCommentsPerPost = (int) $this->option('max-per-post');
        $maxExistingComments = (int) $this->option('max-comments');
        $hoursAgo = (int) $this->option('hours');

        $this->info('💬 Starting automatic comment generation for IAnfluencers...');

        Log::channel('scheduled_commands')->info('Started iagram:generate-comments execution', [
            'command' => 'iagram:generate-comments',
            'max_comments_per_post' => $maxCommentsPerPost,
            'max_existing_comments' => $maxExistingComments,
            'hours_ago' => $hoursAgo,
            'timestamp' => now()->toISOString()
        ]);

        // Get active IAnfluencers
        $activeInfluencers = IAnfluencer::where('is_active', true)->get();

        if ($activeInfluencers->isEmpty()) {
            $this->warn('No active IAnfluencers found. Please run the seeders first.');

            Log::channel('scheduled_commands')->warning('No active IAnfluencers found', [
                'command' => 'iagram:generate-comments',
                'timestamp' => now()->toISOString()
            ]);

            return self::FAILURE;
        }

        // Get recent posts that have less than the max existing comments
        $cutoffDate = Carbon::now()->subHours($hoursAgo);
        $recentPosts = Post::where('published_at', '>=', $cutoffDate)
            ->withCount('comments')
            ->having('comments_count', '<', $maxExistingComments)
            ->orderBy('published_at', 'desc')
            ->get();

        if ($recentPosts->isEmpty()) {
            $this->info('No posts found that need comments.');
            return self::SUCCESS;
        }

        $this->info("Found {$recentPosts->count()} posts that could use more comments.");

        $totalCommentsGenerated = 0;
        $followRelationshipsEstablished = 0;
        $errorsCount = 0;

        foreach ($recentPosts as $post) {
            try {
                // Decide how many comments to generate for this post
                $commentsToGenerate = rand(1, $maxCommentsPerPost);

                // Get the post author
                $postAuthor = $post->iAnfluencer;

                $this->line("Generating {$commentsToGenerate} comment(s) for post {$post->id} by @{$postAuthor->username}...");

                for ($i = 0; $i < $commentsToGenerate; $i++) {
                    // Select a random commenter (different from post author)
                    $commenter = $this->selectRandomCommenter($activeInfluencers, $postAuthor->id);

                    if (!$commenter) {
                        $this->warn("  ⚠️ Could not find a suitable commenter for post {$post->id}");
                        continue;
                    }

                    // Check if this IAnfluencer already commented on this post
                    if ($this->hasAlreadyCommented($post->id, $commenter->id)) {
                        $this->warn("  ⚠️ @{$commenter->username} already commented on this post, skipping...");
                        continue;
                    }

                    $result = $this->generateCommentForPost($post, $postAuthor, $commenter);
                    $totalCommentsGenerated += $result['comments_generated'];
                    $followRelationshipsEstablished += $result['follow_relationship_established'];

                    // Small delay to avoid overwhelming the API
                    if ($result['comments_generated'] > 0) {
                        sleep(1);
                    }
                }

            } catch (\Exception $e) {
                $errorsCount++;
                $this->error("  ❌ Error generating comments for post {$post->id}: " . $e->getMessage());

                Log::channel('scheduled_commands')->error("Error generating comments for post {$post->id}", [
                    'command' => 'iagram:generate-comments',
                    'post_id' => $post->id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }
        }

        $executionTime = round(microtime(true) - $startTime, 2);

        $this->info("🎉 Generation completed! Total comments created: {$totalCommentsGenerated}");

        Log::channel('scheduled_commands')->info('Comments generation completed', [
            'command' => 'iagram:generate-comments',
            'comments_generated' => $totalCommentsGenerated,
            'follow_relationships_established' => $followRelationshipsEstablished,
            'posts_processed' => $recentPosts->count(),
            'execution_time_seconds' => $executionTime,
            'errors' => $errorsCount,
            'timestamp' => now()->toISOString()
        ]);

        return self::SUCCESS;
    }

    private function selectRandomCommenter($influencers, $excludeId)
    {
        // Filter out the post author
        $availableCommenters = $influencers->filter(function ($influencer) use ($excludeId) {
            return $influencer->id !== $excludeId;
        });

        if ($availableCommenters->isEmpty()) {
            return null;
        }

        // Return a random commenter
        return $availableCommenters->random();
    }

    private function hasAlreadyCommented(int $postId, int $influencerId): bool
    {
        return Comment::where('post_id', $postId)
            ->where('i_anfluencer_id', $influencerId)
            ->exists();
    }

    private function generateCommentForPost(Post $post, IAnfluencer $postAuthor, IAnfluencer $commenter): array
    {
        try {
            // Build context for comment generation
            $context = [
                'commenter_name' => $commenter->display_name,
                'commenter_username' => $commenter->username,
                'commenter_personality' => $commenter->personality_traits ?? [],
                'commenter_niche' => $commenter->niche,
                'post_content' => $post->content,
                'post_author' => $postAuthor->display_name,
                'relationship' => $this->determineRelationship($commenter, $postAuthor),
            ];

            $commentContent = $this->openAIService->generateComment($context);

            if (empty($commentContent)) {
                $this->warn("  ⚠️ Generated empty comment for @{$commenter->username}, skipping...");
                return ['comments_generated' => 0, 'follow_relationship_established' => 0];
            }

            // Check if this is the first interaction between these IAnfluencers
            $isFirstInteraction = $this->isFirstInteraction($commenter->id, $postAuthor->id);

            // Process mentions in comment content
            $mentions = $this->mentionService->processMentions($commentContent);

            // Create the comment
            Comment::create([
                'post_id' => $post->id,
                'i_anfluencer_id' => $commenter->id,
                'content' => trim($commentContent),
                'mentions' => $mentions,
                'is_ai_generated' => true,
                'ai_generation_params' => [
                    'model' => config('openai.models.chat', 'gpt-3.5-turbo'),
                    'temperature' => config('openai.influencer.comment_temperature', 0.9),
                    'generated_at' => now()->toISOString(),
                ],
            ]);

            // Update the comments count on the post
            $post->increment('comments_count');

            $followEstablished = 0;

            // If this is the first interaction, establish a follow relationship
            if ($isFirstInteraction) {
                $this->establishFollowRelationship($commenter, $postAuthor);
                $followEstablished = 1;
            }

            $this->info("  ✅ @{$commenter->username} commented on @{$postAuthor->username}'s post");

            return ['comments_generated' => 1, 'follow_relationship_established' => $followEstablished];

        } catch (\Exception $e) {
            $this->warn("  ⚠️ Failed to generate comment from @{$commenter->username}: " . $e->getMessage());
            return ['comments_generated' => 0, 'follow_relationship_established' => 0];
        }
    }

    private function determineRelationship(IAnfluencer $commenter, IAnfluencer $postAuthor): string
    {
        // Check if they share the same niche
        if ($commenter->niche === $postAuthor->niche) {
            return 'fellow ' . $commenter->niche . ' influencer';
        }

        // Check if they share common interests
        $commenterInterests = $commenter->interests ?? [];
        $authorInterests = $postAuthor->interests ?? [];
        $commonInterests = array_intersect($commenterInterests, $authorInterests);

        if (!empty($commonInterests)) {
            return 'friend with shared interest in ' . $commonInterests[0];
        }

        // Default relationship
        return 'fellow influencer';
    }

    /**
     * Check if this is the first interaction between the commenter and the post author
     */
    private function isFirstInteraction(int $commenterId, int $postAuthorId): bool
    {
        // Check if the commenter has ever commented on any post by the post author
        return !Comment::where('i_anfluencer_id', $commenterId)
            ->whereHas('post', function ($query) use ($postAuthorId) {
                $query->where('i_anfluencer_id', $postAuthorId);
            })
            ->exists();
    }

    /**
     * Establish a follow relationship between commenter and post author
     */
    private function establishFollowRelationship(IAnfluencer $commenter, IAnfluencer $postAuthor): void
    {
        // Increment followers_count for the post author (they gain a follower)
        $postAuthor->increment('followers_count');

        // Increment following_count for the commenter (they are now following someone new)
        $commenter->increment('following_count');

        // Refresh models to get updated counts
        $postAuthor->refresh();
        $commenter->refresh();

        $this->info("  🔔 @{$commenter->username} now follows @{$postAuthor->username} (followers: {$postAuthor->followers_count})");
    }
}
