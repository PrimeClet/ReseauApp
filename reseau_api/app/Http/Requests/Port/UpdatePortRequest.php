<?php

namespace App\Http\Requests\Port;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePortRequest extends FormRequest
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
            'port_label' => 'sometimes|string|max:255',
            'device_name' => 'sometimes|string|max:255',
            'poe_enabled' => 'sometimes|boolean',
            'vlan' => 'nullable|string|max:255',
            'speed' => 'nullable|string|max:255',
            'type_reseau' => 'sometimes|in:IT,OT|nullable',
            'statut' => 'sometimes|in:actif,inactif,reserve|nullable',
            'connexion_type' => 'sometimes|in:fibre,rj45,cuivre|nullable',
            'port_genre' => 'sometimes|in:uplink,downlink|nullable',
            'uplink' => 'sometimes|string|max:255|nullable',
            'downlink' => 'sometimes|string|max:255|nullable',
            'equipement_id' => 'sometimes|exists:equipements,id',
            'connected_equipment_id' => 'nullable|exists:equipements,id',
        ];
    }
}
