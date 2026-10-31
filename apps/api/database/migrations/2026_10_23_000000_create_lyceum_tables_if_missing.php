<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('users')) {
            Schema::create('users', function (Blueprint $table): void {
                $table->id();
                $table->string('full_name', 200);
                $table->string('email', 255)->unique();
                $table->string('password_hash', 255);
                $table->string('role', 20)->default('member');
                $table->boolean('is_active')->default(true);
                $table->string('confirmation_code_hash', 64)->nullable();
                $table->timestampTz('confirmation_code_expires_at')->nullable();
                $table->integer('confirmation_attempts')->default(0);
                $table->timestampTz('created_at')->useCurrent();
            });
        } else {
            Schema::table('users', function (Blueprint $table): void {
                if (!Schema::hasColumn('users', 'confirmation_code_hash')) {
                    $table->string('confirmation_code_hash', 64)->nullable();
                }
                if (!Schema::hasColumn('users', 'confirmation_code_expires_at')) {
                    $table->timestampTz('confirmation_code_expires_at')->nullable();
                }
                if (!Schema::hasColumn('users', 'confirmation_attempts')) {
                    $table->integer('confirmation_attempts')->default(0);
                }
            });
        }

        if (!Schema::hasTable('membership_applications')) {
            Schema::create('membership_applications', function (Blueprint $table): void {
                $table->id();
                $table->string('first_name', 100);
                $table->string('last_name', 100);
                $table->string('email', 255)->unique();
                $table->string('phone', 20);
                $table->string('university', 200);
                $table->string('major', 200);
                $table->string('academic_year', 30);
                $table->text('motivation');
                $table->text('skills_interests');
                $table->string('cv_path', 500)->nullable();
                $table->string('status', 20)->default('pending');
                $table->timestampTz('created_at')->useCurrent();
                $table->timestampTz('reviewed_at')->nullable();
                $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            });
        }

        if (!Schema::hasTable('events')) {
            Schema::create('events', function (Blueprint $table): void {
                $this->addContentColumns($table);
                $table->date('date');
                $table->string('location', 250);
            });
        }

        if (!Schema::hasTable('news_articles')) {
            Schema::create('news_articles', function (Blueprint $table): void {
                $this->addContentColumns($table);
                $table->date('date');
                $table->string('author', 200)->nullable();
                $table->boolean('featured')->default(false);
            });
        }

        if (!Schema::hasTable('formations')) {
            Schema::create('formations', function (Blueprint $table): void {
                $this->addContentColumns($table);
                $table->string('duration', 100);
                $table->string('status', 20)->default('upcoming');
                $table->string('level', 100)->nullable();
            });
        }

        if (!Schema::hasTable('conventions')) {
            Schema::create('conventions', function (Blueprint $table): void {
                $this->addContentColumns($table);
                $table->date('date');
                $table->string('location', 250);
                $table->string('partner', 250)->nullable();
            });
        }
    }

    public function down(): void
    {
        // Tables may predate Laravel and contain production data; do not drop them on rollback.
    }

    private function addContentColumns(Blueprint $table): void
    {
        $table->uuid('id')->primary();
        $table->string('slug', 200)->unique();
        $table->string('title', 250);
        $table->text('excerpt');
        $table->json('body');
        $table->string('category', 100);
        $table->string('image_url', 1000)->nullable();
        $table->string('image_alt', 500)->nullable();
        $table->boolean('is_sample')->default(false);
        $table->timestampTz('created_at')->useCurrent();
        $table->timestampTz('updated_at')->useCurrent();
    }
};
