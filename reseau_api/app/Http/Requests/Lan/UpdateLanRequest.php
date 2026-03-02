<?php

namespace App\Http\Requests\Lan;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLanRequest extends FormRequest
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
            'name' => 'sometimes|string|max:255',
            'subnet' => 'sometimes|string|max:255',
            'vlan_id' => 'sometimes|integer',
            'site' => 'sometimes|string|max:255',
            'status' => 'sometimes|in:active,inactive,maintenance',
            'description' => 'nullable|string',
            'gateway' => 'nullable|string|max:255',
            'batiment_id' => 'sometimes|exists:batiments,id',
            'salle_id' => 'sometimes|exists:salles,id',
        ];
    }
}
