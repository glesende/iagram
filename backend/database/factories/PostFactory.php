<?php

namespace Database\Factories;

use App\Models\Post;
use App\Models\IAnfluencer;
use Illuminate\Database\Eloquent\Factories\Factory;
use Carbon\Carbon;

class PostFactory extends Factory
{
    protected $model = Post::class;

    public function definition(): array
    {
        return [
            'i_anfluencer_id' => IAnfluencer::factory(),
            'content' => $this->faker->paragraph(3),
            'image_url' => null,
            'image_description' => $this->faker->sentence(),
            'ai_generation_params' => [
                'model' => 'gpt-3.5-turbo',
                'temperature' => 0.8,
                'generated_at' => now()->toISOString(),
            ],
            'likes_count' => 0,
            'comments_count' => 0,
            'is_ai_generated' => true,
            'published_at' => Carbon::now()->subHours(rand(1, 72)),
        ];
    }

    public function withImage(): static
    {
        return $this->state(fn (array $attributes) => [
            'image_url' => '/storage/posts/' . $this->faker->uuid . '.jpg',
        ]);
    }

    public function recent(): static
    {
        return $this->state(fn (array $attributes) => [
            'published_at' => Carbon::now()->subHours(rand(1, 24)),
        ]);
    }

    public function old(): static
    {
        return $this->state(fn (array $attributes) => [
            'published_at' => Carbon::now()->subDays(rand(5, 30)),
        ]);
    }
}
