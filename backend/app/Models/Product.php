<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;


class Product extends Model
{
    // El producto pertenece a un vendedor (User)
    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    // El producto pertenece a una categoría
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    // Un producto puede estar en muchas órdenes (a través de los items)
    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
        }
    protected $fillable = [
        'seller_id', 'category_id', 'name', 'description', 'brand', 
        'condition', 'warranty_months', 'price', 'stock', 'status'
    ];
}
