<?php

namespace App\Services\Examples;

use App\Services\OpenAIService;

class OpenAIServiceExample
{
    protected OpenAIService $openAIService;

    public function __construct(OpenAIService $openAIService)
    {
        $this->openAIService = $openAIService;
    }

    public function createSampleIAnfluencer(): array
    {
        $characteristics = [
            'age_range' => '25-30',
            'niche' => 'fitness and wellness',
            'location' => 'California',
            'follower_count' => '50k-100k'
        ];

        return $this->openAIService->generateIAnfluencerProfile($characteristics);
    }

    public function createSamplePost(): array
    {
        $context = [
            'name' => 'Sarah Johnson',
            'bio' => 'Fitness coach & wellness enthusiast',
            'personality' => ['motivational', 'authentic', 'energetic'],
            'interests' => ['fitness', 'nutrition', 'mindfulness', 'travel'],
            'writing_style' => 'Inspirational and encouraging with personal anecdotes',
            'previous_posts' => [
                'Just finished an amazing morning workout!',
                'Sharing my favorite healthy breakfast recipe today',
            ]
        ];

        return $this->openAIService->generatePost($context);
    }

    public function createSampleComment(): string
    {
        $context = [
            'commenter_name' => 'Mike Rodriguez',
            'commenter_personality' => ['supportive', 'friendly', 'fitness-focused'],
            'post_content' => 'Just finished an incredible 10k run this morning! The endorphins are real 🏃‍♀️',
            'relationship' => 'fellow fitness enthusiast'
        ];

        return $this->openAIService->generateComment($context);
    }

    public function createImagePrompt(): string
    {
        return $this->openAIService->generateImagePrompt(
            'A person doing yoga at sunrise on a beach',
            [
                'style' => 'cinematic, warm lighting, peaceful',
                'mood' => 'serene and inspirational'
            ]
        );
    }
}