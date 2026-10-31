<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Model
{
    protected $table = 'users';

    public $timestamps = false;

    protected $fillable = [
        'full_name',
        'email',
        'password_hash',
        'role',
        'is_active',
        'confirmation_code_hash',
        'confirmation_code_expires_at',
        'confirmation_attempts',
        'created_by',
    ];

    protected $hidden = [
        'password_hash',
        'confirmation_code_hash',
        'confirmation_code_expires_at',
        'confirmation_attempts',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'confirmation_code_expires_at' => 'immutable_datetime',
            'created_at' => 'immutable_datetime',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(self::class, 'created_by');
    }

    public function createdUsers(): HasMany
    {
        return $this->hasMany(self::class, 'created_by');
    }
}
