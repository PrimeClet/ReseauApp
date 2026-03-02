<?php

namespace App\Http\Requests\Maintenance;

use Illuminate\Foundation\Http\FormRequest;

class StoreMaintenanceRequest extends FormRequest
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
            'equipement_id' => 'nullable|exists:equipements,id',
            'type' => 'required|string|max:255',
            'date_debut' => 'required|date',
            'heure_debut' => 'required|date_format:H:i',
            'duree' => 'required|string|max:255',
            'technicien' => 'required|string|max:255',
            'priorite' => 'required|in:basse,moyenne,haute,critique',
            'description' => 'required|string',
            'statut' => 'sometimes|in:planifiee,en_cours,terminee,annulee',
        ];
    }
}
