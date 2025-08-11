<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class TeamInvitation extends Model
{
    use HasFactory;

    protected $fillable = [
        'artist_id',
        'email',
        'name',
        'role',
        'custom_role',
        'status',
        'invitation_token',
        'expires_at',
        'message',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($invitation) {
            $invitation->invitation_token = Str::random(32);
            $invitation->expires_at = now()->addDays(7); // Expire in 7 days
        });
    }

    public function artist(): BelongsTo
    {
        return $this->belongsTo(Artist::class);
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function isPending(): bool
    {
        return $this->status === 'pending' && !$this->isExpired();
    }

    public function getRoleDisplayName(): string
    {
        if ($this->role === 'custom') {
            return $this->custom_role ?? 'Team Member';
        }

        return match($this->role) {
            'tour_manager' => 'Tour Manager',
            'booking_agent' => 'Booking Agent',
            'sound_engineer' => 'Sound Engineer',
            'venue_manager' => 'Venue Manager',
            'technical_director' => 'Technical Director',
            'agent' => 'Agent',
            'legal' => 'Legal',
            'production_manager' => 'Production Manager',
            'stage_manager' => 'Stage Manager',
            'pr_manager' => 'PR Manager',
            'media_coordinator' => 'Media Coordinator',
            'travel_coordinator' => 'Travel Coordinator',
            default => 'Team Member',
        };
    }
}