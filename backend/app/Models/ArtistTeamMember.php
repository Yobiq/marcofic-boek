<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ArtistTeamMember extends Model
{
    use HasFactory;

    protected $fillable = [
        'artist_id',
        'user_id',
        'name',
        'email',
        'phone',
        'role',
        'custom_role',
        'is_primary',
        'can_invite_others',
        'can_manage_bookings',
        'can_access_financials',
        'permissions',
        'is_active',
        'joined_at',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'can_invite_others' => 'boolean',
        'can_manage_bookings' => 'boolean',
        'can_access_financials' => 'boolean',
        'permissions' => 'array',
        'is_active' => 'boolean',
        'joined_at' => 'datetime',
    ];

    public function artist(): BelongsTo
    {
        return $this->belongsTo(Artist::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
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

    public function canInviteMembers(): bool
    {
        return $this->can_invite_others || $this->is_primary || in_array($this->role, ['agent', 'tour_manager']);
    }

    public function canManageBookings(): bool
    {
        return $this->can_manage_bookings || $this->is_primary || in_array($this->role, ['agent', 'booking_agent', 'tour_manager']);
    }

    public function hasPermission(string $permission): bool
    {
        $permissions = $this->permissions ?? [];
        return in_array($permission, $permissions);
    }
}