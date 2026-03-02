<?php

namespace App\Http\Requests\Maintenance;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMaintenanceRequest extends FormRequest
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
            'type' => 'sometimes|string|max:255',
            'date_debut' => 'sometimes|date',
            'heure_debut' => 'sometimes|date_format:H:i',
            'duree' => 'sometimes|string|max:255',
            'technicien' => 'sometimes|string|max:255',
            'priorite' => 'sometimes|in:basse,moyenne,haute,critique',
            'description' => 'sometimes|string',
            'statut' => 'sometimes|in:planifiee,en_cours,terminee,annulee',
        ];
    }
}
