<?php

namespace App\Http\Requests\Equipement;

use Illuminate\Foundation\Http\FormRequest;

class StoreEquipementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('equipements.creer');
    }

    public function rules(): array
    {
        return [
            'equipement_code' => 'nullable|string|max:255|unique:equipements,equipement_code',
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:255',
            'modele' => 'nullable|string|max:255',
            'fabricant' => 'nullable|string|max:255',
            'numero_serie' => 'nullable|string|max:255',
            'type_reseau' => 'nullable|in:IT,OT',
            'description' => 'nullable|string',
            'direction_in_out' => 'nullable|string',
            'vlan' => 'nullable|string',
            'ip_address' => 'nullable|ip',
            'mac_address' => ['nullable', 'string', 'max:17', 'regex:/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/'],
            'coffret_id' => 'nullable|exists:coffrets,id',
            'batiment_id' => 'nullable|exists:batiments,id',
            'salle_id' => 'required|exists:salles,id',
            'status' => 'required|in:active,inactive,maintenance',
            'is_principal' => 'nullable|boolean',
            'is_manageable' => 'nullable|boolean',
        ];
    }
}
