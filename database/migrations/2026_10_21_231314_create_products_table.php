<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            // Llave foránea que conecta con el usuario (vendedor)
            $table->foreignId('seller_id')->constrained('users')->onDelete('cascade');
            // Llave foránea que conecta con la categoría
            $table->foreignId('category_id')->constrained('categories')->onDelete('cascade');
            
            $table->string('name'); // Ej: Placa Madre ASUS
            $table->text('description')->nullable();
            $table->string('brand')->nullable();
            $table->string('condition')->default('Nuevo'); // Nuevo, Usado
            $table->integer('warranty_months')->default(0);
            $table->decimal('price', 10, 2); // Precio sin IVA
            $table->integer('stock'); // Inventario real
            $table->string('status')->default('activo'); // activo, pausado, agotado
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
