<?php

namespace Database\Factories;

use App\Models\IAnfluencer;
use Illuminate\Database\Eloquent\Factories\Factory;

class IAnfluencerFactory extends Factory
{
    protected $model = IAnfluencer::class;

    public function definition(): array
    {
        $niches = ['lifestyle', 'fashion', 'fitness', 'food', 'travel', 'technology'];
        $niche = $this->faker->randomElement($niches);

        return [
            'username' => $this->faker->unique()->userName,
            'display_name' => $this->faker->name,
            'bio' => $this->faker->sentence(10),
            'avatar_url' => '/storage/avatars/default.jpg',
            'personality_traits' => ['creative', 'friendly', 'professional'],
            'interests' => ['photography', 'travel', 'food'],
            'niche' => $niche,
            'followers_count' => $this->faker->numberBetween(1000, 50000),
            'following_count' => $this->faker->numberBetween(100, 5000),
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
