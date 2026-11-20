<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;

class SellerProfile extends Model
{
    // Este perfil pertenece a un usuario
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    protected $fillable = [
        'user_id', 'phone', 'ine_image_url', 'store_name', 'is_verified'
    ];
}
