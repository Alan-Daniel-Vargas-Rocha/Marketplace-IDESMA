<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CartItem extends Model
{
    // La tabla cart_items no tiene timestamps
    public $timestamps = false;

    protected $fillable = [
        'cart_id',
        'product_id',
        'quantity',
    ];

    // Cada artículo pertenece a un carrito
    public function cart()
    {
        return $this->belongsTo(Cart::class);
    }

    // Cada artículo corresponde a un producto
    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
