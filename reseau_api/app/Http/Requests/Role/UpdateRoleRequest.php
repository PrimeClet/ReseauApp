<?php

namespace App\Http\Requests\Role;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRoleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('roles.modifier');
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $roleId = $this->route('id') ?? $this->route('role');

        return [
            'name' => 'sometimes|string|max:255|unique:roles,name,'.$roleId,
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,name',
        ];
    }
}
