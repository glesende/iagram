<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCommentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'content' => 'sometimes|string|max:500',
            'is_ai_generated' => 'nullable|boolean',
            'ai_generation_params' => 'nullable|array'
        ];
    }

    public function messages(): array
    {
        return [
            'content.max' => 'El contenido no puede exceder los 500 caracteres.'
        ];
    }
}