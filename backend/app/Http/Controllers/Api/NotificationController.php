<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\NotificationService;
use App\Models\NotificationSettings;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Get notifications for authenticated user
     */
    public function index(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated'
            ], 401);
        }

        $limit = $request->input('limit', 50);
        $offset = $request->input('offset', 0);

        $notifications = NotificationService::getNotificationsForUser(
            $user->id,
            $limit,
            $offset
        );

        return response()->json([
            'success' => true,
            'data' => $notifications,
            'count' => $notifications->count()
        ]);
    }

    /**
     * Get unread notifications count
     */
    public function unreadCount(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated'
            ], 401);
        }

        $count = NotificationService::getUnreadCount($user->id);

        return response()->json([
            'success' => true,
            'unread_count' => $count
        ]);
    }

    /**
     * Mark a notification as read
     */
    public function markAsRead(Request $request, $id)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated'
            ], 401);
        }

        $success = NotificationService::markAsRead($id, $user->id);

        if ($success) {
            return response()->json([
                'success' => true,
                'message' => 'Notification marked as read'
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Notification not found'
        ], 404);
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated'
            ], 401);
        }

        NotificationService::markAllAsRead($user->id);

        return response()->json([
            'success' => true,
            'message' => 'All notifications marked as read'
        ]);
    }

    /**
     * Get notification settings for authenticated user
     */
    public function getSettings(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated'
            ], 401);
        }

        $settings = NotificationSettings::getOrCreateForUser($user->id);

        return response()->json([
            'success' => true,
            'data' => $settings
        ]);
    }

    /**
     * Update notification settings for authenticated user
     */
    public function updateSettings(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated'
            ], 401);
        }

        $request->validate([
            'likes_enabled' => 'sometimes|boolean',
            'comments_enabled' => 'sometimes|boolean',
            'follows_enabled' => 'sometimes|boolean',
            'mentions_enabled' => 'sometimes|boolean',
            'new_posts_enabled' => 'sometimes|boolean'
        ]);

        $settings = NotificationSettings::getOrCreateForUser($user->id);
        $settings->update($request->only([
            'likes_enabled',
            'comments_enabled',
            'follows_enabled',
            'mentions_enabled',
            'new_posts_enabled'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Notification settings updated',
            'data' => $settings
        ]);
    }
}
