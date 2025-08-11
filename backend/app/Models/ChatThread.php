<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ChatThread extends Model
{
    use HasFactory;

    protected $fillable = [
        'artist_id',
        'booking_id',
        'name',
        'description',
        'type',
        'is_active',
        'created_by',
        'last_message_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_message_at' => 'datetime',
    ];

    public function artist(): BelongsTo
    {
        return $this->belongsTo(Artist::class);
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(ChatMessage::class, 'thread_id');
    }

    public function participants(): HasMany
    {
        return $this->hasMany(ChatThreadParticipant::class, 'thread_id');
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'chat_thread_participants', 'thread_id', 'user_id')
                    ->withPivot('last_read_at', 'is_muted', 'can_add_participants')
                    ->withTimestamps();
    }

    public function teamMembers(): BelongsToMany
    {
        return $this->belongsToMany(ArtistTeamMember::class, 'chat_thread_participants', 'thread_id', 'team_member_id')
                    ->withPivot('last_read_at', 'is_muted', 'can_add_participants')
                    ->withTimestamps();
    }

    public function lastMessage(): HasMany
    {
        return $this->messages()->latest()->limit(1);
    }

    public function getUnreadCountForUser(User $user): int
    {
        $participant = $this->participants()->where('user_id', $user->id)->first();
        
        if (!$participant || !$participant->last_read_at) {
            return $this->messages()->count();
        }

        return $this->messages()
                    ->where('created_at', '>', $participant->last_read_at)
                    ->where('user_id', '!=', $user->id)
                    ->count();
    }

    public function markAsReadForUser(User $user): void
    {
        $this->participants()
             ->where('user_id', $user->id)
             ->update(['last_read_at' => now()]);
    }
}