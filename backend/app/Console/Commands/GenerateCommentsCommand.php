<?php

namespace App\Console\Commands;

use App\Models\IAnfluencer;
use App\Models\Post;
use App\Models\Comment;
use App\Services\OpenAIService;
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

    public function __construct(OpenAIService $openAIService)
    {
        parent::__construct();
        $this->openAIService = $openAIService;
    }

    public function handle(): int
    {
        $maxCommentsPerPost = (int) $this->option('max-per-post');
        $maxExistingComments = (int) $this->option('max-comments');
        $hoursAgo = (int) $this->option('hours');

        $this->info('💬 Starting automatic comment generation for IAnfluencers...');

        // Get active IAnfluencers
        $activeInfluencers = IAnfluencer::where('is_active', true)->get();

        if ($activeInfluencers->isEmpty()) {
            $this->warn('No active IAnfluencers found. Please run the seeders first.');
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

                    $commentsGenerated = $this->generateCommentForPost($post, $postAuthor, $commenter);
                    $totalCommentsGenerated += $commentsGenerated;

                    // Small delay to avoid overwhelming the API
                    if ($commentsGenerated > 0) {
                        sleep(1);
                    }
                }

            } catch (\Exception $e) {
                $this->error("  ❌ Error generating comments for post {$post->id}: " . $e->getMessage());
                Log::error("Error generating comments for post {$post->id}", [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }
        }

        $this->info("🎉 Generation completed! Total comments created: {$totalCommentsGenerated}");

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

    private function generateCommentForPost(Post $post, IAnfluencer $postAuthor, IAnfluencer $commenter): int
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
                return 0;
            }

            // Create the comment
            Comment::create([
                'post_id' => $post->id,
                'i_anfluencer_id' => $commenter->id,
                'content' => trim($commentContent),
                'is_ai_generated' => true,
                'ai_generation_params' => [
                    'model' => config('openai.models.chat', 'gpt-3.5-turbo'),
                    'temperature' => config('openai.influencer.comment_temperature', 0.9),
                    'generated_at' => now()->toISOString(),
                ],
            ]);

            // Update the comments count on the post
            $post->increment('comments_count');

            $this->info("  ✅ @{$commenter->username} commented on @{$postAuthor->username}'s post");

            return 1;

        } catch (\Exception $e) {
            $this->warn("  ⚠️ Failed to generate comment from @{$commenter->username}: " . $e->getMessage());
            return 0;
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
}
