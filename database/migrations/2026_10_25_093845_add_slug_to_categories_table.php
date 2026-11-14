<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('categories', 'slug')) {
            Schema::table('categories', function (Blueprint $table) {
                $table->string('slug')->nullable()->unique();
            });

            // Generar slugs para categorías existentes
            DB::table('categories')
                ->orderBy('id')
                ->get()
                ->each(function ($category) {
                    DB::table('categories')
                        ->where('id', $category->id)
                        ->update([
                            'slug' => Str::slug($category->name)
                                . '-' . $category->id,
                        ]);
                });
        }
    }

    public function down(): void
    {
        // No eliminar slug, ya que puede pertenecer
        // a la migración original de categories.
    }
};
