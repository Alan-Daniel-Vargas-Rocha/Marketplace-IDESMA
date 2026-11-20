<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Order\StoreOrderRequest;
use App\Services\OrderService;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function __construct(private OrderService $orders) {}

    public function index(Request $request)
    {
        return response()->json(
            $request->user()->ordersAsBuyer()->latest('id')->paginate(20)
        );
    }

    public function show(Request $request, int $id)
    {
        // ======== Aqui solo buscamos dentro de los pedidos de quien inicio sesion.
        $order = $request->user()->ordersAsBuyer()
            ->with('items.product')
            ->findOrFail($id);

        return response()->json(['data' => $order]);
    }

    public function store(StoreOrderRequest $request)
    {
        $order = $this->orders->createOrder(
            $request->validated('items'),
            $request->user()->id
        );

        return response()->json(['message' => 'Orden creada exitosamente', 'data' => $order], 201);
    }
}
