<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentMethod extends Model
{
    protected $fillable = [
        'user_id',
        'gateway_customer_id',
        'last_four_digits',
        'card_brand',
        'is_default',
    ];

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
        ];
    }

    // Cada método de pago pertenece a un usuario
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
