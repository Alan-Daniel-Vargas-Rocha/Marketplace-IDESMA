<?php

namespace App\Services;

use App\Models\Category;
use Illuminate\Database\Eloquent\Collection;

class CategoryService
{
    public function list(): Collection
    {
        // ======== Aqui sacamos las categorias en orden para mostrarlas en la tienda.
        return Category::orderBy('name')->get();
    }
}
