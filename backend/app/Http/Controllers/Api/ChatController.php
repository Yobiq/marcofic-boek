<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChatThread;
use App\Models\ChatMessage;
use App\Models\ArtistTeamMember;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class ChatController extends Controller
{
    public function threads(Request $request): JsonResponse
    {
        $user = $request->user();
        $artist = $user->artist;

        if (!$artist) {
            return response()->json(['error' => 'Artist profile not found'], 404);
        }

        // Generate sample chat threads for the artist
        $threads = [
            [
                'id' => 1,
                'name' => 'Tour Management Team',
                'lastMessage' => 'Flight confirmation for Berlin show has been updated. Please check your itinerary.',
                'lastMessageAt' => now()->subMinutes(15)->toISOString(),
                'unreadCount' => 3,
                'participants' => [
                    ['id' => 1, 'name' => 'Sarah Johnson', 'role' => 'Tour Manager'],
                    ['id' => 2, 'name' => 'Mike Chen', 'role' => 'Booking Agent'],
                    ['id' => 3, 'name' => $artist->name ?? 'Jane Doe', 'role' => 'Artist'],
                    ['id' => 4, 'name' => 'Alex Rodriguez', 'role' => 'Sound Engineer'],
                ]
            ],
            [
                'id' => 2,
                'name' => 'Berlin Venue Team',
                'lastMessage' => 'Sound check is scheduled for 5 PM. Technical rider has been reviewed.',
                'lastMessageAt' => now()->subHours(2)->toISOString(),
                'unreadCount' => 1,
                'participants' => [
                    ['id' => 5, 'name' => 'Klaus Weber', 'role' => 'Venue Manager'],
                    ['id' => 6, 'name' => 'Emma Fischer', 'role' => 'Technical Director'],
                    ['id' => 3, 'name' => $artist->name ?? 'Jane Doe', 'role' => 'Artist'],
                ]
            ],
            [
                'id' => 3,
                'name' => 'Agency Communication',
                'lastMessage' => 'Contract amendments for the Amsterdam show have been finalized.',
                'lastMessageAt' => now()->subHours(4)->toISOString(),
                'unreadCount' => 0,
                'participants' => [
                    ['id' => 7, 'name' => 'David Park', 'role' => 'Agent'],
                    ['id' => 8, 'name' => 'Lisa Thompson', 'role' => 'Legal'],
                    ['id' => 3, 'name' => $artist->name ?? 'Jane Doe', 'role' => 'Artist'],
                ]
            ],
            [
                'id' => 4,
                'name' => 'Production Team',
                'lastMessage' => 'Equipment list updated. CDJ-3000s confirmed for all venues.',
                'lastMessageAt' => now()->subDays(1)->toISOString(),
                'unreadCount' => 0,
                'participants' => [
                    ['id' => 9, 'name' => 'Tom Wilson', 'role' => 'Production Manager'],
                    ['id' => 10, 'name' => 'Rachel Green', 'role' => 'Stage Manager'],
                    ['id' => 4, 'name' => 'Alex Rodriguez', 'role' => 'Sound Engineer'],
                    ['id' => 3, 'name' => $artist->name ?? 'Jane Doe', 'role' => 'Artist'],
                ]
            ],
            [
                'id' => 5,
                'name' => 'Media & PR',
                'lastMessage' => 'Interview schedule for next week is ready. Please review and confirm.',
                'lastMessageAt' => now()->subDays(2)->toISOString(),
                'unreadCount' => 2,
                'participants' => [
                    ['id' => 11, 'name' => 'Jennifer Adams', 'role' => 'PR Manager'],
                    ['id' => 12, 'name' => 'Mark Roberts', 'role' => 'Media Coordinator'],
                    ['id' => 3, 'name' => $artist->name ?? 'Jane Doe', 'role' => 'Artist'],
                ]
            ],
            [
                'id' => 6,
                'name' => 'Travel Coordination',
                'lastMessage' => 'Hotel bookings confirmed for all tour dates. Details in your itinerary.',
                'lastMessageAt' => now()->subDays(3)->toISOString(),
                'unreadCount' => 0,
                'participants' => [
                    ['id' => 13, 'name' => 'Sophie Martinez', 'role' => 'Travel Coordinator'],
                    ['id' => 1, 'name' => 'Sarah Johnson', 'role' => 'Tour Manager'],
                    ['id' => 3, 'name' => $artist->name ?? 'Jane Doe', 'role' => 'Artist'],
                ]
            ]
        ];

        return response()->json($threads);
    }

    public function messages(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $artist = $user->artist;

        if (!$artist) {
            return response()->json(['error' => 'Artist profile not found'], 404);
        }

        $page = $request->get('page', 1);
        $perPage = 20;

        // Generate sample messages based on thread ID
        $messages = $this->generateSampleMessages($id, $artist->name ?? 'Jane Doe');

        // Simulate pagination
        $offset = ($page - 1) * $perPage;
        $paginatedMessages = array_slice($messages, $offset, $perPage);

        return response()->json([
            'data' => $paginatedMessages,
            'hasMore' => count($messages) > ($offset + $perPage),
            'currentPage' => $page,
            'totalMessages' => count($messages)
        ]);
    }

    public function sendMessage(Request $request): JsonResponse
    {
        $user = $request->user();
        $artist = $user->artist;

        if (!$artist) {
            return response()->json(['error' => 'Artist profile not found'], 404);
        }

        $request->validate([
            'thread_id' => 'required|integer',
            'content' => 'required|string|max:2000',
        ]);

        // In a real implementation, this would save to database and broadcast via WebSocket
        $message = [
            'id' => rand(1000, 9999),
            'thread_id' => $request->thread_id,
            'user_id' => $user->id,
            'content' => $request->content,
            'created_at' => now()->toISOString(),
            'user' => [
                'id' => $user->id,
                'name' => $artist->name ?? $user->name,
                'avatar' => $artist->avatar ?? null,
            ]
        ];

        return response()->json([
            'message' => 'Message sent successfully',
            'data' => $message
        ]);
    }

    private function generateSampleMessages($threadId, $artistName): array
    {
        $baseTime = now()->subDays(7);
        
        switch ($threadId) {
            case 1: // Tour Management Team
                return [
                    [
                        'id' => 1,
                        'thread_id' => 1,
                        'user_id' => 1,
                        'content' => 'Good morning team! Berlin show is confirmed for next Friday. All logistics are in place.',
                        'created_at' => $baseTime->copy()->addDays(1)->toISOString(),
                        'user' => ['id' => 1, 'name' => 'Sarah Johnson', 'avatar' => null]
                    ],
                    [
                        'id' => 2,
                        'thread_id' => 1,
                        'user_id' => 2,
                        'content' => 'Great! The venue capacity is 2,500. Ticket sales are at 85% already.',
                        'created_at' => $baseTime->copy()->addDays(1)->addMinutes(15)->toISOString(),
                        'user' => ['id' => 2, 'name' => 'Mike Chen', 'avatar' => null]
                    ],
                    [
                        'id' => 3,
                        'thread_id' => 1,
                        'user_id' => 3,
                        'content' => 'Awesome! What time is the sound check scheduled?',
                        'created_at' => $baseTime->copy()->addDays(1)->addMinutes(30)->toISOString(),
                        'user' => ['id' => 3, 'name' => $artistName, 'avatar' => null]
                    ],
                    [
                        'id' => 4,
                        'thread_id' => 1,
                        'user_id' => 4,
                        'content' => 'Sound check is at 5 PM. I\'ll have all your preferred equipment ready.',
                        'created_at' => $baseTime->copy()->addDays(1)->addMinutes(45)->toISOString(),
                        'user' => ['id' => 4, 'name' => 'Alex Rodriguez', 'avatar' => null]
                    ],
                    [
                        'id' => 5,
                        'thread_id' => 1,
                        'user_id' => 1,
                        'content' => 'Flight confirmation for Berlin show has been updated. Please check your itinerary.',
                        'created_at' => now()->subMinutes(15)->toISOString(),
                        'user' => ['id' => 1, 'name' => 'Sarah Johnson', 'avatar' => null]
                    ],
                ];

            case 2: // Berlin Venue Team
                return [
                    [
                        'id' => 6,
                        'thread_id' => 2,
                        'user_id' => 5,
                        'content' => 'Welcome to Berlin! We\'re excited to have you perform at our venue.',
                        'created_at' => $baseTime->copy()->addDays(2)->toISOString(),
                        'user' => ['id' => 5, 'name' => 'Klaus Weber', 'avatar' => null]
                    ],
                    [
                        'id' => 7,
                        'thread_id' => 2,
                        'user_id' => 6,
                        'content' => 'Technical rider has been reviewed. Everything looks good on our end.',
                        'created_at' => $baseTime->copy()->addDays(2)->addMinutes(20)->toISOString(),
                        'user' => ['id' => 6, 'name' => 'Emma Fischer', 'avatar' => null]
                    ],
                    [
                        'id' => 8,
                        'thread_id' => 2,
                        'user_id' => 3,
                        'content' => 'Thank you! Looking forward to the show. Any specific requirements from your side?',
                        'created_at' => $baseTime->copy()->addDays(2)->addMinutes(35)->toISOString(),
                        'user' => ['id' => 3, 'name' => $artistName, 'avatar' => null]
                    ],
                    [
                        'id' => 9,
                        'thread_id' => 2,
                        'user_id' => 5,
                        'content' => 'Sound check is scheduled for 5 PM. Technical rider has been reviewed.',
                        'created_at' => now()->subHours(2)->toISOString(),
                        'user' => ['id' => 5, 'name' => 'Klaus Weber', 'avatar' => null]
                    ],
                ];

            case 3: // Agency Communication
                return [
                    [
                        'id' => 10,
                        'thread_id' => 3,
                        'user_id' => 7,
                        'content' => 'Amsterdam contract is ready for review. Please check the performance fee and technical requirements.',
                        'created_at' => $baseTime->copy()->addDays(3)->toISOString(),
                        'user' => ['id' => 7, 'name' => 'David Park', 'avatar' => null]
                    ],
                    [
                        'id' => 11,
                        'thread_id' => 3,
                        'user_id' => 8,
                        'content' => 'Legal review completed. Minor amendments suggested for the cancellation clause.',
                        'created_at' => $baseTime->copy()->addDays(3)->addMinutes(30)->toISOString(),
                        'user' => ['id' => 8, 'name' => 'Lisa Thompson', 'avatar' => null]
                    ],
                    [
                        'id' => 12,
                        'thread_id' => 3,
                        'user_id' => 7,
                        'content' => 'Contract amendments for the Amsterdam show have been finalized.',
                        'created_at' => now()->subHours(4)->toISOString(),
                        'user' => ['id' => 7, 'name' => 'David Park', 'avatar' => null]
                    ],
                ];

            case 4: // Production Team
                return [
                    [
                        'id' => 13,
                        'thread_id' => 4,
                        'user_id' => 9,
                        'content' => 'Production meeting scheduled for tomorrow. We\'ll discuss the full tour setup.',
                        'created_at' => $baseTime->copy()->addDays(4)->toISOString(),
                        'user' => ['id' => 9, 'name' => 'Tom Wilson', 'avatar' => null]
                    ],
                    [
                        'id' => 14,
                        'thread_id' => 4,
                        'user_id' => 10,
                        'content' => 'Stage design mockups are ready. The LED wall will be spectacular!',
                        'created_at' => $baseTime->copy()->addDays(4)->addMinutes(25)->toISOString(),
                        'user' => ['id' => 10, 'name' => 'Rachel Green', 'avatar' => null]
                    ],
                    [
                        'id' => 15,
                        'thread_id' => 4,
                        'user_id' => 4,
                        'content' => 'Equipment list updated. CDJ-3000s confirmed for all venues.',
                        'created_at' => now()->subDays(1)->toISOString(),
                        'user' => ['id' => 4, 'name' => 'Alex Rodriguez', 'avatar' => null]
                    ],
                ];

            case 5: // Media & PR
                return [
                    [
                        'id' => 16,
                        'thread_id' => 5,
                        'user_id' => 11,
                        'content' => 'PR campaign for the tour is gaining traction. Social media engagement is up 200%!',
                        'created_at' => $baseTime->copy()->addDays(5)->toISOString(),
                        'user' => ['id' => 11, 'name' => 'Jennifer Adams', 'avatar' => null]
                    ],
                    [
                        'id' => 17,
                        'thread_id' => 5,
                        'user_id' => 12,
                        'content' => 'Radio interviews scheduled for next week. Times and details in the media calendar.',
                        'created_at' => $baseTime->copy()->addDays(5)->addMinutes(40)->toISOString(),
                        'user' => ['id' => 12, 'name' => 'Mark Roberts', 'avatar' => null]
                    ],
                    [
                        'id' => 18,
                        'thread_id' => 5,
                        'user_id' => 11,
                        'content' => 'Interview schedule for next week is ready. Please review and confirm.',
                        'created_at' => now()->subDays(2)->toISOString(),
                        'user' => ['id' => 11, 'name' => 'Jennifer Adams', 'avatar' => null]
                    ],
                ];

            case 6: // Travel Coordination
                return [
                    [
                        'id' => 19,
                        'thread_id' => 6,
                        'user_id' => 13,
                        'content' => 'All flights booked for the European leg. E-tickets sent to your email.',
                        'created_at' => $baseTime->copy()->addDays(6)->toISOString(),
                        'user' => ['id' => 13, 'name' => 'Sophie Martinez', 'avatar' => null]
                    ],
                    [
                        'id' => 20,
                        'thread_id' => 6,
                        'user_id' => 1,
                        'content' => 'Ground transportation arranged for all venues. Drivers will have your contact info.',
                        'created_at' => $baseTime->copy()->addDays(6)->addMinutes(15)->toISOString(),
                        'user' => ['id' => 1, 'name' => 'Sarah Johnson', 'avatar' => null]
                    ],
                    [
                        'id' => 21,
                        'thread_id' => 6,
                        'user_id' => 13,
                        'content' => 'Hotel bookings confirmed for all tour dates. Details in your itinerary.',
                        'created_at' => now()->subDays(3)->toISOString(),
                        'user' => ['id' => 13, 'name' => 'Sophie Martinez', 'avatar' => null]
                    ],
                ];

            default:
                return [];
        }
    }
}