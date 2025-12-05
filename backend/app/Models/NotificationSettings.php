<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NotificationSettings extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'likes_enabled',
        'comments_enabled',
        'follows_enabled',
        'mentions_enabled',
        'new_posts_enabled'
    ];

    protected $casts = [
        'likes_enabled' => 'boolean',
        'comments_enabled' => 'boolean',
        'follows_enabled' => 'boolean',
        'mentions_enabled' => 'boolean',
        'new_posts_enabled' => 'boolean'
    ];

    /**
     * Get the user that owns the settings
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get or create notification settings for a user
     */
    public static function getOrCreateForUser($userId)
    {
        return static::firstOrCreate(
            ['user_id' => $userId],
            [
                'likes_enabled' => true,
                'comments_enabled' => true,
                'follows_enabled' => true,
                'mentions_enabled' => true,
                'new_posts_enabled' => true
            ]
        );
    }

    /**
     * Check if a specific notification type is enabled
     */
    public function isEnabled($type)
    {
        $field = $type . '_enabled';
        return $this->$field ?? true;
    }
}
