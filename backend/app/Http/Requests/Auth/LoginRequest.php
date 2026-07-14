<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Avoid Laravel's `email` rule here — it requires egulias/email-validator.
            // Hostinger vendor installs sometimes miss that package and crash login with 500.
            'email' => ['required', 'string', 'max:255', 'regex:/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/'],
            'password' => 'required|string',
        ];
    }
}
