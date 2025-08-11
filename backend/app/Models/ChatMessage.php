<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChatMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'thread_id',
        'user_id',
        'content',
        'type',
        'attachments',
        'is_edited',
        'edited_at',
    ];

    protected $casts = [
        'attachments' => 'array',
        'is_edited' => 'boolean',
        'edited_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::created(function ($message) {
            // Update thread's last_message_at timestamp
            $message->thread->update(['last_message_at' => $message->created_at]);
        });
    }

    public function thread(): BelongsTo
    {
        return $this->belongsTo(ChatThread::class, 'thread_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function hasAttachments(): bool
    {
        return !empty($this->attachments);
    }

    public function getAttachmentsByType(string $type): array
    {
        if (!$this->hasAttachments()) {
            return [];
        }

        return array_filter($this->attachments, function ($attachment) use ($type) {
            return ($attachment['type'] ?? '') === $type;
        });
    }

    public function markAsEdited(): void
    {
        $this->update([
            'is_edited' => true,
            'edited_at' => now(),
        ]);
    }
}