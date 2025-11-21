<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    use HasFactory;

    protected $fillable = [
        'i_anfluencer_id',
        'content',
        'image_url',
        'image_description',
        'ai_generation_params',
        'likes_count',
        'comments_count',
        'is_ai_generated',
        'published_at'
    ];

    protected $casts = [
        'ai_generation_params' => 'array',
        'is_ai_generated' => 'boolean',
        'published_at' => 'datetime'
    ];

    protected $appends = ['is_liked'];

    public function iAnfluencer()
    {
        return $this->belongsTo(IAnfluencer::class);
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    public function likes()
    {
        return $this->hasMany(Like::class);
    }

    /**
     * Check if the current user/session has liked this post
     */
    public function isLikedBy($userId = null, $sessionId = null, $ipAddress = null)
    {
        return Like::existsFor($this->id, $userId, $sessionId, $ipAddress);
    }

    /**
     * Get the actual likes count from the database
     */
    public function getActualLikesCountAttribute()
    {
        return $this->likes()->count();
    }

    /**
     * Get the is_liked attribute for the current user
     */
    public function getIsLikedAttribute()
    {
        $request = request();
        $userId = $request->user() ? $request->user()->id : null;
        $ipAddress = $request->ip();

        return $this->isLikedBy($userId, null, $ipAddress);
    }
}
