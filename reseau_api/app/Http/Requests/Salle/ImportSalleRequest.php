<?php

namespace App\Http\Requests\Salle;

use Illuminate\Foundation\Http\FormRequest;

class ImportSalleRequest extends FormRequest
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
            'file' => 'required|file|mimes:csv,txt|max:2048',
        ];
    }
}
