<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreIAnfluencerRequest;
use App\Http\Requests\UpdateIAnfluencerRequest;
use App\Models\IAnfluencer;
use App\Models\Follow;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class IAnfluencerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        try {
            $ianfluencers = IAnfluencer::with(['posts' => function($query) {
                $query->latest()->take(3);
            }])->orderBy('created_at', 'desc')->paginate(15);

            return response()->json([
                'success' => true,
                'data' => $ianfluencers,
                'message' => 'IAnfluencers obtenidos exitosamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los IAnfluencers',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get all IAnfluencers for explore page with filters and sorting
     */
    public function explore(Request $request): JsonResponse
    {
        try {
            $query = IAnfluencer::query();

            // Get posts count for each IAnfluencer
            $query->withCount('posts');

            // Filter by niches if provided
            if ($request->has('niche') && !empty($request->niche)) {
                $niches = is_array($request->niche) ? $request->niche : explode(',', $request->niche);
                $query->whereIn('niche', $niches);
            }

            // Filter by verified status if provided
            if ($request->has('verified') && $request->verified !== null) {
                $verified = filter_var($request->verified, FILTER_VALIDATE_BOOLEAN);
                // Assuming there's an 'is_verified' field - adjust if needed
                // If there's no verified field, remove this filter
                if (DB::getSchemaBuilder()->hasColumn('i_anfluencers', 'is_verified')) {
                    $query->where('is_verified', $verified);
                }
            }

            // Search by username or display_name if provided
            if ($request->has('search') && !empty($request->search)) {
                $searchTerm = $request->search;
                $query->where(function($q) use ($searchTerm) {
                    $q->where('username', 'like', "%{$searchTerm}%")
                      ->orWhere('display_name', 'like', "%{$searchTerm}%");
                });
            }

            // Sorting
            $sortBy = $request->get('sort_by', 'followers_desc');

            switch ($sortBy) {
                case 'followers_desc':
                    $query->orderBy('followers_count', 'desc');
                    break;
                case 'followers_asc':
                    $query->orderBy('followers_count', 'asc');
                    break;
                case 'posts_desc':
                    $query->orderBy('posts_count', 'desc');
                    break;
                case 'posts_asc':
                    $query->orderBy('posts_count', 'asc');
                    break;
                case 'alphabetical_asc':
                    $query->orderBy('username', 'asc');
                    break;
                case 'alphabetical_desc':
                    $query->orderBy('username', 'desc');
                    break;
                case 'random':
                    $query->inRandomOrder();
                    break;
                case 'recent':
                    $query->orderBy('created_at', 'desc');
                    break;
                default:
                    $query->orderBy('followers_count', 'desc');
            }

            // Paginate results
            $perPage = $request->get('per_page', 50);
            $ianfluencers = $query->paginate($perPage);

            // Add follow status for authenticated user
            if ($user = $request->user()) {
                $followedIds = Follow::where('user_id', $user->id)
                    ->pluck('i_anfluencer_id')
                    ->toArray();

                $ianfluencers->getCollection()->transform(function ($ianfluencer) use ($followedIds) {
                    $ianfluencer->is_following = in_array($ianfluencer->id, $followedIds);
                    return $ianfluencer;
                });
            } else {
                $ianfluencers->getCollection()->transform(function ($ianfluencer) {
                    $ianfluencer->is_following = false;
                    return $ianfluencer;
                });
            }

            return response()->json([
                'success' => true,
                'data' => $ianfluencers,
                'message' => 'IAnfluencers para explorar obtenidos exitosamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener IAnfluencers para explorar',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreIAnfluencerRequest $request): JsonResponse
    {
        try {
            $ianfluencer = IAnfluencer::create($request->validated());

            return response()->json([
                'success' => true,
                'data' => $ianfluencer->load('posts'),
                'message' => 'IAnfluencer creado exitosamente'
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear el IAnfluencer',
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
            $ianfluencer = IAnfluencer::with(['posts.comments', 'comments'])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $ianfluencer,
                'message' => 'IAnfluencer obtenido exitosamente'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'IAnfluencer no encontrado'
            ], Response::HTTP_NOT_FOUND);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el IAnfluencer',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get IAnfluencer by username with posts count.
     */
    public function showByUsername(string $username): JsonResponse
    {
        try {
            $ianfluencer = IAnfluencer::where('username', $username)
                ->firstOrFail();

            // Get posts count
            $postsCount = $ianfluencer->posts()->count();

            // Format response
            $data = [
                'id' => $ianfluencer->id,
                'username' => $ianfluencer->username,
                'display_name' => $ianfluencer->display_name,
                'bio' => $ianfluencer->bio,
                'avatar_url' => $ianfluencer->avatar_url,
                'personality_traits' => $ianfluencer->personality_traits,
                'interests' => $ianfluencer->interests,
                'niche' => $ianfluencer->niche,
                'followers_count' => $ianfluencer->followers_count,
                'following_count' => $ianfluencer->following_count,
                'posts_count' => $postsCount,
                'is_active' => $ianfluencer->is_active,
            ];

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'IAnfluencer obtenido exitosamente'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'IAnfluencer no encontrado'
            ], Response::HTTP_NOT_FOUND);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el IAnfluencer',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateIAnfluencerRequest $request, string $id): JsonResponse
    {
        try {
            $ianfluencer = IAnfluencer::findOrFail($id);
            $ianfluencer->update($request->validated());

            return response()->json([
                'success' => true,
                'data' => $ianfluencer->load('posts'),
                'message' => 'IAnfluencer actualizado exitosamente'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'IAnfluencer no encontrado'
            ], Response::HTTP_NOT_FOUND);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el IAnfluencer',
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
            $ianfluencer = IAnfluencer::findOrFail($id);
            $ianfluencer->delete();

            return response()->json([
                'success' => true,
                'message' => 'IAnfluencer eliminado exitosamente'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'IAnfluencer no encontrado'
            ], Response::HTTP_NOT_FOUND);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar el IAnfluencer',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Follow an IAnfluencer
     */
    public function follow(Request $request, string $id): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no autenticado'
                ], Response::HTTP_UNAUTHORIZED);
            }

            $iAnfluencer = IAnfluencer::findOrFail($id);

            // Check if already following
            $existingFollow = Follow::where('user_id', $user->id)
                ->where('i_anfluencer_id', $iAnfluencer->id)
                ->first();

            if ($existingFollow) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ya sigues a este IAnfluencer',
                    'followers_count' => $iAnfluencer->followers_count
                ], Response::HTTP_CONFLICT);
            }

            // Create follow relationship
            Follow::create([
                'user_id' => $user->id,
                'i_anfluencer_id' => $iAnfluencer->id
            ]);

            // Increment followers count
            $iAnfluencer->increment('followers_count');
            $iAnfluencer->refresh();

            // Generate notification for the IAnfluencer owner
            NotificationService::notifyFollow($iAnfluencer->id, $user->id);

            return response()->json([
                'success' => true,
                'message' => 'Ahora sigues a este IAnfluencer',
                'followers_count' => $iAnfluencer->followers_count
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'IAnfluencer no encontrado'
            ], Response::HTTP_NOT_FOUND);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al seguir al IAnfluencer',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Unfollow an IAnfluencer
     */
    public function unfollow(Request $request, string $id): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no autenticado'
                ], Response::HTTP_UNAUTHORIZED);
            }

            $iAnfluencer = IAnfluencer::findOrFail($id);

            // Find and delete the follow relationship
            $deleted = Follow::where('user_id', $user->id)
                ->where('i_anfluencer_id', $iAnfluencer->id)
                ->delete();

            if (!$deleted) {
                return response()->json([
                    'success' => false,
                    'message' => 'No sigues a este IAnfluencer',
                    'followers_count' => $iAnfluencer->followers_count
                ], Response::HTTP_NOT_FOUND);
            }

            // Decrement followers count
            $iAnfluencer->decrement('followers_count');
            $iAnfluencer->refresh();

            return response()->json([
                'success' => true,
                'message' => 'Has dejado de seguir a este IAnfluencer',
                'followers_count' => $iAnfluencer->followers_count
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'IAnfluencer no encontrado'
            ], Response::HTTP_NOT_FOUND);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al dejar de seguir al IAnfluencer',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get follow status for an IAnfluencer
     */
    public function getFollowStatus(Request $request, string $id): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => true,
                    'is_following' => false
                ]);
            }

            $isFollowing = Follow::isFollowing($user->id, $id);

            return response()->json([
                'success' => true,
                'is_following' => $isFollowing
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el estado de seguimiento',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get list of IAnfluencers that the authenticated user follows
     */
    public function getFollowing(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no autenticado'
                ], Response::HTTP_UNAUTHORIZED);
            }

            $following = IAnfluencer::join('follows', 'i_anfluencers.id', '=', 'follows.i_anfluencer_id')
                ->where('follows.user_id', $user->id)
                ->select('i_anfluencers.*', 'follows.created_at as followed_at')
                ->orderBy('follows.created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $following,
                'message' => 'Lista de IAnfluencers seguidos obtenida exitosamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener la lista de seguidos',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
