<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\IAnfluencerController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PasswordResetController;

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

// Email verification routes
Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])->name('verification.verify');
Route::middleware('auth:sanctum')->post('/email/resend', [AuthController::class, 'resendVerificationEmail'])->name('verification.resend');
Route::middleware('auth:sanctum')->get('/email/verification-status', [AuthController::class, 'checkVerificationStatus']);

// Password reset routes
Route::post('/password/forgot', [PasswordResetController::class, 'sendResetLink']);
Route::post('/password/reset', [PasswordResetController::class, 'resetPassword']);
Route::post('/password/verify-token', [PasswordResetController::class, 'verifyToken']);

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
Route::get('posts/mentioning/{username}', [PostController::class, 'getMentioning']);
Route::get('comments/mentioning/{username}', [CommentController::class, 'getMentioning']);

// Likes functionality - require authentication and email verification
Route::middleware(['auth:sanctum', 'verified'])->group(function () {
    Route::post('posts/{id}/like', [PostController::class, 'like']);
    Route::delete('posts/{id}/unlike', [PostController::class, 'unlike']);
});

// Like status - require authentication only (no verification needed for viewing)
Route::middleware('auth:sanctum')->get('posts/{id}/like-status', [PostController::class, 'getLikeStatus']);

// Follow functionality - require authentication and email verification
Route::middleware(['auth:sanctum', 'verified'])->group(function () {
    Route::post('ianfluencers/{id}/follow', [IAnfluencerController::class, 'follow']);
    Route::delete('ianfluencers/{id}/unfollow', [IAnfluencerController::class, 'unfollow']);
});

// Follow status - require authentication only (no verification needed for viewing)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('ianfluencers/{id}/follow-status', [IAnfluencerController::class, 'getFollowStatus']);
    Route::get('me/following', [IAnfluencerController::class, 'getFollowing']);
});
