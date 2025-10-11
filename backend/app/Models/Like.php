<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Like extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'post_id',
        'session_id',
        'ip_address'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function post()
    {
        return $this->belongsTo(Post::class);
    }

    /**
     * Check if a like exists for a given post and identifier (user or IP)
     */
    public static function existsFor($postId, $userId = null, $sessionId = null, $ipAddress = null)
    {
        $query = static::where('post_id', $postId);

        if ($userId) {
            $query->where('user_id', $userId);
        } elseif ($ipAddress) {
            // When no user is authenticated, check by IP and ensure user_id is null
            $query->where('ip_address', $ipAddress)
                  ->whereNull('user_id');
        }

        return $query->exists();
    }

    /**
     * Create or delete a like for a given post and identifier
     */
    public static function toggle($postId, $userId = null, $sessionId = null, $ipAddress = null)
    {
        $query = static::where('post_id', $postId);

        if ($userId) {
            $query->where('user_id', $userId);
        } elseif ($sessionId) {
            $query->where('session_id', $sessionId);
        } elseif ($ipAddress) {
            $query->where('ip_address', $ipAddress);
        }

        $existingLike = $query->first();

        if ($existingLike) {
            $existingLike->delete();
            return false; // Like removed
        } else {
            static::create([
                'post_id' => $postId,
                'user_id' => $userId,
                'session_id' => $sessionId,
                'ip_address' => $ipAddress,
            ]);
            return true; // Like added
        }
    }
}