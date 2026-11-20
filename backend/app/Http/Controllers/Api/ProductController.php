<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Product\StoreProductRequest;
use App\Services\ProductService;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function __construct(private ProductService $products) {}

    public function index()
    {
        return response()->json(['data' => $this->products->list()]);
    }

    public function show(int $id)
    {
        return response()->json(['data' => $this->products->find($id)]);
    }

    public function mine(Request $request)
    {
        $seller = $request->user();
        abort_unless(in_array($seller->role, ['vendedor', 'ambos'], true), 403);

        return response()->json(['data' => $this->products->forSeller($seller)]);
    }

    public function store(StoreProductRequest $request)
    {
        $product = $this->products->publish($request->user(), $request->validated());

        return response()->json(['message' => 'Producto publicado', 'data' => $product], 201);
    }

    public function update(Request $request, int $id)
    {
        $seller = $request->user();
        abort_unless(in_array($seller->role, ['vendedor', 'ambos'], true), 403);
        $product = $this->products->ownedProduct($seller, $id);

        // ======== Aqui checamos los datos que el vendedor si puede mover.
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|nullable|string',
            'brand' => 'sometimes|nullable|string|max:255',
            'condition' => 'sometimes|required|in:Nuevo,Usado,Reacondicionado',
            'warranty_months' => 'sometimes|required|integer|min:0|max:2147483647',
            'price' => 'sometimes|required|numeric|decimal:0,2|min:0.01|max:99999999.99',
            'stock' => 'sometimes|required|integer|min:0|max:2147483647',
            'category_id' => 'sometimes|required|integer|exists:categories,id',
            'status' => 'sometimes|required|in:activo,pausado,agotado',
        ]);

        return response()->json([
            'message' => 'Producto actualizado',
            'data' => $this->products->update($product, $data),
        ]);
    }
}
