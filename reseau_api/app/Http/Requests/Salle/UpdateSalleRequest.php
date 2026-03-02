<?php

namespace App\Http\Requests\Salle;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSalleRequest extends FormRequest
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
            'nom' => 'sometimes|string|max:255',
            'batiment_id' => 'sometimes|exists:batiments,id',
            'etage' => 'nullable|integer',
            'capacite' => 'sometimes|integer|min:1',
            'type' => 'sometimes|string|max:255',
            'etat' => 'sometimes|in:Actif,Inactif,Maintenance',
            'description' => 'nullable|string',
        ];
    }
}
