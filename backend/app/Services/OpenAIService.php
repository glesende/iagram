<?php

namespace App\Services;

use OpenAI\Client as OpenAI;
use OpenAI\Factory;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Config;

class OpenAIService
{
    protected OpenAI $client;

    public function __construct()
    {
        $apiKey = config('openai.api_key');

        if (!$apiKey) {
            throw new Exception('OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment.');
        }

        $this->client = (new Factory())
            ->withApiKey($apiKey)
            ->withOrganization(config('openai.organization'))
            ->withHttpClient(new \GuzzleHttp\Client([
                'timeout' => config('openai.request_timeout', 60),
            ]))
            ->make();
    }

    public function generateText(string $prompt, array $options = []): string
    {
        try {
            $response = $this->client->completions()->create([
                'model' => $options['model'] ?? 'gpt-3.5-turbo-instruct',
                'prompt' => $prompt,
                'max_tokens' => $options['max_tokens'] ?? config('openai.max_tokens', 1000),
                'temperature' => $options['temperature'] ?? 0.7,
                'top_p' => $options['top_p'] ?? 1.0,
            ]);

            return trim($response->choices[0]->text);
        } catch (Exception $e) {
            Log::error('OpenAI API Error: ' . $e->getMessage());
            throw new Exception('Error generating text from OpenAI: ' . $e->getMessage());
        }
    }

    public function generateChatCompletion(array $messages, array $options = []): string
    {
        try {
            $response = $this->client->chat()->create([
                'model' => $options['model'] ?? config('openai.models.chat', 'gpt-3.5-turbo'),
                'messages' => $messages,
                'max_tokens' => $options['max_tokens'] ?? config('openai.max_tokens', 1000),
                'temperature' => $options['temperature'] ?? config('openai.defaults.temperature', 0.7),
                'top_p' => $options['top_p'] ?? config('openai.defaults.top_p', 1.0),
                'frequency_penalty' => $options['frequency_penalty'] ?? config('openai.defaults.frequency_penalty', 0.0),
                'presence_penalty' => $options['presence_penalty'] ?? config('openai.defaults.presence_penalty', 0.0),
            ]);

            return $response->choices[0]->message->content;
        } catch (Exception $e) {
            Log::error('OpenAI Chat API Error: ' . $e->getMessage());
            throw new Exception('Error generating chat completion from OpenAI: ' . $e->getMessage());
        }
    }

    public function generateIAnfluencerProfile(array $characteristics = []): array
    {
        $prompt = "Generate a unique social media influencer profile with the following characteristics:\n";

        if (!empty($characteristics)) {
            foreach ($characteristics as $key => $value) {
                $prompt .= "- $key: $value\n";
            }
        }

        $prompt .= "\nProvide the response in JSON format with the following fields:
- name: Full name
- username: Social media handle (without @)
- bio: Short bio description
- personality: Array of personality traits
- interests: Array of interests/topics they post about
- writing_style: Description of their writing style
- avatar_description: Description for generating their profile picture";

        $messages = [
            ['role' => 'system', 'content' => 'You are an AI that creates unique and diverse social media influencer profiles. Always respond with valid JSON.'],
            ['role' => 'user', 'content' => $prompt]
        ];

        $response = $this->generateChatCompletion($messages, [
            'temperature' => config('openai.influencer.profile_temperature', 0.9)
        ]);

        try {
            return json_decode($response, true);
        } catch (Exception $e) {
            Log::error('Error parsing IAnfluencer profile JSON: ' . $e->getMessage());
            throw new Exception('Error parsing generated profile data');
        }
    }

