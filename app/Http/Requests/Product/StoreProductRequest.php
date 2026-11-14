<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'brand' => 'nullable|string|max:255',
            'condition' => 'nullable|string|in:Nuevo,Usado,Reacondicionado',
            'warranty_months' => 'nullable|integer|min:0',
            'price' => 'required|numeric|min:0.01',
            'stock' => 'required|integer|min:1',
            'category_id' => 'required|integer|exists:categories,id',
        ];
    }
}