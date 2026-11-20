<?php

namespace App\Services;

use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class ProductService
{
    // ======== Acontinuacion tenemos los bloques que se encargan del catalogo publico.
    public function list(): Collection
    {
        return $this->catalog()->latest('id')->get();
    }

    public function find(int $id): Product
    {
        return $this->catalog()->findOrFail($id);
    }

    public function forSeller(User $seller): Collection
    {
        return $seller->products()->latest('id')->get();
    }

    public function publish(User $seller, array $data): Product
    {
        // ======== Aqui el dueño sale de la cuenta que inicio sesion.
        return $seller->products()->create($data);
    }

    public function ownedProduct(User $seller, int $id): Product
    {
        $product = Product::findOrFail($id);
        abort_unless((int) $product->seller_id === (int) $seller->id, 403);

        return $product;
    }

    public function update(Product $product, array $data): Product
    {
        // ======== Una cosa, si van a moverle a la edicion, pongan la fecha y que cambiaron.
        // ===AAAA-MM-DD=== Descripcion del cambio.
        $product->update($data);

        return $product;
    }

    private function catalog(): Builder
    {
        // ======== Nota, los pausados se quedan en el panel del vendedor.
        return Product::with(['seller:id,name', 'category'])
            ->whereIn('status', ['activo', 'agotado']);
    }
}
