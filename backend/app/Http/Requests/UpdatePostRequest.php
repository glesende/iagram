<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'content' => 'sometimes|string|max:2000',
            'image_url' => 'nullable|url|max:500',
            'image_description' => 'nullable|string|max:1000',
            'ai_generation_params' => 'nullable|array',
            'likes_count' => 'nullable|integer|min:0',
            'comments_count' => 'nullable|integer|min:0',
            'is_ai_generated' => 'nullable|boolean',
            'published_at' => 'nullable|date'
        ];
    }

    public function messages(): array
    {
        return [
            'content.max' => 'El contenido no puede exceder los 2000 caracteres.',
            'image_url.url' => 'La URL de la imagen debe ser válida.',
            'image_description.max' => 'La descripción de la imagen no puede exceder los 1000 caracteres.',
            'likes_count.min' => 'El número de likes no puede ser negativo.',
            'comments_count.min' => 'El número de comentarios no puede ser negativo.',
            'published_at.date' => 'La fecha de publicación debe ser válida.'
        ];
    }
}