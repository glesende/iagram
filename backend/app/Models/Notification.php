<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'user_id',
        'actor_id',
        'post_id',
        'comment_id',
        'i_anfluencer_id',
        'is_read'
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Get the user who will receive the notification
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the user who triggered the notification
     */
    public function actor()
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    /**
     * Get the related post
     */
    public function post()
    {
        return $this->belongsTo(Post::class);
    }

    /**
     * Get the related comment
     */
    public function comment()
    {
        return $this->belongsTo(Comment::class);
    }

    /**
     * Get the related IAnfluencer
     */
    public function iAnfluencer()
    {
        return $this->belongsTo(IAnfluencer::class, 'i_anfluencer_id');
    }

    /**
     * Scope to get unread notifications
     */
    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    /**
     * Scope to get notifications for a specific user
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Mark notification as read
     */
    public function markAsRead()
    {
        $this->update(['is_read' => true]);
    }

    /**
     * Get formatted notification data for API response
     */
    public function toArray()
    {
        $data = parent::toArray();

        // Include actor information
        if ($this->actor) {
            $data['actor'] = [
                'id' => $this->actor->id,
                'name' => $this->actor->name,
                'email' => $this->actor->email
            ];
        }

        // Include post information if applicable
        if ($this->post) {
            $data['post'] = [
                'id' => $this->post->id,
                'content' => $this->post->content,
                'image_url' => $this->post->image_url
            ];
        }

        // Include comment information if applicable
        if ($this->comment) {
            $data['comment'] = [
                'id' => $this->comment->id,
                'content' => $this->comment->content
            ];
        }

        // Include IAnfluencer information if applicable
        if ($this->iAnfluencer) {
            $data['i_anfluencer'] = [
                'id' => $this->iAnfluencer->id,
                'name' => $this->iAnfluencer->name,
                'username' => $this->iAnfluencer->username,
                'avatar_url' => $this->iAnfluencer->avatar_url
            ];
        }

        return $data;
    }
}
