<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;

class Order extends Model
{
    // La orden pertenece a un comprador (User)
    public function buyer()
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    // Una orden tiene muchos ítems (productos comprados)
    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }
    
    protected $fillable = [
        'buyer_id', 'status', 'subtotal', 'tax', 'total'
    ];
}