    public function generatePost(array $context): array
    {
        $prompt = "Generate a social media post for the following influencer:\n";
        $prompt .= "Name: " . ($context['name'] ?? 'Unknown') . "\n";
        $prompt .= "Bio: " . ($context['bio'] ?? 'No bio available') . "\n";
        $prompt .= "Personality: " . implode(', ', $context['personality'] ?? []) . "\n";
        $prompt .= "Interests: " . implode(', ', $context['interests'] ?? []) . "\n";
        $prompt .= "Writing Style: " . ($context['writing_style'] ?? 'Casual') . "\n";

        if (!empty($context['previous_posts'])) {
            $prompt .= "\nPrevious posts (avoid repetition):\n";
            foreach (array_slice($context['previous_posts'], -3) as $post) {
                $prompt .= "- " . $post . "\n";
            }
        }

        $prompt .= "\nGenerate a new, unique post that fits this influencer's style and personality.
Provide the response in JSON format with the following fields:
- content: The post text (keep it engaging and authentic)
- image_description: Description for generating an accompanying image
- hashtags: Array of relevant hashtags (without #)
- mood: The overall mood/tone of the post";

        $messages = [
            ['role' => 'system', 'content' => 'You are an AI that creates authentic social media posts for influencers. Always respond with valid JSON.'],
            ['role' => 'user', 'content' => $prompt]
        ];

        $response = $this->generateChatCompletion($messages, [
            'temperature' => config('openai.influencer.post_temperature', 0.8)
        ]);

        try {
            return json_decode($response, true);
        } catch (Exception $e) {
            Log::error('Error parsing post JSON: ' . $e->getMessage());
            throw new Exception('Error parsing generated post data');
        }
    }

    public function generateComment(array $context): string
    {
        $prompt = "Generate a comment for a social media post from the following influencer:\n";
        $prompt .= "Commenter Name: " . ($context['commenter_name'] ?? 'Unknown') . "\n";
        $prompt .= "Commenter Personality: " . implode(', ', $context['commenter_personality'] ?? []) . "\n";
        $prompt .= "Post Content: " . ($context['post_content'] ?? 'No content') . "\n";

        if (!empty($context['relationship'])) {
            $prompt .= "Relationship to post author: " . $context['relationship'] . "\n";
        }

        $prompt .= "\nGenerate a natural, engaging comment that fits this influencer's personality. Keep it concise and authentic (1-2 sentences max).";

        $messages = [
            ['role' => 'system', 'content' => 'You are an AI that creates natural social media comments from influencers. Keep responses short and authentic.'],
            ['role' => 'user', 'content' => $prompt]
        ];

        return $this->generateChatCompletion($messages, [
            'temperature' => config('openai.influencer.comment_temperature', 0.9),
            'max_tokens' => 100
        ]);
    }

    public function generateImagePrompt(string $description, array $options = []): string
    {
        $style = $options['style'] ?? 'modern, high-quality, Instagram-worthy';
        $mood = $options['mood'] ?? 'positive and engaging';

        $prompt = "Create a detailed image generation prompt for: $description. ";
        $prompt .= "Style: $style. Mood: $mood. ";
        $prompt .= "The image should be suitable for social media posting, visually appealing, and professional quality.";

        $messages = [
            ['role' => 'system', 'content' => 'You are an expert at creating detailed prompts for AI image generation. Create prompts that result in high-quality, engaging social media images.'],
            ['role' => 'user', 'content' => $prompt]
        ];

        return $this->generateChatCompletion($messages, ['temperature' => 0.7, 'max_tokens' => 200]);
    }

    /**
     * Generate an image using DALL-E based on a description
     *
     * @param string $description The description of the image to generate
     * @param array $options Additional options (size, quality, style)
     * @return string The URL of the generated image
     * @throws Exception If image generation fails
     */
    public function generateImage(string $description, array $options = []): string
    {
        try {
            $model = $options['model'] ?? config('openai.models.image', 'dall-e-3');
            $size = $options['size'] ?? config('openai.image.size', '1024x1024');
            $quality = $options['quality'] ?? config('openai.image.quality', 'standard');
            $style = $options['style'] ?? config('openai.image.style', 'vivid');

            // Ensure the description is suitable for DALL-E (max 4000 characters for DALL-E 3)
            $cleanDescription = mb_substr($description, 0, 4000);

            $response = $this->client->images()->create([
                'model' => $model,
                'prompt' => $cleanDescription,
                'size' => $size,
                'quality' => $quality,
                'style' => $style,
                'n' => 1, // Generate only 1 image
            ]);

            // Get the URL from the first generated image
            $imageUrl = $response->data[0]->url;

            if (!$imageUrl) {
                throw new Exception('No image URL returned from OpenAI');
            }

            return $imageUrl;

        } catch (Exception $e) {
            Log::error('OpenAI Image Generation Error: ' . $e->getMessage());
            throw new Exception('Error generating image from OpenAI: ' . $e->getMessage());
        }
    }

    public function getClient(): OpenAI
    {
        return $this->client;
    }
}