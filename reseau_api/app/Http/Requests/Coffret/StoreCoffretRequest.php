<?php

namespace App\Http\Requests\Coffret;

use Illuminate\Foundation\Http\FormRequest;

class StoreCoffretRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('armoires.creer');
    }

    public function rules(): array
    {
        return [
            'nom' => 'required|string|max:255',
            'modele' => 'nullable|string|max:255',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:4096',
            'emplacement' => 'nullable|string|max:255',
            'long' => 'nullable|numeric',
            'lat' => 'nullable|numeric',
            'site_id' => 'required|exists:sites,id',
            'zone_id' => 'required|exists:zones,id',
            'batiment_id' => 'required|exists:batiments,id',
            'salle_id' => 'required|exists:salles,id',
            'status' => 'sometimes|in:active,inactive',
        ];
    }
}
