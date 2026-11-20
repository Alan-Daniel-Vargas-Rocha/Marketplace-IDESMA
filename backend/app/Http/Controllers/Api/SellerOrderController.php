<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OrderItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SellerOrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $seller = $request->user();
        abort_unless(
            in_array($seller->role, ['vendedor', 'ambos'], true),
            403,
            'Esta seccion es para vendedores.'
        );

        // ======== Aqui buscamos por el vendedor que quedo guardado en cada partida.
        // ======== Nota, del comprador solo se muestra el nombre para identificar el pedido.
        $items = OrderItem::query()
            ->where('seller_id', $seller->id)
            ->with([
                'product:id,name',
                'order:id,buyer_id,status,created_at',
                'order.buyer:id,name',
            ])
            ->latest('id')
            ->paginate(20)
            ->through(fn (OrderItem $item) => [
                'id' => $item->id,
                'order_id' => $item->order_id,
                'buyer_name' => $item->order?->buyer?->name,
                'product_name' => $item->product?->name,
                'quantity' => $item->quantity,
                'unit_price' => $item->unit_price,
                'status' => $item->order?->status,
                'ordered_at' => $item->order?->created_at?->toISOString(),
            ]);

        return response()->json($items);
    }
}
