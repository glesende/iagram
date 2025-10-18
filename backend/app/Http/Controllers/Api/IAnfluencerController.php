<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreIAnfluencerRequest;
use App\Http\Requests\UpdateIAnfluencerRequest;
use App\Models\IAnfluencer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

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
}
