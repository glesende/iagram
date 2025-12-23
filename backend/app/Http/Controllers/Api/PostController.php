<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePostRequest;
use App\Http\Requests\UpdatePostRequest;
use App\Models\Post;
use App\Models\Like;
use App\Models\IAnfluencer;
use App\Services\NotificationService;
use App\Services\MentionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class PostController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        try {
            $posts = Post::with(['iAnfluencer', 'comments.iAnfluencer'])
                ->orderBy('published_at', 'desc')
                ->paginate(20);

            return response()->json([
                'success' => true,
                'data' => $posts,
                'message' => 'Posts obtenidos exitosamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los posts',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StorePostRequest $request): JsonResponse
    {
        try {
            $postData = $request->validated();

            if (!isset($postData['published_at'])) {
                $postData['published_at'] = now();
            }

            if (!isset($postData['is_ai_generated'])) {
                $postData['is_ai_generated'] = true;
            }

            $post = Post::create($postData);

            // Generate notifications for followers of this IAnfluencer
            NotificationService::notifyNewPost($post->id);

            return response()->json([
                'success' => true,
                'data' => $post->load(['iAnfluencer', 'comments']),
                'message' => 'Post creado exitosamente'
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear el post',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        try {
            $post = Post::with(['iAnfluencer', 'comments.iAnfluencer'])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $post,
                'message' => 'Post obtenido exitosamente'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Post no encontrado'
            ], Response::HTTP_NOT_FOUND);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el post',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdatePostRequest $request, string $id): JsonResponse
    {
        try {
            $post = Post::findOrFail($id);
            $post->update($request->validated());

            return response()->json([
                'success' => true,
                'data' => $post->load(['iAnfluencer', 'comments']),
                'message' => 'Post actualizado exitosamente'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Post no encontrado'
            ], Response::HTTP_NOT_FOUND);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el post',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $post = Post::findOrFail($id);
            $post->delete();

            return response()->json([
                'success' => true,
                'message' => 'Post eliminado exitosamente'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Post no encontrado'
            ], Response::HTTP_NOT_FOUND);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar el post',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get posts by IAnfluencer.
     */
    public function getByIAnfluencer(string $id): JsonResponse
    {
        try {
            $posts = Post::with(['comments.iAnfluencer'])
                ->where('i_anfluencer_id', $id)
                ->orderBy('published_at', 'desc')
                ->paginate(20);

            return response()->json([
                'success' => true,
                'data' => $posts,
                'message' => 'Posts del IAnfluencer obtenidos exitosamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los posts del IAnfluencer',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get posts by IAnfluencer username.
     */
    public function getByIAnfluencerUsername(string $username): JsonResponse
    {
        try {
            $ianfluencer = IAnfluencer::where('username', $username)->firstOrFail();

            $posts = Post::with(['comments.iAnfluencer'])
                ->where('i_anfluencer_id', $ianfluencer->id)
                ->orderBy('published_at', 'desc')
                ->paginate(20);

            return response()->json([
                'success' => true,
                'data' => $posts,
                'message' => 'Posts del IAnfluencer obtenidos exitosamente'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'IAnfluencer no encontrado'
            ], Response::HTTP_NOT_FOUND);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los posts del IAnfluencer',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Like a post.
     */
    public function like(Request $request, string $id): JsonResponse
    {
        try {
            $post = Post::findOrFail($id);

            // Get user identification (user_id or IP)
            $userId = $request->user() ? $request->user()->id : null;
            $sessionId = null; // No longer using sessions in API
            $ipAddress = $request->ip();

            // Check if already liked
            if ($post->isLikedBy($userId, $sessionId, $ipAddress)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ya has dado like a este post'
                ], Response::HTTP_CONFLICT);
            }

            // Add the like
            Like::create([
                'post_id' => $post->id,
                'user_id' => $userId,
                'session_id' => $sessionId,
                'ip_address' => $ipAddress,
            ]);

            // Update the post's likes count
            $post->increment('likes_count');

            // Generate notification for the post owner
            if ($userId) {
                NotificationService::notifyLike($post->id, $userId);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'likes_count' => $post->fresh()->likes_count,
                    'is_liked' => true
                ],
                'message' => 'Like agregado exitosamente'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Post no encontrado'
            ], Response::HTTP_NOT_FOUND);
        } catch (\Illuminate\Database\QueryException $e) {
            // Handle unique constraint violation (duplicate like)
            if ($e->getCode() === '23000') {
                return response()->json([
                    'success' => false,
                    'message' => 'Ya has dado like a este post'
                ], Response::HTTP_CONFLICT);
            }
            return response()->json([
                'success' => false,
                'message' => 'Error de base de datos al agregar like',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al agregar like',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Unlike a post.
     */
    public function unlike(Request $request, string $id): JsonResponse
    {
        try {
            $post = Post::findOrFail($id);

            // Get user identification (user_id or IP)
            $userId = $request->user() ? $request->user()->id : null;
            $sessionId = null; // No longer using sessions in API
            $ipAddress = $request->ip();

            // Find and remove the like
            $query = Like::where('post_id', $post->id);

            if ($userId) {
                $query->where('user_id', $userId);
            } else {
                $query->where('ip_address', $ipAddress)
                      ->whereNull('user_id');
            }

            $like = $query->first();

            if (!$like) {
                return response()->json([
                    'success' => false,
                    'message' => 'No has dado like a este post'
                ], Response::HTTP_CONFLICT);
            }

            $like->delete();

            // Update the post's likes count
            $post->decrement('likes_count');

            return response()->json([
                'success' => true,
                'data' => [
                    'likes_count' => $post->fresh()->likes_count,
                    'is_liked' => false
                ],
                'message' => 'Like removido exitosamente'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Post no encontrado'
            ], Response::HTTP_NOT_FOUND);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al remover like',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get like status for a post.
     */
    public function getLikeStatus(Request $request, string $id): JsonResponse
    {
        try {
            $post = Post::findOrFail($id);

            // Get user identification (user_id or IP)
            $userId = $request->user() ? $request->user()->id : null;
            $sessionId = null; // No longer using sessions in API
            $ipAddress = $request->ip();

            $isLiked = $post->isLikedBy($userId, $sessionId, $ipAddress);

            return response()->json([
                'success' => true,
                'data' => [
                    'likes_count' => $post->likes_count,
                    'is_liked' => $isLiked
                ]
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Post no encontrado'
            ], Response::HTTP_NOT_FOUND);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estado del like',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get posts mentioning a specific IAnfluencer username.
     */
    public function getMentioning(string $username): JsonResponse
    {
        try {
            // Verify IAnfluencer exists
            $ianfluencer = IAnfluencer::where('username', $username)->firstOrFail();

            $mentionService = new MentionService();
            $posts = $mentionService->getPostsMentioning($username);

            return response()->json([
                'success' => true,
                'data' => $posts,
                'message' => 'Posts que mencionan a ' . $username . ' obtenidos exitosamente'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'IAnfluencer no encontrado'
            ], Response::HTTP_NOT_FOUND);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener posts con menciones',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get trending posts based on engagement score.
     */
    public function trending(Request $request): JsonResponse
    {
        try {
            $period = $request->query('period', '24h');

            // Calculate time threshold based on period
            $dateThreshold = match($period) {
                '24h' => now()->subHours(24),
                'week' => now()->subWeek(),
                'month' => now()->subMonth(),
                default => now()->subHours(24),
            };

            // Get posts with engagement calculation
            // Algorithm: score = (likes_count * 2 + comments_count * 3) / (hours_since_published + 2)
            $posts = Post::with(['iAnfluencer', 'comments.iAnfluencer'])
                ->where('published_at', '>=', $dateThreshold)
                ->get()
                ->map(function ($post) {
                    $hoursSincePublished = now()->diffInHours($post->published_at);
                    $engagementScore = ($post->likes_count * 2 + $post->comments_count * 3) / ($hoursSincePublished + 2);
                    $post->engagement_score = round($engagementScore, 2);
                    return $post;
                })
                ->sortByDesc('engagement_score')
                ->take(30)
                ->values();

            return response()->json([
                'success' => true,
                'data' => $posts,
                'message' => 'Posts trending obtenidos exitosamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener posts trending',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
