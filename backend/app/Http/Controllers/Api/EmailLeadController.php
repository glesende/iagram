<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmailLead;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class EmailLeadController extends Controller
{
    /**
     * Store a new email lead from landing page
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|max:255',
            'utm_source' => 'nullable|string|max:100',
            'utm_medium' => 'nullable|string|max:100',
            'utm_campaign' => 'nullable|string|max:100',
            'utm_content' => 'nullable|string|max:100',
            'utm_term' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check if email already exists
        if (EmailLead::emailExists($request->email)) {
            return response()->json([
                'success' => false,
                'message' => 'Este email ya está registrado'
            ], 409);
        }

        try {
            $emailLead = EmailLead::create([
                'email' => $request->email,
                'source' => 'landing_page',
                'utm_source' => $request->utm_source,
                'utm_medium' => $request->utm_medium,
                'utm_campaign' => $request->utm_campaign,
                'utm_content' => $request->utm_content,
                'utm_term' => $request->utm_term,
            ]);

            return response()->json([
                'success' => true,
                'message' => '¡Gracias! Te enviaremos contenido destacado',
                'data' => [
                    'email' => $emailLead->email,
                    'created_at' => $emailLead->created_at
                ]
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al guardar el email. Por favor, intenta nuevamente.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
