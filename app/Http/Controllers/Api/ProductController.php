<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Product\StoreProductRequest;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function store(StoreProductRequest $request)
    {
        $data = $request->validated();
        $data['seller_id'] = $request->user()->id;
        $product = Product::create($data);
        return response()->json(['message' => 'Producto publicado', 'data' => $product], 201);
    }

    public function index()
    {
        $products = Product::with(['seller', 'category'])->get();
        return response()->json(['data' => $products], 200);
    }

    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);
        if ($request->user()->id !== $product->seller_id) {
            return response()->json(['message' => 'No autorizado'], 403);
        }
        $request->validate(['name' => 'sometimes|string', 'price' => 'sometimes|numeric', 'stock' => 'sometimes|integer']);
        $product->update($request->all());
        return response()->json(['message' => 'Producto actualizado', 'data' => $product], 200);
    }
}