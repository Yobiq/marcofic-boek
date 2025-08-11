<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('booking_code')->unique();
            $table->string('title')->nullable();
            $table->foreignId('artist_id')->constrained()->onDelete('cascade');
            $table->foreignId('venue_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('stage_id')->nullable()->constrained()->onDelete('set null');
            $table->datetime('event_date');
            $table->string('status')->default('pending');
            $table->boolean('is_confirmed')->default(false);
            $table->boolean('checked_in')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
