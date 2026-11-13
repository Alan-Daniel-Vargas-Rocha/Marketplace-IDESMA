<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('categories', 'name')) {
            Schema::table('categories', function (Blueprint $table) {
                $table->string('name')->unique();
            });
        }
    }

    public function down(): void
    {
        // No eliminar name, ya que puede pertenecer
        // a la migración original de categories.
    }
};
