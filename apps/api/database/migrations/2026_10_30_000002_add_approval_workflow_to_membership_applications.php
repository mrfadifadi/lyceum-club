<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('membership_applications', function (Blueprint $table): void {
            if (!Schema::hasColumn('membership_applications', 'hr_status')) {
                // 'pending' | 'approved' | 'rejected'
                $table->string('hr_status', 20)->default('pending')->after('status');
            }
            if (!Schema::hasColumn('membership_applications', 'hr_rejection_reason')) {
                $table->text('hr_rejection_reason')->nullable()->after('hr_status');
            }
            if (!Schema::hasColumn('membership_applications', 'hr_reviewed_by')) {
                $table->foreignId('hr_reviewed_by')->nullable()->constrained('users')->nullOnDelete()->after('hr_rejection_reason');
            }
            if (!Schema::hasColumn('membership_applications', 'hr_reviewed_at')) {
                $table->timestampTz('hr_reviewed_at')->nullable()->after('hr_reviewed_by');
            }
            if (!Schema::hasColumn('membership_applications', 'president_status')) {
                // 'pending' | 'approved' | 'rejected'  — only set after HR approves
                $table->string('president_status', 20)->nullable()->after('hr_reviewed_at');
            }
            if (!Schema::hasColumn('membership_applications', 'president_reviewed_by')) {
                $table->foreignId('president_reviewed_by')->nullable()->constrained('users')->nullOnDelete()->after('president_status');
            }
            if (!Schema::hasColumn('membership_applications', 'president_reviewed_at')) {
                $table->timestampTz('president_reviewed_at')->nullable()->after('president_reviewed_by');
            }
        });
    }

    public function down(): void
    {
        Schema::table('membership_applications', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('hr_reviewed_by');
            $table->dropConstrainedForeignId('president_reviewed_by');
            $table->dropColumn(['hr_status', 'hr_rejection_reason', 'hr_reviewed_at', 'president_status', 'president_reviewed_at']);
        });
    }
};

