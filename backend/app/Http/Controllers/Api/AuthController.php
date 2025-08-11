<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
            'context' => 'sometimes|string|in:artist,agent,team_member,venue,promoter',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Update available contexts
        $user->updateAvailableContexts();
        
        // Set context if provided and valid
        if ($request->has('context')) {
            if (!$user->switchContext($request->context)) {
                return response()->json([
                    'error' => 'Invalid context for this user',
                    'available_contexts' => $user->getAvailableContexts(),
                ], 400);
            }
        }

        // Create token for mobile app
        $token = $user->createToken('mobile-app')->plainTextToken;
        $currentArtist = $user->getCurrentArtist();

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'current_context' => $user->getCurrentContext(),
                'available_contexts' => $user->available_contexts ?? [],
                'is_multi_role' => $user->is_multi_role,
                'current_role' => $user->getCurrentRole(),
                'permissions' => $user->getCurrentPermissions(),
                'artist' => $currentArtist ? [
                    'id' => $currentArtist->id,
                    'name' => $currentArtist->name,
                    'bio' => $currentArtist->bio,
                    'avatar' => $currentArtist->avatar,
                ] : null,
            ]
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        $currentArtist = $user->getCurrentArtist();
        
        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'current_context' => $user->getCurrentContext(),
            'available_contexts' => $user->available_contexts ?? [],
            'is_multi_role' => $user->is_multi_role,
            'current_role' => $user->getCurrentRole(),
            'permissions' => $user->getCurrentPermissions(),
            'artist' => $currentArtist ? [
                'id' => $currentArtist->id,
                'name' => $currentArtist->name,
                'bio' => $currentArtist->bio,
                'avatar' => $currentArtist->avatar,
            ] : null,
        ]);
    }

    public function refresh(Request $request)
    {
        $user = $request->user();
        
        // Revoke current token
        $request->user()->currentAccessToken()->delete();
        
        // Create new token
        $token = $user->createToken('mobile-app')->plainTextToken;
        $currentArtist = $user->getCurrentArtist();

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'current_context' => $user->getCurrentContext(),
                'available_contexts' => $user->available_contexts ?? [],
                'is_multi_role' => $user->is_multi_role,
                'current_role' => $user->getCurrentRole(),
                'permissions' => $user->getCurrentPermissions(),
                'artist' => $currentArtist ? [
                    'id' => $currentArtist->id,
                    'name' => $currentArtist->name,
                    'bio' => $currentArtist->bio,
                    'avatar' => $currentArtist->avatar,
                ] : null,
            ],
        ]);
    }

    public function switchContext(Request $request)
    {
        $request->validate([
            'context' => 'required|string|in:artist,agent,team_member,venue,promoter',
        ]);

        $user = $request->user();
        
        if (!$user->switchContext($request->context)) {
            return response()->json([
                'error' => 'Invalid context for this user',
                'available_contexts' => $user->getAvailableContexts(),
            ], 400);
        }

        $currentArtist = $user->getCurrentArtist();

        return response()->json([
            'message' => 'Context switched successfully',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'current_context' => $user->getCurrentContext(),
                'available_contexts' => $user->available_contexts ?? [],
                'is_multi_role' => $user->is_multi_role,
                'current_role' => $user->getCurrentRole(),
                'permissions' => $user->getCurrentPermissions(),
                'artist' => $currentArtist ? [
                    'id' => $currentArtist->id,
                    'name' => $currentArtist->name,
                    'bio' => $currentArtist->bio,
                    'avatar' => $currentArtist->avatar,
                ] : null,
            ]
        ]);
    }

    public function getAvailableContexts(Request $request)
    {
        $user = $request->user();
        $user->updateAvailableContexts();

        return response()->json([
            'available_contexts' => $user->available_contexts ?? [],
            'current_context' => $user->getCurrentContext(),
            'is_multi_role' => $user->is_multi_role,
        ]);
    }
}
