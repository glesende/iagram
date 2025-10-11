<?php

namespace App\Console\Commands;

use App\Models\IAnfluencer;
use App\Models\Post;
use App\Services\OpenAIService;
use App\Services\ImageStorageService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class GeneratePostsCommand extends Command
{
    protected $signature = 'iagram:generate-posts
                            {--count=3 : Maximum posts per IAnfluencer}
                            {--skip-images : Skip image generation to save API costs}';

    protected $description = 'Generate automatic posts for IAnfluencers using AI';

    protected OpenAIService $openAIService;
    protected ImageStorageService $imageStorageService;
    protected int $imagesGenerated = 0;
    protected int $maxImagesPerExecution;

    public function __construct(OpenAIService $openAIService, ImageStorageService $imageStorageService)
    {
        parent::__construct();
        $this->openAIService = $openAIService;
        $this->imageStorageService = $imageStorageService;
        $this->maxImagesPerExecution = config('openai.image.max_per_execution', 5);
    }

    public function handle(): int
    {
        $maxPostsPerInfluencer = (int) $this->option('count');
        $skipImages = $this->option('skip-images');

        $this->info('🤖 Starting automatic post generation for IAnfluencers...');

        if ($skipImages) {
            $this->warn('⚠️  Image generation is DISABLED. Posts will be created without images.');
        } else {
            $this->info("📸 Image generation enabled (max {$this->maxImagesPerExecution} images per execution)");
        }

        // Ensure storage directory exists
        $this->imageStorageService->ensurePostsDirectoryExists();

        $activeInfluencers = IAnfluencer::where('is_active', true)->get();

        if ($activeInfluencers->isEmpty()) {
            $this->warn('No active IAnfluencers found. Please run the seeders first.');
            return self::FAILURE;
        }

        $totalPostsGenerated = 0;

        foreach ($activeInfluencers as $influencer) {
            $this->line("Generating posts for @{$influencer->username}...");

            try {
                $postsToGenerate = rand(1, $maxPostsPerInfluencer);
                $postsGenerated = $this->generatePostsForInfluencer($influencer, $postsToGenerate, $skipImages);

                $totalPostsGenerated += $postsGenerated;
                $this->info("  ✅ Generated {$postsGenerated} posts for @{$influencer->username}");

            } catch (\Exception $e) {
                $this->error("  ❌ Error generating posts for @{$influencer->username}: " . $e->getMessage());
                Log::error("Error generating posts for IAnfluencer {$influencer->id}", [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }
        }

        $this->info("🎉 Generation completed! Total posts created: {$totalPostsGenerated}");

        if (!$skipImages) {
            $this->info("📸 Total images generated: {$this->imagesGenerated}");
        }

        return self::SUCCESS;
    }

    private function generatePostsForInfluencer(IAnfluencer $influencer, int $count, bool $skipImages = false): int
    {
        $postsGenerated = 0;

        for ($i = 0; $i < $count; $i++) {
            try {
                $context = $this->buildInfluencerContext($influencer);
                $generatedPost = $this->openAIService->generatePost($context);

                if (empty($generatedPost['content'])) {
                    $this->warn("  ⚠️ Generated empty content for @{$influencer->username}, skipping...");
                    continue;
                }

                if ($this->isContentSimilarToExisting($influencer, $generatedPost['content'])) {
                    $this->warn("  ⚠️ Generated similar content for @{$influencer->username}, skipping...");
                    continue;
                }

                // Create the post first without image
                $post = Post::create([
                    'i_anfluencer_id' => $influencer->id,
                    'content' => $generatedPost['content'],
                    'image_url' => null,
                    'ai_generation_params' => [
                        'model' => config('openai.models.chat', 'gpt-3.5-turbo'),
                        'temperature' => config('openai.influencer.post_temperature', 0.8),
                        'generated_at' => now()->toISOString(),
                        'image_description' => $generatedPost['image_description'] ?? null,
                        'hashtags' => $generatedPost['hashtags'] ?? [],
                        'mood' => $generatedPost['mood'] ?? null,
                    ],
                    'is_ai_generated' => true,
                    'published_at' => Carbon::now()->subMinutes(rand(0, 60)), // Random time within last hour
                ]);

                $postsGenerated++;

                // Generate image if enabled and limit not reached
                if (!$skipImages && $this->imagesGenerated < $this->maxImagesPerExecution) {
                    $imageDescription = $generatedPost['image_description'] ?? null;

                    if ($imageDescription) {
                        try {
                            $this->line("    🎨 Generating image for post {$post->id}...");

                            $imageUrl = $this->openAIService->generateImage($imageDescription);

                            // Download and store the image
                            $storedImagePath = $this->imageStorageService->downloadAndStoreImage($imageUrl, $post->id);

                            // Update the post with the image URL
                            $post->update(['image_url' => $storedImagePath]);

                            $this->imagesGenerated++;
                            $this->info("    ✅ Image generated and stored ({$this->imagesGenerated}/{$this->maxImagesPerExecution})");

                            // Delay after image generation to respect API rate limits
                            sleep(2);

                        } catch (\Exception $e) {
                            $this->warn("    ⚠️ Failed to generate image: " . $e->getMessage());
                            Log::warning("Image generation failed for post {$post->id}", [
                                'error' => $e->getMessage(),
                                'description' => $imageDescription
                            ]);
                        }
                    }
                } elseif (!$skipImages && $this->imagesGenerated >= $this->maxImagesPerExecution) {
                    $this->warn("    ⚠️ Image generation limit reached ({$this->maxImagesPerExecution}), skipping image");
                }

                // Small delay to avoid overwhelming the API
                sleep(1);

            } catch (\Exception $e) {
                $this->warn("⚠️ Failed to generate post {$i} for @{$influencer->username}: " . $e->getMessage());
                continue;
            }
        }

        return $postsGenerated;
    }

    private function buildInfluencerContext(IAnfluencer $influencer): array
    {
        $recentPosts = Post::where('i_anfluencer_id', $influencer->id)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->pluck('content')
            ->toArray();

        return [
            'name' => $influencer->display_name,
            'username' => $influencer->username,
            'bio' => $influencer->bio,
            'personality' => $influencer->personality_traits ?? [],
            'interests' => $influencer->interests ?? [],
            'niche' => $influencer->niche,
            'writing_style' => $this->inferWritingStyle($influencer),
            'previous_posts' => $recentPosts,
        ];
    }

    private function inferWritingStyle(IAnfluencer $influencer): string
    {
        $traits = $influencer->personality_traits ?? [];
        $niche = $influencer->niche;

        if (in_array('professional', $traits) || in_array('business', $traits)) {
            return 'Professional and informative';
        }

        if (in_array('funny', $traits) || in_array('humorous', $traits)) {
            return 'Humorous and entertaining';
        }

        if (in_array('inspirational', $traits) || in_array('motivational', $traits)) {
            return 'Inspirational and uplifting';
        }

        switch ($niche) {
            case 'lifestyle':
                return 'Casual and relatable';
            case 'fashion':
                return 'Trendy and stylish';
            case 'fitness':
                return 'Motivational and energetic';
            case 'food':
                return 'Descriptive and appetizing';
            case 'travel':
                return 'Adventurous and descriptive';
            case 'technology':
                return 'Informative and tech-savvy';
            default:
                return 'Casual and authentic';
        }
    }

    private function isContentSimilarToExisting(IAnfluencer $influencer, string $newContent): bool
    {
        $recentPosts = Post::where('i_anfluencer_id', $influencer->id)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->pluck('content')
            ->toArray();

        $newContentWords = str_word_count(strtolower($newContent), 1);

        foreach ($recentPosts as $existingContent) {
            $existingWords = str_word_count(strtolower($existingContent), 1);
            $commonWords = array_intersect($newContentWords, $existingWords);

            // If more than 40% of words are common, consider it similar
            $similarity = count($commonWords) / max(count($newContentWords), 1);

            if ($similarity > 0.4) {
                return true;
            }
        }

        return false;
    }
}