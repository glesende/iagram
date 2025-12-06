<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserContentPreference;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class UserContentPreferenceController extends Controller
{
    /**
     * Available niches
     */
    private const AVAILABLE_NICHES = [
        'lifestyle',
        'fashion',
        'fitness',
        'food',
        'travel',
        'technology'
    ];

    /**
     * Get content preferences for authenticated user
     */
    public function show(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated'
            ], 401);
        }

        $preference = UserContentPreference::where('user_id', $user->id)->first();

        if (!$preference) {
            return response()->json([
                'success' => true,
                'data' => [
                    'preferred_niches' => []
                ],
                'message' => 'No preferences set'
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'preferred_niches' => $preference->preferred_niches ?? []
            ],
            'message' => 'Preferences retrieved successfully'
        ]);
    }

    /**
     * Update or create content preferences for authenticated user
     */
    public function store(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated'
            ], 401);
        }

        $validator = Validator::make($request->all(), [
            'preferred_niches' => 'nullable|array',
            'preferred_niches.*' => 'string|in:' . implode(',', self::AVAILABLE_NICHES)
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $preferredNiches = $request->input('preferred_niches', []);

        // Update or create preference
        $preference = UserContentPreference::updateOrCreate(
            ['user_id' => $user->id],
            ['preferred_niches' => $preferredNiches]
        );

        return response()->json([
            'success' => true,
            'data' => [
                'preferred_niches' => $preference->preferred_niches ?? []
            ],
            'message' => 'Preferences updated successfully'
        ]);
    }
}
