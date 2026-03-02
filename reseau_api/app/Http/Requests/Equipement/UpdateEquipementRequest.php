<?php

namespace App\Http\Requests\Equipement;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEquipementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('equipements.modifier');
    }

    public function rules(): array
    {
        return [
            'equipement_code' => 'sometimes|string|max:255|unique:equipements,equipement_code,'.$this->route('equipement')->id,
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|string|max:255',
            'modele' => 'sometimes|string|max:255|nullable',
            'fabricant' => 'sometimes|string|max:255|nullable',
            'numero_serie' => 'sometimes|string|max:255|nullable',
            'type_reseau' => 'sometimes|in:IT,OT|nullable',
            'description' => 'nullable|string',
            'direction_in_out' => 'nullable|string',
            'vlan' => 'nullable|string',
            'ip_address' => 'nullable|ip',
            'mac_address' => ['nullable', 'string', 'max:17', 'regex:/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/'],
            'coffret_id' => 'sometimes|exists:coffrets,id',
            'batiment_id' => 'nullable|exists:batiments,id',
            'salle_id' => 'nullable|exists:salles,id',
            'status' => 'sometimes|in:active,inactive,maintenance',
            'is_principal' => 'nullable|boolean',
            'is_manageable' => 'nullable|boolean',
        ];
    }
}
