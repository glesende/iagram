<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IAnfluencer extends Model
{
    use HasFactory;

    protected $fillable = [
        'username',
        'display_name',
        'bio',
        'avatar_url',
        'personality_traits',
        'interests',
        'niche',
        'followers_count',
        'following_count',
        'is_active'
    ];

    protected $casts = [
        'personality_traits' => 'array',
        'interests' => 'array',
        'is_active' => 'boolean'
    ];

    public function posts()
    {
        return $this->hasMany(Post::class);
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }
}
