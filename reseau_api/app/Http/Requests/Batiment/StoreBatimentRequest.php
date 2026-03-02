<?php

namespace App\Http\Requests\Batiment;

use Illuminate\Foundation\Http\FormRequest;

class StoreBatimentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->isAdministrator();
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'nom' => 'required|string|max:255',
            'description' => 'nullable|string',
            'zone_id' => 'nullable|exists:zones,id',
        ];
    }
}
