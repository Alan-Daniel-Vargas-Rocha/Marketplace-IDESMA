<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cart extends Model
{
    protected $fillable = [
        'user_id',
    ];

    // Cada carrito pertenece a un usuario
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Un carrito puede contener varios artículos
    public function items()
    {
        return $this->hasMany(CartItem::class);
    }
}
