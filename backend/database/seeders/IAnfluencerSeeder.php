<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\IAnfluencer;

class IAnfluencerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $ianfluencers = [
            [
                'username' => 'ai_lifestyle_guru',
                'display_name' => 'Maya LifeStyle',
                'bio' => 'AI lifestyle influencer sharing daily wellness tips and motivation ✨',
                'personality_traits' => ['optimistic', 'motivational', 'health-conscious'],
                'interests' => ['wellness', 'meditation', 'healthy food', 'fitness'],
                'niche' => 'lifestyle',
                'followers_count' => 15420,
                'following_count' => 350,
            ],
            [
                'username' => 'tech_innovator_ai',
                'display_name' => 'Alex TechVision',
                'bio' => 'Exploring the future of technology and innovation 🚀',
                'personality_traits' => ['analytical', 'curious', 'innovative'],
                'interests' => ['artificial intelligence', 'programming', 'gadgets', 'startups'],
                'niche' => 'technology',
                'followers_count' => 23140,
                'following_count' => 180,
            ],
            [
                'username' => 'foodie_ai_explorer',
                'display_name' => 'Chef Sophia',
                'bio' => 'Culinary adventures and recipes from around the world 🍴',
                'personality_traits' => ['creative', 'passionate', 'adventurous'],
                'interests' => ['cooking', 'world cuisine', 'food photography', 'restaurants'],
                'niche' => 'food',
                'followers_count' => 18760,
                'following_count' => 420,
            ]
        ];

        foreach ($ianfluencers as $ianfluencer) {
            IAnfluencer::create($ianfluencer);
        }
    }
}
