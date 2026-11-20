<?php

namespace App\Http\Requests\Order;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, ['comprador', 'ambos'], true);
    }

    public function rules(): array
    {
        // ======== Si mandan items usamos esa lista. Si no mandan, usamos el carrito.
        return [
            'items' => 'sometimes|required|array|min:1|max:100',
            'items.*.product_id' => 'required|integer|distinct|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1|max:2147483647',
        ];
    }
}
