<?php

namespace App\Http\Requests\Liaison;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLiaisonRequest extends FormRequest
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
            'from' => 'sometimes|exists:ports,id',
            'to' => 'sometimes|exists:ports,id',
            'direction' => 'nullable|in:up,down',
            'label' => 'sometimes|string|max:255',
            'media' => 'sometimes|string|max:255',
            'cable_type' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'length' => 'nullable|integer',
            'status' => 'sometimes|boolean',
        ];
    }
}
