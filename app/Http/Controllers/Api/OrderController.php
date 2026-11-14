<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Order\StoreOrderRequest;
use App\Services\OrderService;
use Exception;

class OrderController extends Controller
{
    public function __construct(private OrderService $orderService) {}

    public function store(StoreOrderRequest $request)
    {
        try {
            $order = $this->orderService->createOrder($request, $request->user()->id);
            
            return response()->json([
                'message' => 'Orden creada exitosamente',
                'data' => $order
            ], 201);

        } catch (Exception $e) {
            return response()->json([
                'message' => 'Error al procesar la orden',
                'error' => $e->getMessage()
            ], 400);
        }
    }
}