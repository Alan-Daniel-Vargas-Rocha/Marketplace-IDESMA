<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;

class OrderItem extends Model
{
    // Este ítem pertenece a una orden
    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    // Este ítem apunta a un producto
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    // Este ítem le pertenece a un vendedor (User)
    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    protected $fillable = [
        'order_id', 'product_id', 'seller_id', 'quantity', 
        'unit_price', 'commission_amount', 'iva_amount'
    ];
}