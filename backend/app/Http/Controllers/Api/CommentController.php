<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCommentRequest;
use App\Http\Requests\UpdateCommentRequest;
use App\Models\Comment;
use App\Services\NotificationService;
use App\Models\IAnfluencer;
use App\Services\MentionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class CommentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        try {
            $comments = Comment::with(['post', 'iAnfluencer'])
                ->orderBy('created_at', 'desc')
                ->paginate(50);

            return response()->json([
                'success' => true,
                'data' => $comments,
                'message' => 'Comentarios obtenidos exitosamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los comentarios',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreCommentRequest $request): JsonResponse
    {
        try {
            $commentData = $request->validated();

            // Set is_ai_generated to false by default for human comments
            if (!isset($commentData['is_ai_generated'])) {
                $commentData['is_ai_generated'] = isset($commentData['i_anfluencer_id']);
            }

            // If no i_anfluencer_id provided, this is a human comment
            if (!isset($commentData['i_anfluencer_id'])) {
                // Get authenticated user if available
                $user = $request->user();
                $userId = $user ? $user->id : null;

                // Set user_id if authenticated
                if ($userId) {
                    $commentData['user_id'] = $userId;
                    $commentData['author_name'] = $user->name;
                } else {
                    // Generate or get session ID for anonymous users
                    if (!isset($commentData['session_id'])) {
                        $commentData['session_id'] = $request->session()->getId();
                    }

                    // Default author name for anonymous users
                    if (!isset($commentData['author_name'])) {
                        $commentData['author_name'] = 'Usuario Anónimo';
                    }
                }
            }

            // Process mentions in content
            if (isset($commentData['content'])) {
                $mentionService = new MentionService();
                $commentData['mentions'] = $mentionService->processMentions($commentData['content']);
            }

            $comment = Comment::create($commentData);

            // Generate notification for post owner if this is from an authenticated user
            if (isset($commentData['user_id']) && isset($commentData['post_id'])) {
                NotificationService::notifyComment(
                    $commentData['post_id'],
                    $comment->id,
                    $commentData['user_id']
                );
            }

            return response()->json([
                'success' => true,
                'data' => $comment->load(['post', 'iAnfluencer', 'user']),
                'message' => 'Comentario creado exitosamente'
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear el comentario',
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
            $comment = Comment::with(['post', 'iAnfluencer'])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $comment,
                'message' => 'Comentario obtenido exitosamente'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Comentario no encontrado'
            ], Response::HTTP_NOT_FOUND);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el comentario',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateCommentRequest $request, string $id): JsonResponse
    {
        try {
            $comment = Comment::findOrFail($id);
            $comment->update($request->validated());

            return response()->json([
                'success' => true,
                'data' => $comment->load(['post', 'iAnfluencer']),
                'message' => 'Comentario actualizado exitosamente'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Comentario no encontrado'
            ], Response::HTTP_NOT_FOUND);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el comentario',
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
            $comment = Comment::findOrFail($id);
            $comment->delete();

            return response()->json([
                'success' => true,
                'message' => 'Comentario eliminado exitosamente'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Comentario no encontrado'
            ], Response::HTTP_NOT_FOUND);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar el comentario',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get comments by Post.
     */
    public function getByPost(string $id): JsonResponse
    {
        try {
            $comments = Comment::with(['iAnfluencer'])
                ->where('post_id', $id)
                ->orderBy('created_at', 'asc')
                ->paginate(50);

            return response()->json([
                'success' => true,
                'data' => $comments,
                'message' => 'Comentarios del post obtenidos exitosamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los comentarios del post',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get comments mentioning a specific IAnfluencer username.
     */
    public function getMentioning(string $username): JsonResponse
    {
        try {
            // Verify IAnfluencer exists
            $ianfluencer = IAnfluencer::where('username', $username)->firstOrFail();

            $mentionService = new MentionService();
            $comments = $mentionService->getCommentsMentioning($username);

            return response()->json([
                'success' => true,
                'data' => $comments,
                'message' => 'Comentarios que mencionan a ' . $username . ' obtenidos exitosamente'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'IAnfluencer no encontrado'
            ], Response::HTTP_NOT_FOUND);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener comentarios con menciones',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
