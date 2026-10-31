<?php

namespace App\Models;

class Event extends ContentItem
{
    protected $table = 'events';

    protected function casts(): array
    {
        return parent::casts() + ['date' => 'immutable_date'];
    }
}
