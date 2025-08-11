<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChatThreadParticipant extends Model
{
    use HasFactory;

    protected $fillable = [
        'thread_id',
        'user_id',
        'team_member_id',
        'last_read_at',
        'is_muted',
        'can_add_participants',
    ];

    protected $casts = [
        'last_read_at' => 'datetime',
        'is_muted' => 'boolean',
        'can_add_participants' => 'boolean',
    ];

    public function thread(): BelongsTo
    {
        return $this->belongsTo(ChatThread::class, 'thread_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function teamMember(): BelongsTo
    {
        return $this->belongsTo(ArtistTeamMember::class, 'team_member_id');
    }

    public function markAsRead(): void
    {
        $this->update(['last_read_at' => now()]);
    }

    public function getUnreadCount(): int
    {
        if (!$this->last_read_at) {
            return $this->thread->messages()->count();
        }

        return $this->thread->messages()
                    ->where('created_at', '>', $this->last_read_at)
                    ->where('user_id', '!=', $this->user_id)
                    ->count();
    }
}