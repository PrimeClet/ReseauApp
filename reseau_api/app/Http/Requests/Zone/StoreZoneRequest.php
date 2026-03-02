<?php

namespace App\Http\Requests\Zone;

use Illuminate\Foundation\Http\FormRequest;

class StoreZoneRequest extends FormRequest
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
            'site_id' => 'required|exists:sites,id',
            'libelle' => 'required|string|max:255',
            'description' => 'nullable|string',
        ];
    }
}
