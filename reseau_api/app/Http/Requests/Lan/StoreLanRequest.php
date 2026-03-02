<?php

namespace App\Http\Requests\Lan;

use Illuminate\Foundation\Http\FormRequest;

class StoreLanRequest extends FormRequest
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
            'name' => 'required|string|max:255',
            'subnet' => 'required|string|max:255',
            'vlan_id' => 'required|integer',
            'site' => 'nullable|string|max:255',
            'status' => 'required|in:active,inactive,maintenance',
            'description' => 'nullable|string',
            'gateway' => 'nullable|string|max:255',
            'batiment_id' => 'nullable|exists:batiments,id',
            'salle_id' => 'nullable|exists:salles,id',
            'equipement_id' => 'nullable|exists:equipements,id',
        ];
    }
}
