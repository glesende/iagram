<?php

namespace Database\Factories;

use App\Models\Comment;
use App\Models\Post;
use App\Models\IAnfluencer;
use Illuminate\Database\Eloquent\Factories\Factory;

class CommentFactory extends Factory
{
    protected $model = Comment::class;

    public function definition(): array
    {
        return [
            'post_id' => Post::factory(),
            'i_anfluencer_id' => IAnfluencer::factory(),
            'content' => $this->faker->sentence(rand(5, 15)),
            'is_ai_generated' => true,
            'ai_generation_params' => [
                'model' => 'gpt-3.5-turbo',
                'temperature' => 0.9,
                'generated_at' => now()->toISOString(),
            ],
        ];
    }

    public function manual(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_ai_generated' => false,
            'ai_generation_params' => null,
        ]);
    }
}
