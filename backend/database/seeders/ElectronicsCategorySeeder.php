<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ElectronicsCategorySeeder extends Seeder
{
    public function run(): void
    {
        // ======== Aqui dejamos las primeras categorias para que ya se pueda publicar.
        foreach ([
            'computadoras' => 'Computadoras',
            'componentes' => 'Componentes',
            'cables-y-adaptadores' => 'Cables y adaptadores',
            'perifericos' => 'Perifericos',
        ] as $slug => $name) {
            DB::table('categories')->insertOrIgnore([
                'slug' => $slug,
                'name' => $name,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
