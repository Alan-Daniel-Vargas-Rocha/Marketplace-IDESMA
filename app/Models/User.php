<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    //permite crear usuarios mediante Eloquent utilizando los cuatro campos obligatorios
    protected $fillable = [
        'name',
        'email',
        'role',
        'password',
    ];

    //evita que la contraseña y el token se incluyan al convertir el usuario a JSON.
    protected $hidden = [
        'password',
        'remember_token',
    ];

    //convierte la fecha de verificación a un objeto de fecha y aplica hashing a la contraseña cuando se asigna mediante Eloquent.
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }


    // Un usuario tiene un perfil de vendedor (si decide vender)
    public function sellerProfile()
    {
        return $this->hasOne(SellerProfile::class);
    }

    // Un usuario vende muchos productos
    public function products()
    {
        return $this->hasMany(Product::class, 'seller_id');
    }

    // Un usuario compra muchas órdenes
    public function ordersAsBuyer()
    {
        return $this->hasMany(Order::class, 'buyer_id');
    }

    // Un usuario (vendedor) tiene muchas ventas a través de los items
    public function sales()
    {
        return $this->hasMany(OrderItem::class, 'seller_id');
    }
}