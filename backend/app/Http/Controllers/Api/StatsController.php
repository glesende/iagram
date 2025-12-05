<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\IAnfluencer;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class StatsController extends Controller
{
    /**
     * Get platform activity statistics
     *
     * @return JsonResponse
     */
    public function activity(): JsonResponse
    {
        try {
            // Get total active IAnfluencers (those who have posted at least once)
            $totalIAnfluencers = IAnfluencer::whereHas('posts')->count();

            // Get posts created today
            $postsToday = Post::whereDate('published_at', Carbon::today())->count();

            // Get total posts
            $totalPosts = Post::count();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_ianfluencers' => $totalIAnfluencers,
                    'posts_today' => $postsToday,
                    'total_posts' => $totalPosts
                ],
                'message' => 'Estadísticas obtenidas exitosamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener las estadísticas',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
