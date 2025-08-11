<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'current_context',
        'available_contexts',
        'is_multi_role',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'available_contexts' => 'array',
            'is_multi_role' => 'boolean',
        ];
    }

    /**
     * Get the artist associated with the user.
     */
    public function artist(): HasOne
    {
        return $this->hasOne(Artist::class);
    }

    public function teamMemberships(): HasMany
    {
        return $this->hasMany(ArtistTeamMember::class);
    }

    public function activeTeamMemberships(): HasMany
    {
        return $this->teamMemberships()->where('is_active', true);
    }

    /**
     * Get available contexts for this user based on their roles and relationships
     */
    public function getAvailableContexts(): array
    {
        $contexts = [];
        
        // Check if user is an artist
        if ($this->artist) {
            $contexts[] = 'artist';
        }
        
        // Check if user is a team member for any artists
        $teamMemberships = $this->activeTeamMemberships;
        if ($teamMemberships->isNotEmpty()) {
            foreach ($teamMemberships as $membership) {
                if ($membership->role === 'agent' && $membership->is_primary) {
                    $contexts[] = 'agent';
                } else {
                    $contexts[] = 'team_member';
                }
            }
        }
        
        return array_unique($contexts);
    }

    /**
     * Update available contexts and multi-role status
     */
    public function updateAvailableContexts(): void
    {
        $contexts = $this->getAvailableContexts();
        
        $this->update([
            'available_contexts' => $contexts,
            'is_multi_role' => count($contexts) > 1,
            'current_context' => $this->current_context ?? ($contexts[0] ?? null),
        ]);
    }

    /**
     * Switch to a specific context
     */
    public function switchContext(string $context): bool
    {
        $availableContexts = $this->available_contexts ?? $this->getAvailableContexts();
        
        if (!in_array($context, $availableContexts)) {
            return false;
        }
        
        $this->current_context = $context;
        return $this->save();
    }

    /**
     * Get current active context
     */
    public function getCurrentContext(): ?string
    {
        return $this->current_context;
    }

    /**
     * Check if user is currently in artist context
     */
    public function isInArtistContext(): bool
    {
        return $this->current_context === 'artist' || 
               (!$this->current_context && $this->artist);
    }

    /**
     * Check if user is currently in agent context
     */
    public function isInAgentContext(): bool
    {
        return $this->current_context === 'agent';
    }

    /**
     * Check if user is currently in team member context
     */
    public function isInTeamMemberContext(): bool
    {
        return $this->current_context === 'team_member';
    }

    /**
     * Get the current active artist based on context
     */
    public function getCurrentArtist(): ?Artist
    {
        if ($this->isInArtistContext() && $this->artist) {
            return $this->artist;
        }
        
        if ($this->isInAgentContext() || $this->isInTeamMemberContext()) {
            $membership = $this->activeTeamMemberships()
                ->when($this->isInAgentContext(), function ($query) {
                    return $query->where('role', 'agent')->where('is_primary', true);
                })
                ->first();
                
            return $membership?->artist;
        }
        
        return null;
    }

    /**
     * Get user's role in current context
     */
    public function getCurrentRole(): ?string
    {
        if ($this->isInArtistContext()) {
            return 'artist';
        }
        
        if ($this->isInAgentContext()) {
            return 'agent';
        }
        
        if ($this->isInTeamMemberContext()) {
            $membership = $this->activeTeamMemberships()->first();
            return $membership?->role;
        }
        
        return null;
    }

    /**
     * Get permissions for current context
     */
    public function getCurrentPermissions(): array
    {
        if ($this->isInArtistContext()) {
            return [
                'manage_team' => true,
                'manage_bookings' => true,
                'access_financials' => true,
                'invite_members' => true,
                'create_threads' => true,
            ];
        }
        
        if ($this->isInAgentContext()) {
            return [
                'manage_team' => true,
                'manage_bookings' => true,
                'access_financials' => true,
                'invite_members' => true,
                'create_threads' => true,
            ];
        }
        
        if ($this->isInTeamMemberContext()) {
            $membership = $this->activeTeamMemberships()->first();
            if (!$membership) return [];
            
            return [
                'manage_team' => $membership->can_invite_others,
                'manage_bookings' => $membership->can_manage_bookings,
                'access_financials' => $membership->can_access_financials,
                'invite_members' => $membership->can_invite_others,
                'create_threads' => $membership->can_invite_others,
            ];
        }
        
        return [];
    }

    /**
     * Check if user has a specific permission in current context
     */
    public function hasPermission(string $permission): bool
    {
        $permissions = $this->getCurrentPermissions();
        return $permissions[$permission] ?? false;
    }
}