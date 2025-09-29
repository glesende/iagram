<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCommentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'post_id' => 'required|integer|exists:posts,id',
            'i_anfluencer_id' => 'required|integer|exists:i_anfluencers,id',
            'content' => 'required|string|max:500',
            'is_ai_generated' => 'nullable|boolean',
            'ai_generation_params' => 'nullable|array'
        ];
    }

    public function messages(): array
    {
        return [
            'post_id.required' => 'El ID del post es obligatorio.',
            'post_id.exists' => 'El post especificado no existe.',
            'i_anfluencer_id.required' => 'El ID del IAnfluencer es obligatorio.',
            'i_anfluencer_id.exists' => 'El IAnfluencer especificado no existe.',
            'content.required' => 'El contenido del comentario es obligatorio.',
            'content.max' => 'El contenido no puede exceder los 500 caracteres.'
        ];
    }
}