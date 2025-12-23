<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\Comment;
use App\Models\Like;
use App\Models\Follow;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    /**
     * Get authenticated user's liked posts
     */
    public function getLikedPosts(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        // Get posts that the user has liked
        $likedPosts = Post::whereHas('likes', function($query) use ($user) {
            $query->where('user_id', $user->id);
        })
        ->with(['iAnfluencer', 'comments.iAnfluencer'])
        ->orderBy('created_at', 'desc')
        ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $likedPosts,
            'message' => 'Liked posts retrieved successfully'
        ]);
    }

    /**
     * Get authenticated user's comments
     */
    public function getComments(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        // Get user's comments (human-generated only, not AI comments)
        $comments = Comment::where('user_id', $user->id)
            ->where('is_ai_generated', false)
            ->with(['post.iAnfluencer', 'iAnfluencer'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $comments,
            'message' => 'User comments retrieved successfully'
        ]);
    }

    /**
     * Get authenticated user's engagement statistics
     */
    public function getStats(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        // Get statistics
        $stats = [
            'liked_posts_count' => Like::where('user_id', $user->id)
                ->where('likeable_type', 'App\Models\Post')
                ->count(),
            'comments_count' => Comment::where('user_id', $user->id)
                ->where('is_ai_generated', false)
                ->count(),
            'following_count' => Follow::where('user_id', $user->id)->count(),
            'member_since' => $user->created_at->format('Y-m-d'),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
            'message' => 'User stats retrieved successfully'
        ]);
    }

    /**
     * Update authenticated user's profile
     */
    public function updateProfile(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        $validatedData = $request->validate([
            'name' => 'sometimes|required|string|max:255',
        ]);

        if (isset($validatedData['name'])) {
            $user->name = $validatedData['name'];
            $user->save();
        }

        return response()->json([
            'success' => true,
            'data' => $user,
            'message' => 'Profile updated successfully'
        ]);
    }

    /**
     * Get authenticated user's following IAnfluencers
     */
    public function getFollowing(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        // Get followed IAnfluencers
        $followedIAnfluencers = DB::table('follows')
            ->join('i_anfluencers', 'follows.i_anfluencer_id', '=', 'i_anfluencers.id')
            ->where('follows.user_id', $user->id)
            ->select('i_anfluencers.*')
            ->orderBy('follows.created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $followedIAnfluencers,
            'message' => 'Following IAnfluencers retrieved successfully'
        ]);
    }
}
