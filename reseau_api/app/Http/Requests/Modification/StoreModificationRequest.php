<?php

namespace App\Http\Requests\Modification;

use Illuminate\Foundation\Http\FormRequest;

class StoreModificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('modifications.creer');
    }

    public function rules(): array
    {
        return [
            'coffret_id' => 'required|exists:coffrets,id',
            'port_id' => 'nullable|exists:ports,id',
            'equipement_id' => 'nullable|exists:equipements,id',
            'type_modification' => 'required|in:ajout_port,ajout_equipement,modification_connexion,suppression_port,suppression_equipement,changement_statut_port',
            'description' => 'required|string',
            'raison' => 'required|string',
            'photo_avant' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:4096',
            'photo_apres' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:4096',
            'date_intervention' => 'required|date',
            'heure_intervention' => 'required|date_format:H:i',
        ];
    }
}
