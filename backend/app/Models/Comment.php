<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Comment extends Model
{
    use HasFactory;

    protected $fillable = [
        'post_id',
        'user_id',
        'i_anfluencer_id',
        'session_id',
        'author_name',
        'content',
        'mentions',
        'is_ai_generated',
        'ai_generation_params',
        'likes_count'
    ];

    protected $casts = [
        'is_ai_generated' => 'boolean',
        'ai_generation_params' => 'array',
        'mentions' => 'array'
    ];

    public function post()
    {
        return $this->belongsTo(Post::class);
    }

    public function iAnfluencer()
    {
        return $this->belongsTo(IAnfluencer::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
