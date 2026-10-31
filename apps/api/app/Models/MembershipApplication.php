<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MembershipApplication extends Model
{
    protected $table = 'membership_applications';

    public $timestamps = false;

    protected $fillable = [
        'first_name', 'last_name', 'email', 'phone',
        'university', 'major', 'academic_year',
        'motivation', 'skills_interests', 'cv_path',
        'status',
        'hr_status', 'hr_rejection_reason', 'hr_reviewed_by', 'hr_reviewed_at',
        'president_status', 'president_reviewed_by', 'president_reviewed_at',
        'reviewed_by', 'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'created_at'            => 'immutable_datetime',
            'reviewed_at'           => 'immutable_datetime',
            'hr_reviewed_at'        => 'immutable_datetime',
            'president_reviewed_at' => 'immutable_datetime',
        ];
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function hrReviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'hr_reviewed_by');
    }

    public function presidentReviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'president_reviewed_by');
    }
}
