<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CartService;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function __construct(private CartService $carts) {}

    public function show(Request $request)
    {
        return response()->json(['data' => $this->carts->show($this->buyerId($request))]);
    }

    public function store(Request $request)
    {
        $buyerId = $this->buyerId($request);
        $data = $request->validate([
            'product_id' => 'required|integer|exists:products,id',
            'quantity' => 'required|integer|min:1|max:2147483647',
        ]);

        $cart = $this->carts->save($buyerId, $data['product_id'], $data['quantity'], true);

        return response()->json(['data' => $cart], 201);
    }

    public function update(Request $request, int $product)
    {
        $buyerId = $this->buyerId($request);
        $data = $request->validate(['quantity' => 'required|integer|min:1|max:2147483647']);

        return response()->json([
            'data' => $this->carts->save($buyerId, $product, $data['quantity'], false),
        ]);
    }

    public function destroy(Request $request, int $product)
    {
        $this->carts->remove($this->buyerId($request), $product);

        return response()->noContent();
    }

    private function buyerId(Request $request): int
    {
        $user = $request->user();
        abort_unless(in_array($user->role, ['comprador', 'ambos'], true), 403);

        return $user->id;
    }
}
