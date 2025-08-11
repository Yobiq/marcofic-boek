<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Artist extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'bio',
        'avatar',
        'user_id',
        'agency_id',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function agency(): BelongsTo
    {
        return $this->belongsTo(Agency::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function tours(): HasMany
    {
        return $this->hasMany(Tour::class);
    }

    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class);
    }

    public function teamMembers(): HasMany
    {
        return $this->hasMany(ArtistTeamMember::class);
    }

    public function activeTeamMembers(): HasMany
    {
        return $this->teamMembers()->where('is_active', true);
    }

    public function teamInvitations(): HasMany
    {
        return $this->hasMany(TeamInvitation::class);
    }

    public function pendingInvitations(): HasMany
    {
        return $this->teamInvitations()->where('status', 'pending');
    }

    public function chatThreads(): HasMany
    {
        return $this->hasMany(ChatThread::class);
    }

    public function activeChatThreads(): HasMany
    {
        return $this->chatThreads()->where('is_active', true);
    }

    public function isOwnAgent(): bool
    {
        // Check if the artist user is also marked as their own agent
        return $this->teamMembers()
                    ->where('user_id', $this->user_id)
                    ->where('role', 'agent')
                    ->where('is_active', true)
                    ->exists();
    }

    public function getPrimaryAgent(): ?ArtistTeamMember
    {
        return $this->teamMembers()
                    ->where('role', 'agent')
                    ->where('is_primary', true)
                    ->where('is_active', true)
                    ->first();
    }

    public function getPrimaryTourManager(): ?ArtistTeamMember
    {
        return $this->teamMembers()
                    ->where('role', 'tour_manager')
                    ->where('is_primary', true)
                    ->where('is_active', true)
                    ->first();
    }

    public function getTeamMembersByRole(string $role): \Illuminate\Database\Eloquent\Collection
    {
        return $this->activeTeamMembers()->where('role', $role)->get();
    }
}
