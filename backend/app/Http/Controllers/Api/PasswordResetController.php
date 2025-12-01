<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Carbon\Carbon;

class PasswordResetController extends Controller
{
    /**
     * Send password reset link to user's email
     */
    public function sendResetLink(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check if user exists
        $user = User::where('email', $request->email)->first();

        // For security reasons, always return success even if user doesn't exist
        // This prevents email enumeration attacks
        if (!$user) {
            return response()->json([
                'success' => true,
                'message' => 'Si el email existe en nuestro sistema, recibirás un enlace de recuperación.'
            ], 200);
        }

        // Generate a unique token
        $token = Str::random(64);

        // Delete any existing tokens for this email
        DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->delete();

        // Create new password reset token
        DB::table('password_reset_tokens')->insert([
            'email' => $request->email,
            'token' => Hash::make($token),
            'created_at' => Carbon::now()
        ]);

        // Send email with reset link
        $resetUrl = env('FRONTEND_URL', 'http://localhost:3000') . '/reset-password?token=' . $token . '&email=' . urlencode($request->email);

        try {
            Mail::send('emails.password-reset', [
                'resetUrl' => $resetUrl,
                'userName' => $user->name
            ], function ($message) use ($user) {
                $message->to($user->email)
                    ->subject('Recuperación de contraseña - IAgram');
            });
        } catch (\Exception $e) {
            // Log error but don't reveal it to user
            \Log::error('Failed to send password reset email: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al enviar el email. Por favor, intenta de nuevo.'
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'Si el email existe en nuestro sistema, recibirás un enlace de recuperación.'
        ], 200);
    }

    /**
     * Reset password with token
     */
    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        // Get the reset token record
        $resetRecord = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        // Check if token exists
        if (!$resetRecord) {
            return response()->json([
                'success' => false,
                'message' => 'Token inválido o expirado.'
            ], 400);
        }

        // Check if token matches
        if (!Hash::check($request->token, $resetRecord->token)) {
            return response()->json([
                'success' => false,
                'message' => 'Token inválido o expirado.'
            ], 400);
        }

        // Check if token is expired (1 hour)
        $tokenCreatedAt = Carbon::parse($resetRecord->created_at);
        if (Carbon::now()->diffInMinutes($tokenCreatedAt) > 60) {
            // Delete expired token
            DB::table('password_reset_tokens')
                ->where('email', $request->email)
                ->delete();

            return response()->json([
                'success' => false,
                'message' => 'El token ha expirado. Por favor, solicita un nuevo enlace de recuperación.'
            ], 400);
        }

        // Get user
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado.'
            ], 404);
        }

        // Update password
        $user->password = Hash::make($request->password);
        $user->save();

        // Delete the token after successful reset
        DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->delete();

        // Revoke all existing tokens for this user (logout from all devices)
        $user->tokens()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Contraseña restablecida exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.'
        ], 200);
    }

    /**
     * Verify if a reset token is valid (optional endpoint for frontend validation)
     */
    public function verifyToken(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required',
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        // Get the reset token record
        $resetRecord = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        // Check if token exists
        if (!$resetRecord) {
            return response()->json([
                'success' => false,
                'message' => 'Token inválido o expirado.'
            ], 400);
        }

        // Check if token matches
        if (!Hash::check($request->token, $resetRecord->token)) {
            return response()->json([
                'success' => false,
                'message' => 'Token inválido o expirado.'
            ], 400);
        }

        // Check if token is expired (1 hour)
        $tokenCreatedAt = Carbon::parse($resetRecord->created_at);
        if (Carbon::now()->diffInMinutes($tokenCreatedAt) > 60) {
            return response()->json([
                'success' => false,
                'message' => 'El token ha expirado.'
            ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => 'Token válido.'
        ], 200);
    }
}
