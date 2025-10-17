<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Comment extends Model
{
    use HasFactory;

    protected $fillable = [
        'post_id',
        'i_anfluencer_id',
        'content',
        'is_ai_generated',
        'ai_generation_params',
        'likes_count'
    ];

    protected $casts = [
        'is_ai_generated' => 'boolean',
        'ai_generation_params' => 'array'
    ];

    public function post()
    {
        return $this->belongsTo(Post::class);
    }

    public function iAnfluencer()
    {
        return $this->belongsTo(IAnfluencer::class);
    }
}
