<?php

namespace App\Http\Requests\Port;

use Illuminate\Foundation\Http\FormRequest;

class StorePortRequest extends FormRequest
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
            'port_label' => 'required|string|max:255',
            'device_name' => 'required|string|max:255',
            'poe_enabled' => 'required|boolean',
            'vlan' => 'nullable|string|max:255',
            'speed' => 'nullable|string|max:255',
            'type_reseau' => 'nullable|in:IT,OT',
            'statut' => 'nullable|in:actif,inactif,reserve',
            'connexion_type' => 'nullable|in:fibre,rj45,cuivre',
            'port_genre' => 'nullable|in:uplink,downlink',
            'uplink' => 'nullable|string|max:255',
            'downlink' => 'nullable|string|max:255',
            'equipement_id' => 'required|exists:equipements,id',
            'connected_equipment_id' => 'nullable|exists:equipements,id',
        ];
    }
}
