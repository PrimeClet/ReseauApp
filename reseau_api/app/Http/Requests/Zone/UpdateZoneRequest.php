<?php

namespace App\Http\Requests\Zone;

use Illuminate\Foundation\Http\FormRequest;

class UpdateZoneRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'site_id' => 'sometimes|exists:sites,id',
            'libelle' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
        ];
    }
}
