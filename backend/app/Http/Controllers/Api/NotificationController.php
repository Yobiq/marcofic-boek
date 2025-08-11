<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $artist = $user->getCurrentArtist();

        if (!$artist) {
            return response()->json(['error' => 'Artist profile not found'], 404);
        }

        // Generate sample notifications for demonstration
        $sampleNotifications = [
            [
                'id' => 1,
                'type' => 'booking.updated',
                'title' => 'Booking Confirmed',
                'message' => 'Your booking for React Rocks Festival has been confirmed for July 16, 2025.',
                'data' => ['booking_id' => 1],
                'read_at' => null,
                'created_at' => now()->subHours(2)->toISOString(),
            ],
            [
                'id' => 2,
                'type' => 'chat.message',
                'title' => 'New Team Message',
                'message' => 'Sarah from venue management sent you a message about sound check timing.',
                'data' => ['thread_id' => 1],
                'read_at' => null,
                'created_at' => now()->subHours(4)->toISOString(),
            ],
            [
                'id' => 3,
                'type' => 'payment.received',
                'title' => 'Payment Received',
                'message' => 'Payment of $25,000 has been received for React Rocks After Party.',
                'data' => ['booking_id' => 2, 'amount' => 25000],
                'read_at' => now()->subDays(1)->toISOString(),
                'created_at' => now()->subDays(1)->toISOString(),
            ],
            [
                'id' => 4,
                'type' => 'contract.signed',
                'title' => 'Contract Signed',
                'message' => 'Performance contract for Summer Music Festival has been signed by all parties.',
                'data' => ['contract_id' => 3],
                'read_at' => null,
                'created_at' => now()->subDays(2)->toISOString(),
            ],
            [
                'id' => 5,
                'type' => 'itinerary.updated',
                'title' => 'Itinerary Updated',
                'message' => 'Your travel itinerary for the European tour has been updated with new flight times.',
                'data' => ['tour_id' => 1],
                'read_at' => now()->subDays(3)->toISOString(),
                'created_at' => now()->subDays(3)->toISOString(),
            ],
            [
                'id' => 6,
                'type' => 'team.invitation',
                'title' => 'Team Invitation',
                'message' => 'You have been invited to join the production team for upcoming shows.',
                'data' => ['invitation_id' => 1],
                'read_at' => null,
                'created_at' => now()->subDays(5)->toISOString(),
            ],
        ];

        // Sort by created_at descending (newest first)
        usort($sampleNotifications, function ($a, $b) {
            return strtotime($b['created_at']) - strtotime($a['created_at']);
        });

        return response()->json($sampleNotifications);
    }

    public function markAsRead(Request $request): JsonResponse
    {
        $user = $request->user();
        $artist = $user->getCurrentArtist();

        if (!$artist) {
            return response()->json(['error' => 'Artist profile not found'], 404);
        }

        $request->validate([
            'notification_ids' => 'required|array',
            'notification_ids.*' => 'integer',
        ]);

        // In a real implementation, you would update the notifications in the database
        // For now, we'll just return a success response
        $notificationIds = $request->input('notification_ids');
        
        return response()->json([
            'message' => 'Notifications marked as read successfully',
            'marked_count' => count($notificationIds),
            'notification_ids' => $notificationIds,
        ]);
    }
}
