<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\IAnfluencerController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\AuthController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Authentication routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::middleware('auth:sanctum')->post('/logout', [AuthController::class, 'logout']);
Route::middleware('auth:sanctum')->get('/me', [AuthController::class, 'me']);

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::apiResource('ianfluencers', IAnfluencerController::class);
Route::apiResource('posts', PostController::class);
Route::apiResource('comments', CommentController::class);

Route::get('ianfluencers/username/{username}', [IAnfluencerController::class, 'showByUsername']);
Route::get('ianfluencers/{id}/posts', [PostController::class, 'getByIAnfluencer']);
Route::get('posts/influencer/{username}', [PostController::class, 'getByIAnfluencerUsername']);
Route::get('posts/{id}/comments', [CommentController::class, 'getByPost']);

// Likes functionality
Route::post('posts/{id}/like', [PostController::class, 'like']);
Route::delete('posts/{id}/unlike', [PostController::class, 'unlike']);
Route::get('posts/{id}/like-status', [PostController::class, 'getLikeStatus']);
