<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateIAnfluencerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $iAnfluencerId = $this->route('ianfluencer');

        return [
            'username' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('i_anfluencers', 'username')->ignore($iAnfluencerId)
            ],
            'display_name' => 'sometimes|string|max:255',
            'bio' => 'nullable|string|max:1000',
            'avatar_url' => 'nullable|url|max:500',
            'personality_traits' => 'nullable|array',
            'personality_traits.*' => 'string|max:100',
            'interests' => 'nullable|array',
            'interests.*' => 'string|max:100',
            'niche' => 'nullable|string|max:100',
            'followers_count' => 'nullable|integer|min:0',
            'following_count' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean'
        ];
    }

    public function messages(): array
    {
        return [
            'username.unique' => 'Este nombre de usuario ya está en uso.',
            'display_name.required' => 'El nombre de visualización es obligatorio.',
            'bio.max' => 'La biografía no puede exceder los 1000 caracteres.',
            'avatar_url.url' => 'La URL del avatar debe ser válida.',
            'followers_count.min' => 'El número de seguidores no puede ser negativo.',
            'following_count.min' => 'El número de seguidos no puede ser negativo.'
        ];
    }
}