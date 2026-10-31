<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

abstract class ContentItem extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected function casts(): array
    {
        return [
            'body' => 'array',
            'is_sample' => 'boolean',
            'created_at' => 'immutable_datetime',
            'updated_at' => 'immutable_datetime',
        ];
    }
}
