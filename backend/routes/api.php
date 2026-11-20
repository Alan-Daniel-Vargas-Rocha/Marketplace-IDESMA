<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\SellerOrderController;
use App\Http\Controllers\Api\CategoryController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// ======== Aqui tenemos lo que se puede consultar sin iniciar sesion.
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'show'])->whereNumber('id');

Route::prefix('auth')->middleware('throttle:10,1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// ======== Acontinuacion tenemos las rutas donde ya ocupamos el token.
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', fn (Request $request) => $request->user());
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/seller/products', [ProductController::class, 'mine']);
    // ======== Aqui el vendedor checa los pedidos donde aparecen sus productos.
    Route::get('/seller/orders', [SellerOrderController::class, 'index']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update'])->whereNumber('id');

    Route::get('/cart', [CartController::class, 'show']);
    Route::post('/cart/items', [CartController::class, 'store']);
    Route::put('/cart/items/{product}', [CartController::class, 'update'])->whereNumber('product');
    Route::delete('/cart/items/{product}', [CartController::class, 'destroy'])->whereNumber('product');

    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{id}', [OrderController::class, 'show'])->whereNumber('id');
});

/* ======== Estas rutas son solo para las cuentas de prueba del entorno local. */
if (app()->environment('local')) {
    Route::post('/dev/accounts', [\App\Http\Controllers\Api\DemoAccountController::class, 'store'])
        ->middleware('throttle:10,1');
    Route::delete('/dev/account', [\App\Http\Controllers\Api\DemoAccountController::class, 'destroy'])
        ->middleware('auth:sanctum');
}

/* ======== Aqui contamos las unidades pagadas y pendientes del vendedor que inicio sesion. */
Route::get('/seller/summary', function (\Illuminate\Http\Request $request) {
    $seller = $request->user();
    abort_unless(in_array($seller->role, ['vendedor', 'ambos'], true), 403);

    $unidades = \App\Models\OrderItem::query()
        ->join('orders', 'orders.id', '=', 'order_items.order_id')
        ->where('order_items.seller_id', $seller->id)
        ->whereIn('orders.status', ['paid', 'pending'])
        ->selectRaw('orders.status, SUM(order_items.quantity) AS units')
        ->groupBy('orders.status')
        ->pluck('units', 'status');

    return response()->json(['data' => [
        'sold_units' => (int) $unidades->get('paid', 0),
        'pending_units' => (int) $unidades->get('pending', 0),
    ]]);
})->middleware('auth:sanctum');

/* ======== Aqui el admin de la demo puede ver los correos y roles registrados. */
if (app()->environment('local')) {
    Route::get('/dev/overview', function (\Illuminate\Http\Request $request) {
        abort_unless(in_array($request->user()->role, ['admin', 'administrador'], true), 403);

        $cuentas = \App\Models\User::query()
            ->whereIn('role', ['comprador', 'vendedor', 'ambos'])
            ->whereNull('demo_deleted_at');

        $conteo = (clone $cuentas)
            ->selectRaw('role, COUNT(*) AS total')
            ->groupBy('role')
            ->pluck('total', 'role');

        return response()->json([
            'totals' => [
                'comprador' => (int) $conteo->get('comprador', 0),
                'vendedor' => (int) $conteo->get('vendedor', 0),
                'ambos' => (int) $conteo->get('ambos', 0),
            ],
            'accounts' => $cuentas->latest('id')
                ->paginate(15, ['id', 'name', 'email', 'role', 'is_demo']),
        ]);
    })->middleware('auth:sanctum');
}

/* ======== Aqui el admin de la demo puede checar quien publico cada producto. */
if (app()->environment('local')) {
    Route::get('/dev/products', function (\Illuminate\Http\Request $request) {
        abort_unless(in_array($request->user()->role, ['admin', 'administrador'], true), 403);

        $productos = \App\Models\Product::query()
            ->with('seller:id,name,email')
            ->latest('id')
            ->paginate(15)
            ->through(fn (\App\Models\Product $producto) => [
                'id' => $producto->id,
                'name' => $producto->name,
                'price' => $producto->price,
                'stock' => $producto->stock,
                'status' => $producto->status,
                'seller_name' => $producto->seller?->name,
                'seller_email' => $producto->seller?->email,
            ]);

        return response()->json($productos);
    })->middleware('auth:sanctum');
}
