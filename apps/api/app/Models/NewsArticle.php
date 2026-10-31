<?php

namespace App\Models;

class NewsArticle extends ContentItem
{
    protected $table = 'news_articles';

    protected function casts(): array
    {
        return parent::casts() + [
            'date' => 'immutable_date',
            'featured' => 'boolean',
        ];
    }
}
