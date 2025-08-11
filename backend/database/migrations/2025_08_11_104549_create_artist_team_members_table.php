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
        Schema::create('artist_team_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('artist_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('email');
            $table->string('phone')->nullable();
            $table->enum('role', [
                'tour_manager', 
                'booking_agent', 
                'sound_engineer', 
                'venue_manager', 
                'technical_director',
                'agent',
                'legal',
                'production_manager',
                'stage_manager',
                'pr_manager',
                'media_coordinator',
                'travel_coordinator',
                'custom'
            ]);
            $table->string('custom_role')->nullable();
            $table->boolean('is_primary')->default(false); // For primary agent, tour manager, etc.
            $table->boolean('can_invite_others')->default(false);
            $table->boolean('can_manage_bookings')->default(false);
            $table->boolean('can_access_financials')->default(false);
            $table->json('permissions')->nullable(); // Additional custom permissions
            $table->boolean('is_active')->default(true);
            $table->timestamp('joined_at')->nullable();
            $table->timestamps();

            $table->unique(['artist_id', 'user_id']);
            $table->index(['artist_id', 'role']);
            $table->index(['artist_id', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('artist_team_members');
    }
};