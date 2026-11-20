<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    // La tabla audit_logs no tiene updated_at
    public const UPDATED_AT = null;

    protected $fillable = [
        'event',
        'user_id',
        'entity_type',
        'entity_id',
        'description',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'created_at' => 'datetime',
        ];
    }

    // Cada registro puede estar asociado a un usuario
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
