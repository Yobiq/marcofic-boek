<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TeamInvitation;
use App\Models\ArtistTeamMember;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;

class TeamController extends Controller
{
    public function getTeamMembers(Request $request): JsonResponse
    {
        $user = $request->user();
        $artist = $user->artist;

        if (!$artist) {
            return response()->json(['error' => 'Artist profile not found'], 404);
        }

        $teamMembers = $artist->activeTeamMembers()
            ->with('user')
            ->get()
            ->map(function ($member) {
                return [
                    'id' => $member->id,
                    'name' => $member->name,
                    'email' => $member->email,
                    'phone' => $member->phone,
                    'role' => $member->role,
                    'role_display' => $member->getRoleDisplayName(),
                    'custom_role' => $member->custom_role,
                    'is_primary' => $member->is_primary,
                    'can_invite_others' => $member->can_invite_others,
                    'can_manage_bookings' => $member->can_manage_bookings,
                    'can_access_financials' => $member->can_access_financials,
                    'permissions' => $member->permissions ?? [],
                    'joined_at' => $member->joined_at?->toISOString(),
                    'is_registered_user' => !is_null($member->user_id),
                    'avatar' => $member->user?->artist?->avatar,
                ];
            });

        return response()->json([
            'team_members' => $teamMembers,
            'total_count' => $teamMembers->count(),
        ]);
    }

    public function inviteTeamMember(Request $request): JsonResponse
    {
        $user = $request->user();
        $artist = $user->artist;

        if (!$artist) {
            return response()->json(['error' => 'Artist profile not found'], 404);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'role' => [
                'required',
                Rule::in([
                    'tour_manager', 'booking_agent', 'sound_engineer', 'venue_manager',
                    'technical_director', 'agent', 'legal', 'production_manager',
                    'stage_manager', 'pr_manager', 'media_coordinator', 'travel_coordinator', 'custom'
                ])
            ],
            'custom_role' => 'nullable|string|max:255',
            'message' => 'nullable|string|max:1000',
        ]);

        // Check if user is already a team member
        $existingMember = $artist->teamMembers()
            ->where('email', $request->email)
            ->where('is_active', true)
            ->first();

        if ($existingMember) {
            return response()->json(['error' => 'This person is already a team member'], 400);
        }

        // Check for pending invitation
        $existingInvitation = $artist->teamInvitations()
            ->where('email', $request->email)
            ->where('status', 'pending')
            ->first();

        if ($existingInvitation && !$existingInvitation->isExpired()) {
            return response()->json(['error' => 'An invitation has already been sent to this email'], 400);
        }

        // Create invitation
        $invitation = TeamInvitation::create([
            'artist_id' => $artist->id,
            'email' => $request->email,
            'name' => $request->name,
            'role' => $request->role,
            'custom_role' => $request->custom_role,
            'message' => $request->message,
        ]);

        // TODO: Send invitation email
        // Mail::to($request->email)->send(new TeamInvitationMail($invitation));

