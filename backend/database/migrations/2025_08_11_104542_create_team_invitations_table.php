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
        Schema::create('team_invitations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('artist_id')->constrained()->onDelete('cascade');
            $table->string('email');
            $table->string('name');
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
            $table->enum('status', ['pending', 'accepted', 'declined', 'expired'])->default('pending');
            $table->string('invitation_token')->unique();
            $table->timestamp('expires_at');
            $table->text('message')->nullable();
            $table->timestamps();

            $table->index(['artist_id', 'status']);
            $table->index(['email', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('team_invitations');
    }
};