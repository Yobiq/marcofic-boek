<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRolePermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $permission = null): Response
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        // If no specific permission is required, just check if user has a valid context
        if (!$permission) {
            if (!$user->getCurrentContext()) {
                return response()->json([
                    'error' => 'No active context. Please select a role.',
                    'available_contexts' => $user->getAvailableContexts(),
                ], 400);
            }
            return $next($request);
        }

        // Check if user has the required permission in their current context
        if (!$user->hasPermission($permission)) {
            return response()->json([
                'error' => 'Insufficient permissions for this action',
                'required_permission' => $permission,
                'current_context' => $user->getCurrentContext(),
                'current_permissions' => $user->getCurrentPermissions(),
            ], 403);
        }

        return $next($request);
    }
}