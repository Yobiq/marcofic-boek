<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('current_context', ['artist', 'agent', 'team_member', 'venue', 'promoter'])
                  ->nullable()
                  ->after('remember_token')
                  ->comment('Current active context for multi-role users');
            $table->json('available_contexts')->nullable()->after('current_context');
            $table->boolean('is_multi_role')->default(false)->after('available_contexts');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['current_context', 'available_contexts', 'is_multi_role']);
        });
    }
};