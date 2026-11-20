<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderService
{
    public function __construct(private CartService $carts) {}

    public function createOrder(?array $items, int $buyerId): Order
    {
        // ======== Acontinuacion tenemos los bloques que se encargan de hacer el pedido.
        // ======== Nota, si algo falla aqui se regresa el stock y el pedido no queda a medias.
        return DB::transaction(function () use ($items, $buyerId) {
            $cart = $items === null ? $this->carts->lock($buyerId) : null;
            $items ??= $cart->items()->get(['product_id', 'quantity'])->toArray();

            if (count($items) < 1 || count($items) > 100) {
                throw ValidationException::withMessages([
                    'items' => 'El pedido debe tener entre 1 y 100 productos.',
                ]);
            }

            $subtotal = 0;
            $tax = 0;
            $lines = [];

            // ======== Aqui descontamos solo si todavia hay stock para todo lo que pidieron.
            foreach (collect($items)->sortBy('product_id') as $item) {
                $product = Product::whereKey($item['product_id'])->lockForUpdate()->first();
                $quantity = (int) $item['quantity'];

                if (!$product || !Product::whereKey($product->id)
                    ->where('status', 'activo')
                    ->where('stock', '>=', $quantity)
                    ->decrement('stock', $quantity)) {
                    throw ValidationException::withMessages([
                        'items' => "No hay stock disponible para el producto {$item['product_id']}.",
                    ]);
                }

                $price = (int) round($product->price * 100);
                $lineSubtotal = $price * $quantity;

                if ($lineSubtotal > 9999999999 - $subtotal) {
                    throw ValidationException::withMessages([
                        'items' => 'El subtotal supera el limite del pedido.',
                    ]);
                }

                // ======== Una cosa, si van a moverle al IVA o comision, pongan fecha y que cambiaron.
                // ===AAAA-MM-DD=== Descripcion del cambio.
                $lineTax = intdiv($lineSubtotal * 16 + 50, 100);
                $subtotal += $lineSubtotal;
                $tax += $lineTax;

                $lines[] = [
                    'product_id' => $product->id,
                    'seller_id' => $product->seller_id,
                    'quantity' => $quantity,
                    'unit_price' => $this->money($price),
                    'commission_amount' => $this->money(intdiv($lineSubtotal * 10 + 50, 100)),
                    'iva_amount' => $this->money($lineTax),
                ];
            }

            if ($subtotal + $tax > 9999999999) {
                throw ValidationException::withMessages([
                    'items' => 'El total supera el limite del pedido.',
                ]);
            }

            // ======== Aqui guardamos el pedido como pendiente y vaciamos el carrito.
            $order = Order::create([
                'buyer_id' => $buyerId,
                'status' => 'pending',
                'subtotal' => $this->money($subtotal),
                'tax' => $this->money($tax),
                'total' => $this->money($subtotal + $tax),
            ]);

            $order->items()->createMany($lines);
            $cart?->items()->delete();

            return $order->load('items.product');
        }, 5);
    }

    private function money(int $cents): string
    {
        return sprintf('%d.%02d', intdiv($cents, 100), $cents % 100);
    }
}
