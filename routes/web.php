<?php

use Illuminate\Support\Facades\Route;
use App\Models\Product;

Route::get ('/', function (Request $request) {
    return response()->json(['live'=> 'Hello World!'], 200);
});

// Ruta Para Consultar productos (Prueba de Modelos)
Route::get('/test-products', function () {
    // Traemos todos los productos de la base de datos
    $products = Product::all();
    
    // Si está vacío, devolvemos un mensaje
    if ($products->isEmpty()) {
        return response()->json(['message' => 'No hay productos en la BD aún.']);
    }

    // Si hay productos, los devolvemos en formato JSON
    return response()->json([
        'status' => 'success',
        'total_products' => $products->count(),
        'data' => $products
    ]);
});
