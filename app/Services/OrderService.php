<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Http\Requests\Order\StoreOrderRequest;
use Illuminate\Support\Facades\DB;
use Exception;

class OrderService
{
    public function createOrder(StoreOrderRequest $request, int $buyerId): Order
    {
        return DB::transaction(function () use ($request, $buyerId) {
            
            $items = $request->input('items');
            $subtotal = 0;
            $totalTax = 0;
            $total = 0;

            foreach ($items as $item) {
                $product = Product::findOrFail($item['product_id']);
                
                if ($product->stock < $item['quantity']) {
                    throw new Exception("Stock insuficiente para el producto: {$product->name}");
                }

                $itemSubtotal = $product->price * $item['quantity'];
                $itemTax = $itemSubtotal * 0.16; // 16% IVA

                $subtotal += $itemSubtotal;
                $totalTax += $itemTax;
            }

            $total = $subtotal + $totalTax;

            $order = Order::create([
                'buyer_id' => $buyerId,
                'status' => 'paid',
                'subtotal' => $subtotal,
                'tax' => $totalTax,
                'total' => $total,
            ]);

            foreach ($items as $item) {
                $product = Product::find($item['product_id']);
                $itemSubtotal = $product->price * $item['quantity'];
                
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'seller_id' => $product->seller_id,
                    'quantity' => $item['quantity'],
                    'unit_price' => $product->price,
                    'commission_amount' => $itemSubtotal * 0.10, // 10% comisión
                    'iva_amount' => $itemSubtotal * 0.16,
                ]);

                $product->decrement('stock', $item['quantity']);
            }

            return $order->load('items.product');
        });
    }
}