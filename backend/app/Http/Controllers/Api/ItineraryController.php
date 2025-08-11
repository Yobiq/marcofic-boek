<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class ItineraryController extends Controller
{
    public function bookingItinerary(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $artist = $user->artist;

        if (!$artist) {
            return response()->json(['error' => 'Artist profile not found'], 404);
        }

        // Check if booking belongs to artist
        $booking = Booking::where('artist_id', $artist->id)
            ->where('id', $id)
            ->with(['venue', 'stage'])
            ->first();

        if (!$booking) {
            return response()->json(['error' => 'Booking not found'], 404);
        }

        // Generate sample itinerary items based on booking
        $eventDate = Carbon::parse($booking->event_date);
        $items = [];

        // Flight to destination (day before event)
        $flightDate = $eventDate->copy()->subDay();
        $items[] = [
            'id' => 1,
            'type' => 'flight',
            'start_time' => $flightDate->setTime(14, 30)->toISOString(),
            'end_time' => $flightDate->setTime(18, 45)->toISOString(),
            'timezone' => $booking->venue->time_zone ?? 'UTC',
            'location' => 'Airport',
            'notes' => 'Departure flight to venue city',
            'checked_in' => false,
            'content' => [
                'airline' => 'KLM Royal Dutch Airlines',
                'flight_no' => 'KL1234',
                'from' => 'Amsterdam (AMS)',
                'to' => ($booking->venue->city ?? 'Destination') . ' Airport',
                'seat' => '12A',
                'confirmation' => 'ABC123'
            ]
        ];

        // Hotel check-in (day before event)
        $items[] = [
            'id' => 2,
            'type' => 'hotel',
            'start_time' => $flightDate->setTime(20, 0)->toISOString(),
            'end_time' => $eventDate->copy()->addDay()->setTime(12, 0)->toISOString(),
            'timezone' => $booking->venue->time_zone ?? 'UTC',
            'location' => $booking->venue->city ?? 'Hotel Location',
            'notes' => 'Accommodation near venue',
            'checked_in' => false,
            'content' => [
                'hotel' => 'Grand Hotel ' . ($booking->venue->city ?? 'Central'),
                'address' => '123 Main Street, ' . ($booking->venue->city ?? 'City Center'),
                'check_in' => $flightDate->setTime(20, 0)->toISOString(),
                'check_out' => $eventDate->copy()->addDay()->setTime(12, 0)->toISOString(),
                'room' => '512',
                'confirmation' => 'HTL789'
            ]
        ];

        // Transport to venue (event day)
        $items[] = [
            'id' => 3,
            'type' => 'transport',
            'start_time' => $eventDate->setTime(16, 0)->toISOString(),
            'end_time' => $eventDate->setTime(16, 30)->toISOString(),
            'timezone' => $booking->venue->time_zone ?? 'UTC',
            'location' => 'Hotel to ' . ($booking->venue->name ?? 'Venue'),
            'notes' => 'Private transport to venue',
            'checked_in' => false,
            'content' => [
                'type' => 'Private Car',
                'from' => 'Hotel',
                'to' => $booking->venue->name ?? 'Event Venue',
                'driver' => 'John Smith',
                'contact' => '+31 6 1234 5678',
                'license' => 'AB-123-CD'
            ]
        ];

        // Sound check (event day)
        $items[] = [
            'id' => 4,
            'type' => 'schedule',
            'start_time' => $eventDate->setTime(17, 0)->toISOString(),
            'end_time' => $eventDate->setTime(18, 0)->toISOString(),
            'timezone' => $booking->venue->time_zone ?? 'UTC',
            'location' => $booking->venue->name ?? 'Main Stage',
            'notes' => 'Technical sound check and equipment setup',
            'checked_in' => false,
            'content' => [
                'activity' => 'Sound Check',
                'stage' => $booking->stage->name ?? 'Main Stage',
                'contact' => 'Technical Manager',
                'equipment' => 'CDJ-2000NXS2, DJM-900NXS2',
                'duration' => '60 minutes'
            ]
        ];

        // Performance (event day)
        $items[] = [
            'id' => 5,
            'type' => 'schedule',
            'start_time' => $eventDate->setTime(22, 0)->toISOString(),
            'end_time' => $eventDate->setTime(23, 30)->toISOString(),
            'timezone' => $booking->venue->time_zone ?? 'UTC',
            'location' => $booking->venue->name ?? 'Main Stage',
            'notes' => 'Main performance set',
            'checked_in' => false,
            'content' => [
                'activity' => 'Live Performance',
                'stage' => $booking->stage->name ?? 'Main Stage',
                'set_duration' => '90 minutes',
                'genre' => 'Electronic/House',
                'expected_audience' => $booking->stage->capacity ?? 1000
            ]
        ];

        // Return flight (day after event)
        $returnDate = $eventDate->copy()->addDay();
        $items[] = [
            'id' => 6,
            'type' => 'flight',
            'start_time' => $returnDate->setTime(10, 15)->toISOString(),
            'end_time' => $returnDate->setTime(14, 30)->toISOString(),
            'timezone' => $booking->venue->time_zone ?? 'UTC',
            'location' => 'Airport',
            'notes' => 'Return flight home',
            'checked_in' => false,
            'content' => [
                'airline' => 'KLM Royal Dutch Airlines',
                'flight_no' => 'KL5678',
                'from' => ($booking->venue->city ?? 'Destination') . ' Airport',
                'to' => 'Amsterdam (AMS)',
                'seat' => '15C',
                'confirmation' => 'DEF456'
            ]
        ];

        return response()->json($items);
    }

    public function tourItinerary(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $artist = $user->artist;

        if (!$artist) {
            return response()->json(['error' => 'Artist profile not found'], 404);
        }

        // For now, return sample tour itinerary
        // In a real implementation, this would fetch from a tours table
        $items = [
            [
                'id' => 101,
                'type' => 'flight',
                'start_time' => now()->addDays(1)->setTime(9, 0)->toISOString(),
                'end_time' => now()->addDays(1)->setTime(12, 0)->toISOString(),
                'timezone' => 'Europe/Amsterdam',
                'location' => 'Amsterdam Airport',
                'notes' => 'Tour opening flight to Berlin',
                'checked_in' => false,
                'content' => [
                    'airline' => 'KLM',
                    'flight_no' => 'KL1801',
                    'from' => 'Amsterdam (AMS)',
                    'to' => 'Berlin (BER)'
                ]
            ],
            [
                'id' => 102,
                'type' => 'schedule',
                'start_time' => now()->addDays(1)->setTime(21, 0)->toISOString(),
                'end_time' => now()->addDays(1)->setTime(23, 0)->toISOString(),
                'timezone' => 'Europe/Berlin',
                'location' => 'Berghain, Berlin',
                'notes' => 'Opening night of European tour',
                'checked_in' => false,
                'content' => [
                    'activity' => 'Live Performance',
                    'venue' => 'Berghain',
                    'set_duration' => '120 minutes'
                ]
            ]
        ];

        return response()->json($items);
    }

    public function checkIn(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $artist = $user->artist;

        if (!$artist) {
            return response()->json(['error' => 'Artist profile not found'], 404);
        }

        // For now, just return success
        // In a real implementation, this would update the database
        return response()->json([
            'message' => 'Successfully checked in',
            'item_id' => $id,
            'checked_in' => true,
            'checked_in_at' => now()->toISOString()
        ]);
    }

    public function shareJson(Request $request, $token): JsonResponse
    {
        // TODO: Implement shared itinerary JSON with token validation
        return response()->json([
            'message' => 'Shared itinerary access',
            'token' => $token,
            'data' => [
                'shared_at' => now()->toISOString(),
                'expires_at' => now()->addDays(7)->toISOString()
            ]
        ]);
    }

    public function sharePdf(Request $request, $token)
    {
        // TODO: Implement shared itinerary PDF generation
        return response()->json([
            'message' => 'PDF generation not yet implemented',
            'token' => $token
        ]);
    }
}