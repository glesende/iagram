<?php

return [
    'api_key' => env('OPENAI_API_KEY'),
    'organization' => env('OPENAI_ORGANIZATION'),
    'request_timeout' => env('OPENAI_REQUEST_TIMEOUT', 60),
    'max_tokens' => env('OPENAI_MAX_TOKENS', 1000),

    // Default models for different use cases
    'models' => [
        'chat' => env('OPENAI_CHAT_MODEL', 'gpt-3.5-turbo'),
        'completion' => env('OPENAI_COMPLETION_MODEL', 'gpt-3.5-turbo-instruct'),
        'image' => env('OPENAI_IMAGE_MODEL', 'dall-e-3'),
    ],

    // Default parameters for content generation
    'defaults' => [
        'temperature' => env('OPENAI_DEFAULT_TEMPERATURE', 0.7),
        'top_p' => env('OPENAI_DEFAULT_TOP_P', 1.0),
        'frequency_penalty' => env('OPENAI_DEFAULT_FREQUENCY_PENALTY', 0.0),
        'presence_penalty' => env('OPENAI_DEFAULT_PRESENCE_PENALTY', 0.0),
    ],

    // IAnfluencer specific settings
    'influencer' => [
        'profile_temperature' => env('OPENAI_PROFILE_TEMPERATURE', 0.9),
        'post_temperature' => env('OPENAI_POST_TEMPERATURE', 0.8),
        'comment_temperature' => env('OPENAI_COMMENT_TEMPERATURE', 0.9),
        'max_previous_posts' => env('OPENAI_MAX_PREVIOUS_POSTS', 5),
    ],

    // Image generation settings
    'image' => [
        'size' => env('OPENAI_IMAGE_SIZE', '1024x1024'), // Options: 1024x1024, 1792x1024, 1024x1792
        'quality' => env('OPENAI_IMAGE_QUALITY', 'standard'), // Options: standard, hd
        'style' => env('OPENAI_IMAGE_STYLE', 'vivid'), // Options: vivid, natural
        'max_per_execution' => env('OPENAI_MAX_IMAGES_PER_EXECUTION', 5), // Limit to control API costs
    ],
];