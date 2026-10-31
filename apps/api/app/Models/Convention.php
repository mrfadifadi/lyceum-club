<?php

namespace App\Models;

class Convention extends ContentItem
{
    protected $table = 'conventions';

    protected function casts(): array
    {
        return parent::casts() + ['date' => 'immutable_date'];
    }
}
