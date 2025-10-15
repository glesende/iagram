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

// Authentication routes (public)
Route::post('register', [AuthController::class, 'register']);
Route::post('login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('user', [AuthController::class, 'user']);
});

Route::apiResource('ianfluencers', IAnfluencerController::class);
Route::apiResource('posts', PostController::class);
Route::apiResource('comments', CommentController::class);

Route::get('ianfluencers/{id}/posts', [PostController::class, 'getByIAnfluencer']);
Route::get('posts/{id}/comments', [CommentController::class, 'getByPost']);

// Likes functionality
Route::post('posts/{id}/like', [PostController::class, 'like']);
Route::delete('posts/{id}/unlike', [PostController::class, 'unlike']);
Route::get('posts/{id}/like-status', [PostController::class, 'getLikeStatus']);
