<?php

namespace App\Http\Requests\Salle;

use Illuminate\Foundation\Http\FormRequest;

class StoreSalleRequest extends FormRequest
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
            'batiment_id' => 'required|exists:batiments,id',
            'etage' => 'nullable|integer',
            'capacite' => 'nullable|integer|min:1',
            'type' => 'required|string|max:255',
            'etat' => 'nullable|in:Actif,Inactif,Maintenance',
            'description' => 'nullable|string',
        ];
    }
}
