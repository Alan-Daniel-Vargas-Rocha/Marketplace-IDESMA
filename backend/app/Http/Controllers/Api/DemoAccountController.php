<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class DemoAccountController extends Controller
{
    public function store(RegisterRequest $request, AuthService $auth): JsonResponse
    {
        // ======== Aqui usamos el registro normal y marcamos que la cuenta salio de prueba.
        $resultado = DB::transaction(function () use ($request, $auth) {
            $resultado = $auth->register($request);
            $resultado['user']->forceFill(['is_demo' => true])->save();

            return $resultado;
        }, 5);

        return response()->json($resultado, 201);
    }

    public function destroy(Request $request): Response
    {
        DB::transaction(function () use ($request) {
            $user = User::whereKey($request->user()->id)->lockForUpdate()->firstOrFail();
            abort_unless((bool) $user->is_demo, 403, 'Esta cuenta no es de prueba.');

            // ======== Nota, cerramos el acceso y guardamos los pedidos para no romper el historial.
            $user->forceFill(['demo_deleted_at' => now()])->save();
            $user->tokens()->delete();
            $user->products()->update(['status' => 'pausado']);
        }, 5);

        return response()->noContent();
    }
}
