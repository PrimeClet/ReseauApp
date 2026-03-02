<?php

namespace App\Http\Requests\Coffret;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCoffretRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('armoires.modifier');
    }

    public function rules(): array
    {
        return [
            'code' => 'sometimes|string|max:255|unique:coffrets,code,'.$this->route('coffret')->id,
            'nom' => 'sometimes|string|max:255',
            'modele' => 'sometimes|string|max:255|nullable',
            'photo' => 'sometimes|image|mimes:jpeg,png,jpg,gif,webp|max:4096|nullable',
            'emplacement' => 'sometimes|string|max:255|nullable',
            'long' => 'sometimes|numeric',
            'lat' => 'sometimes|numeric',
            'site_id' => 'sometimes|exists:sites,id',
            'zone_id' => 'sometimes|exists:zones,id',
            'batiment_id' => 'sometimes|exists:batiments,id',
            'salle_id' => 'sometimes|exists:salles,id',
            'status' => 'sometimes|in:active,inactive',
        ];
    }
}
