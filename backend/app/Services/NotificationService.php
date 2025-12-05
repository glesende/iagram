<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\NotificationSettings;
use App\Models\Post;
use App\Models\Comment;
use App\Models\User;
use App\Models\IAnfluencer;
use Illuminate\Support\Facades\DB;

class NotificationService
{
    /**
     * Create a notification for a like on a post
     */
    public static function notifyLike($postId, $actorId)
    {
        $post = Post::find($postId);
        if (!$post || !$post->iAnfluencer) {
            return;
        }

        // Don't notify if actor is the post owner (can't happen with current logic but safety check)
        if ($actorId && $post->iAnfluencer->user_id == $actorId) {
            return;
        }

        // Get the post owner (IAnfluencer creator)
        $postOwnerId = $post->iAnfluencer->user_id;
        if (!$postOwnerId) {
            return;
        }

        // Check notification settings
        $settings = NotificationSettings::getOrCreateForUser($postOwnerId);
        if (!$settings->isEnabled('likes')) {
            return;
        }

        // Check for recent duplicate notification (within last 5 minutes)
        $recentNotification = Notification::where('type', 'like')
            ->where('user_id', $postOwnerId)
            ->where('actor_id', $actorId)
            ->where('post_id', $postId)
            ->where('created_at', '>', now()->subMinutes(5))
            ->first();

        if ($recentNotification) {
            return; // Don't create duplicate
        }

        // Create notification
        Notification::create([
            'type' => 'like',
            'user_id' => $postOwnerId,
            'actor_id' => $actorId,
            'post_id' => $postId,
            'is_read' => false
        ]);
    }

    /**
     * Create a notification for a comment on a post
     */
    public static function notifyComment($postId, $commentId, $actorId)
    {
        $post = Post::find($postId);
        if (!$post || !$post->iAnfluencer) {
            return;
        }

        // Don't notify if actor is the post owner
        if ($actorId && $post->iAnfluencer->user_id == $actorId) {
            return;
        }

        // Get the post owner
        $postOwnerId = $post->iAnfluencer->user_id;
        if (!$postOwnerId) {
            return;
        }

        // Check notification settings
        $settings = NotificationSettings::getOrCreateForUser($postOwnerId);
        if (!$settings->isEnabled('comments')) {
            return;
        }

        // Create notification
        Notification::create([
            'type' => 'comment',
            'user_id' => $postOwnerId,
            'actor_id' => $actorId,
            'post_id' => $postId,
            'comment_id' => $commentId,
            'is_read' => false
        ]);
    }

    /**
     * Create a notification for a new follower
     */
    public static function notifyFollow($iAnfluencerId, $actorId)
    {
        $iAnfluencer = IAnfluencer::find($iAnfluencerId);
        if (!$iAnfluencer || !$iAnfluencer->user_id) {
            return;
        }

        // Check notification settings
        $settings = NotificationSettings::getOrCreateForUser($iAnfluencer->user_id);
        if (!$settings->isEnabled('follows')) {
            return;
        }

        // Check for duplicate
        $existing = Notification::where('type', 'follow')
            ->where('user_id', $iAnfluencer->user_id)
            ->where('actor_id', $actorId)
            ->where('i_anfluencer_id', $iAnfluencerId)
            ->where('created_at', '>', now()->subHours(24))
            ->first();

        if ($existing) {
            return;
        }

        // Create notification
        Notification::create([
            'type' => 'follow',
            'user_id' => $iAnfluencer->user_id,
            'actor_id' => $actorId,
            'i_anfluencer_id' => $iAnfluencerId,
            'is_read' => false
        ]);
    }

    /**
     * Create notifications for new post from followed IAnfluencer
     */
    public static function notifyNewPost($postId)
    {
        $post = Post::with('iAnfluencer.followers')->find($postId);
        if (!$post || !$post->iAnfluencer) {
            return;
        }

        // Get all followers of this IAnfluencer
        $followers = $post->iAnfluencer->followers;

        foreach ($followers as $follow) {
            // Check notification settings
            $settings = NotificationSettings::getOrCreateForUser($follow->user_id);
            if (!$settings->isEnabled('new_posts')) {
                continue;
            }

            // Create notification for each follower
            Notification::create([
                'type' => 'new_post',
                'user_id' => $follow->user_id,
                'actor_id' => null, // No specific actor, it's the IAnfluencer
                'post_id' => $postId,
                'i_anfluencer_id' => $post->i_anfluencer_id,
                'is_read' => false
            ]);
        }
    }

    /**
     * Create notification for mention in comment
     * Note: This requires username detection logic in comments
     */
    public static function notifyMention($commentId, $mentionedUserId, $actorId)
    {
        // Don't notify self-mentions
        if ($mentionedUserId == $actorId) {
            return;
        }

        // Check notification settings
        $settings = NotificationSettings::getOrCreateForUser($mentionedUserId);
        if (!$settings->isEnabled('mentions')) {
            return;
        }

        $comment = Comment::find($commentId);
        if (!$comment) {
            return;
        }

        // Create notification
        Notification::create([
            'type' => 'mention',
            'user_id' => $mentionedUserId,
            'actor_id' => $actorId,
            'post_id' => $comment->post_id,
            'comment_id' => $commentId,
            'is_read' => false
        ]);
    }

    /**
     * Get notifications for a user with pagination
     */
    public static function getNotificationsForUser($userId, $limit = 50, $offset = 0)
    {
        return Notification::with(['actor', 'post.iAnfluencer', 'comment', 'iAnfluencer'])
            ->forUser($userId)
            ->orderBy('created_at', 'desc')
            ->skip($offset)
            ->take($limit)
            ->get();
    }

    /**
     * Get unread count for a user
     */
    public static function getUnreadCount($userId)
    {
        return Notification::forUser($userId)
            ->unread()
            ->count();
    }

    /**
     * Mark notification as read
     */
    public static function markAsRead($notificationId, $userId)
    {
        $notification = Notification::where('id', $notificationId)
            ->where('user_id', $userId)
            ->first();

        if ($notification) {
            $notification->markAsRead();
            return true;
        }

        return false;
    }

    /**
     * Mark all notifications as read for a user
     */
    public static function markAllAsRead($userId)
    {
        Notification::forUser($userId)
            ->unread()
            ->update(['is_read' => true]);

        return true;
    }
}
