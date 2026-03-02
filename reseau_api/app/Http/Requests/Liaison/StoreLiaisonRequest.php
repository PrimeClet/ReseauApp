<?php

namespace App\Http\Requests\Liaison;

use Illuminate\Foundation\Http\FormRequest;

class StoreLiaisonRequest extends FormRequest
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
            'from' => 'required|exists:ports,id',
            'to' => 'required|exists:ports,id',
            'direction' => 'nullable|in:up,down',
            'label' => 'required|string|max:255',
            'media' => 'required|string|max:255',
            'cable_type' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'length' => 'nullable|integer',
            'status' => 'required|boolean',
        ];
    }
}