        return response()->json([
            'message' => 'Team member invitation sent successfully',
            'invitation' => [
                'id' => $invitation->id,
                'name' => $invitation->name,
                'email' => $invitation->email,
                'role' => $invitation->getRoleDisplayName(),
                'status' => $invitation->status,
                'expires_at' => $invitation->expires_at->toISOString(),
            ]
        ]);
    }

    public function getPendingInvitations(Request $request): JsonResponse
    {
        $user = $request->user();
        $artist = $user->artist;

        if (!$artist) {
            return response()->json(['error' => 'Artist profile not found'], 404);
        }

        $invitations = $artist->pendingInvitations()
            ->where('expires_at', '>', now())
            ->get()
            ->map(function ($invitation) {
                return [
                    'id' => $invitation->id,
                    'name' => $invitation->name,
                    'email' => $invitation->email,
                    'role' => $invitation->getRoleDisplayName(),
                    'status' => $invitation->status,
                    'expires_at' => $invitation->expires_at->toISOString(),
                    'created_at' => $invitation->created_at->toISOString(),
                ];
            });

        return response()->json([
            'invitations' => $invitations,
            'total_count' => $invitations->count(),
        ]);
    }

    public function acceptInvitation(Request $request, $token): JsonResponse
    {
        $invitation = TeamInvitation::where('invitation_token', $token)
            ->where('status', 'pending')
            ->first();

        if (!$invitation || $invitation->isExpired()) {
            return response()->json(['error' => 'Invalid or expired invitation'], 404);
        }

        $user = $request->user();
        
        // Create team member record
        $teamMember = ArtistTeamMember::create([
            'artist_id' => $invitation->artist_id,
            'user_id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $invitation->role,
            'custom_role' => $invitation->custom_role,
            'joined_at' => now(),
        ]);

        // Update invitation status
        $invitation->update(['status' => 'accepted']);

        return response()->json([
            'message' => 'Invitation accepted successfully',
            'team_member' => [
                'id' => $teamMember->id,
                'name' => $teamMember->name,
                'role' => $teamMember->getRoleDisplayName(),
                'artist' => $invitation->artist->name,
            ]
        ]);
    }

    public function updateTeamMember(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $artist = $user->artist;

        if (!$artist) {
            return response()->json(['error' => 'Artist profile not found'], 404);
        }

        $teamMember = $artist->teamMembers()->findOrFail($id);

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255',
            'phone' => 'nullable|string|max:255',
            'role' => [
                'sometimes',
                Rule::in([
                    'tour_manager', 'booking_agent', 'sound_engineer', 'venue_manager',
                    'technical_director', 'agent', 'legal', 'production_manager',
                    'stage_manager', 'pr_manager', 'media_coordinator', 'travel_coordinator', 'custom'
                ])
            ],
            'custom_role' => 'nullable|string|max:255',
            'is_primary' => 'sometimes|boolean',
            'can_invite_others' => 'sometimes|boolean',
            'can_manage_bookings' => 'sometimes|boolean',
            'can_access_financials' => 'sometimes|boolean',
        ]);

        $teamMember->update($request->only([
            'name', 'email', 'phone', 'role', 'custom_role', 'is_primary',
            'can_invite_others', 'can_manage_bookings', 'can_access_financials'
        ]));

        return response()->json([
            'message' => 'Team member updated successfully',
            'team_member' => [
                'id' => $teamMember->id,
                'name' => $teamMember->name,
                'email' => $teamMember->email,
                'role' => $teamMember->getRoleDisplayName(),
                'is_primary' => $teamMember->is_primary,
            ]
        ]);
    }

    public function removeTeamMember(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $artist = $user->artist;

        if (!$artist) {
            return response()->json(['error' => 'Artist profile not found'], 404);
        }

        $teamMember = $artist->teamMembers()->findOrFail($id);

        // Don't allow removing themselves if they're the artist
        if ($teamMember->user_id === $user->id && $teamMember->role === 'agent' && $teamMember->is_primary) {
            return response()->json(['error' => 'Cannot remove yourself as the primary agent'], 400);
        }

        $teamMember->update(['is_active' => false]);

        return response()->json([
            'message' => 'Team member removed successfully'
        ]);
    }

    public function setAsOwnAgent(Request $request): JsonResponse
    {
        $user = $request->user();
        $artist = $user->artist;

        if (!$artist) {
            return response()->json(['error' => 'Artist profile not found'], 404);
        }

        // Check if artist is already their own agent
        if ($artist->isOwnAgent()) {
            return response()->json(['message' => 'You are already set as your own agent']);
        }

        // Create team member record for artist as their own agent
        $teamMember = ArtistTeamMember::create([
            'artist_id' => $artist->id,
            'user_id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => 'agent',
            'is_primary' => true,
            'can_invite_others' => true,
            'can_manage_bookings' => true,
            'can_access_financials' => true,
            'joined_at' => now(),
        ]);

        return response()->json([
            'message' => 'You are now set as your own agent',
            'team_member' => [
                'id' => $teamMember->id,
                'name' => $teamMember->name,
                'role' => $teamMember->getRoleDisplayName(),
                'is_primary' => true,
            ]
        ]);
    }

    public function getAvailableRoles(Request $request): JsonResponse
    {
        return response()->json([
            'roles' => [
                ['value' => 'agent', 'label' => 'Agent'],
                ['value' => 'tour_manager', 'label' => 'Tour Manager'],
                ['value' => 'booking_agent', 'label' => 'Booking Agent'],
                ['value' => 'sound_engineer', 'label' => 'Sound Engineer'],
                ['value' => 'venue_manager', 'label' => 'Venue Manager'],
                ['value' => 'technical_director', 'label' => 'Technical Director'],
                ['value' => 'legal', 'label' => 'Legal'],
                ['value' => 'production_manager', 'label' => 'Production Manager'],
                ['value' => 'stage_manager', 'label' => 'Stage Manager'],
                ['value' => 'pr_manager', 'label' => 'PR Manager'],
                ['value' => 'media_coordinator', 'label' => 'Media Coordinator'],
                ['value' => 'travel_coordinator', 'label' => 'Travel Coordinator'],
                ['value' => 'custom', 'label' => 'Custom Role'],
            ]
        ]);
    }
}