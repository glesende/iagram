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
                'avatar_url' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=maya&backgroundColor=b6e3f4&hair=long01&hairColor=4a312c&top=longHairStraight&accessories=prescription02',
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
                'avatar_url' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex&backgroundColor=c0aede&hair=short01&hairColor=2c1b18&top=shortHairShortFlat&accessories=prescription01',
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
                'avatar_url' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=sophia&backgroundColor=ffd5dc&hair=long02&hairColor=724133&top=longHairBigHair&accessories=none',
            ]
        ];

        foreach ($ianfluencers as $ianfluencer) {
            IAnfluencer::create($ianfluencer);
        }
    }
}
