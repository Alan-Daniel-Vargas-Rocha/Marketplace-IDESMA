<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CartService
{
    public function show(int $userId): Cart
    {
        return Cart::firstOrCreate(['user_id' => $userId])->load('items.product');
    }

    public function save(int $userId, int $productId, int $quantity, bool $add): Cart
    {
        return DB::transaction(function () use ($userId, $productId, $quantity, $add) {
            $cart = $this->lock($userId);
            $item = $cart->items()->where('product_id', $productId)->first();
            abort_if(!$add && !$item, 404);

            // ======== Nota, aqui checamos la cantidad. El stock baja al hacer el pedido.
            $quantity += $add ? ($item?->quantity ?? 0) : 0;
            $product = Product::where('status', 'activo')->find($productId);

            if (!$product || $product->stock < $quantity) {
                throw ValidationException::withMessages([
                    'quantity' => 'El producto no tiene stock suficiente.',
                ]);
            }

            $cart->items()->updateOrCreate(
                ['product_id' => $productId],
                ['quantity' => $quantity]
            );

            return $cart->load('items.product');
        }, 5);
    }

    public function remove(int $userId, int $productId): void
    {
        DB::transaction(function () use ($userId, $productId) {
            $cart = $this->lock($userId);
            abort_unless($cart->items()->where('product_id', $productId)->delete(), 404);
        }, 5);
    }

    public function lock(int $userId): Cart
    {
        // ======== Una cosa, aqui agarramos el mismo carrito al editar y al confirmar.
        $cart = Cart::firstOrCreate(['user_id' => $userId]);

        return Cart::whereKey($cart->id)->lockForUpdate()->firstOrFail();
    }
}
