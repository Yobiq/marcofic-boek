<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class ArtistController extends Controller
{
    public function profile(Request $request): JsonResponse
    {
        $user = $request->user();
        $artist = $user->artist;

        if (!$artist) {
            return response()->json(['error' => 'Artist profile not found'], 404);
        }

        return response()->json([
            'id' => $artist->id,
            'name' => $artist->name,
            'email' => $artist->email,
            'bio' => $artist->bio,
            'avatar' => $artist->avatar,
            'agency' => $artist->agency,
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();
        $artist = $user->artist;

        if (!$artist) {
            return response()->json(['error' => 'Artist profile not found'], 404);
        }

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'bio' => 'sometimes|string|max:1000',
        ]);

        $artist->update($request->only(['name', 'bio']));

        return response()->json([
            'message' => 'Profile updated successfully',
            'artist' => $artist->fresh(),
        ]);
    }

    public function uploadAvatar(Request $request): JsonResponse
    {
        $user = $request->user();
        $artist = $user->artist;

        if (!$artist) {
            return response()->json(['error' => 'Artist profile not found'], 404);
        }

        // Debug logging
        \Log::info('Avatar upload request received', [
            'user_id' => $user->id,
            'artist_id' => $artist->id,
            'has_file' => $request->hasFile('avatar'),
            'all_files' => $request->allFiles(),
            'content_type' => $request->header('Content-Type'),
        ]);

        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($request->hasFile('avatar')) {
            $file = $request->file('avatar');
            
            // Debug file information
            \Log::info('File details', [
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'size' => $file->getSize(),
                'extension' => $file->getClientOriginalExtension(),
            ]);
            
            $filename = 'avatar_' . $artist->id . '_' . time() . '.' . $file->getClientOriginalExtension();
            
            // Store the file in the public/avatars directory
            $path = $file->storeAs('avatars', $filename, 'public');
            
            // Update the artist's avatar path
            $artist->update([
                'avatar' => '/storage/' . $path,
            ]);

            \Log::info('Avatar uploaded successfully', [
                'filename' => $filename,
                'path' => $path,
                'full_url' => asset('storage/' . $path),
            ]);

            return response()->json([
                'message' => 'Avatar uploaded successfully',
                'avatar' => asset('storage/' . $path),
            ]);
        }

        \Log::warning('No file uploaded in avatar request');
        return response()->json(['error' => 'No file uploaded'], 400);
    }

    public function calendar(Request $request): JsonResponse
    {
        $user = $request->user();
        $artist = $user->artist;

        if (!$artist) {
            return response()->json(['error' => 'Artist profile not found'], 404);
        }

        $from = $request->get('from', now()->startOfMonth()->toDateString());
        $to = $request->get('to', now()->endOfMonth()->toDateString());

        $bookings = Booking::where('artist_id', $artist->id)
            ->whereBetween('event_date', [$from, $to])
            ->with(['venue', 'stage'])
            ->get()
            ->groupBy(function ($booking) {
                return Carbon::parse($booking->event_date)->toDateString();
            });

        $days = [];
        foreach ($bookings as $date => $dayBookings) {
            $days[] = [
                'date' => $date,
                'count' => $dayBookings->count(),
                'bookings' => $dayBookings->map(function ($booking) {
                    return [
                        'id' => $booking->id,
                        'bookingCode' => $booking->booking_code,
                        'title' => $booking->title,
                        'city' => $booking->venue?->city,
                        'status' => $booking->status,
                    ];
                })->toArray(),
            ];
        }

        return response()->json([
            'days' => $days,
        ]);
    }

    public function bookings(Request $request): JsonResponse
    {
        $user = $request->user();
        $artist = $user->getCurrentArtist();

        if (!$artist) {
            return response()->json(['error' => 'Artist profile not found'], 404);
        }

        $query = Booking::where('artist_id', $artist->id)
            ->with(['venue', 'stage']);

        if ($request->has('from')) {
            $query->where('event_date', '>=', $request->get('from'));
        }

        if ($request->has('to')) {
            $query->where('event_date', '<=', $request->get('to'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->get('status'));
        }

        $bookings = $query->orderBy('event_date', 'asc')->get();

        return response()->json([
            'bookings' => $bookings->map(function ($booking) {
                return [
                    'id' => $booking->id,
                    'bookingCode' => $booking->booking_code,
                    'title' => $booking->title,
                    'eventDate' => $booking->event_date,
                    'status' => $booking->status,
                    'isConfirmed' => $booking->is_confirmed,
                    'checkedIn' => $booking->checked_in,
                    'venue' => $booking->venue ? [
                        'name' => $booking->venue->name,
                        'address' => '123 Music Avenue, Entertainment District',
                        'city' => $booking->venue->city,
                        'country' => $booking->venue->country,
                        'timeZone' => $booking->venue->time_zone,
                        'contactPerson' => 'Sarah Johnson',
                        'contactPhone' => '+1-555-0123',
                        'contactEmail' => 'sarah@venue.com',
                        'showTime' => '8:00 PM',
                    ] : null,
                    'stage' => $booking->stage ? [
                        'name' => $booking->stage->name,
                        'capacity' => $booking->stage->capacity,
                        'stageSize' => '40ft x 24ft',
                    ] : null,
                    'financial' => [
                        'fee' => rand(15000, 50000),
                        'currency' => 'USD',
                        'paymentStatus' => rand(0, 1) ? 'Paid' : 'Pending',
                    ],
                    'contractsCount' => rand(1, 3),
                ];
            }),
        ]);
    }

    public function booking(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $artist = $user->getCurrentArtist();

        if (!$artist) {
            return response()->json(['error' => 'Artist profile not found'], 404);
        }

        $booking = Booking::where('artist_id', $artist->id)
            ->where('id', $id)
            ->with(['venue', 'stage'])
            ->first();

        if (!$booking) {
            return response()->json(['error' => 'Booking not found'], 404);
        }

        // Generate comprehensive sample data for demonstration
        $sampleContacts = [
            ['name' => 'Sarah Johnson', 'role' => 'Venue Manager', 'phone' => '+1-555-0123', 'email' => 'sarah@venue.com'],
            ['name' => 'Mike Chen', 'role' => 'Sound Engineer', 'phone' => '+1-555-0456', 'email' => 'mike@venue.com'],
            ['name' => 'Lisa Rodriguez', 'role' => 'Production Coordinator', 'phone' => '+1-555-0789', 'email' => 'lisa@production.com'],
        ];

        $sampleRequirements = [
            ['type' => 'Sound Check', 'description' => '2-hour sound check starting at 3:00 PM', 'status' => 'confirmed'],
            ['type' => 'Catering', 'description' => 'Vegetarian rider requirements', 'status' => 'pending'],
            ['type' => 'Security', 'description' => 'Backstage security clearance', 'status' => 'confirmed'],
            ['type' => 'Parking', 'description' => '3 VIP parking spots for crew', 'status' => 'confirmed'],
        ];

        $sampleExpenses = [
            ['type' => 'Travel', 'amount' => 1200, 'description' => 'Flight and hotel accommodation'],
            ['type' => 'Equipment', 'amount' => 800, 'description' => 'Additional lighting equipment'],
            ['type' => 'Catering', 'amount' => 300, 'description' => 'Artist and crew meals'],
        ];

        return response()->json([
            'id' => $booking->id,
            'bookingCode' => $booking->booking_code,
            'title' => $booking->title,
            'eventDate' => $booking->event_date,
            'status' => $booking->status,
            'isConfirmed' => $booking->is_confirmed,
            'checkedIn' => $booking->checked_in,
            'venue' => $booking->venue ? [
                'name' => $booking->venue->name,
                'address' => '123 Music Avenue, Entertainment District',
                'city' => $booking->venue->city,
                'country' => $booking->venue->country,
                'timeZone' => $booking->venue->time_zone,
                'contactPerson' => 'Sarah Johnson',
                'contactPhone' => '+1-555-0123',
                'contactEmail' => 'sarah@venue.com',
                'loadInTime' => '12:00 PM',
                'soundCheckTime' => '3:00 PM',
                'showTime' => '8:00 PM',
                'curfew' => '11:00 PM',
                'parkingInfo' => 'VIP parking available behind venue',
                'wifiCredentials' => $booking->venue->wifi_credentials ?: 'VenueGuest / music2024',
                'hospitalityNotes' => $booking->venue->hospitality_notes ?: 'Green room available from 2 PM. Catering includes vegetarian options.',
                'dressing_room' => 'Private green room with shower facilities',
                'catering' => 'Full catering service with dietary accommodations',
            ] : null,
            'stage' => $booking->stage ? [
                'name' => $booking->stage->name,
                'capacity' => $booking->stage->capacity,
                'stageSize' => '40ft x 24ft',
                'acoustics' => 'Professional acoustic treatment',
                'lighting' => 'Full LED lighting rig with haze machine',
                'soundSystem' => 'Meyer Sound PA system, 32-channel mixing console',
            ] : null,
            'financial' => [
                'fee' => rand(15000, 50000),
                'currency' => 'USD',
                'paymentStatus' => 'Pending',
                'paymentDue' => '30 days after performance',
                'expenses' => $sampleExpenses,
            ],
            'contacts' => $sampleContacts,
            'requirements' => $sampleRequirements,
            'notes' => 'High-energy electronic set. Please ensure adequate ventilation for smoke effects. Artist requires 30-minute meet & greet session after show.',
            'contractsCount' => rand(1, 3),
        ]);
    }

    public function contacts(Request $request): JsonResponse
    {
        // TODO: Implement contacts logic
        return response()->json([
            'message' => 'Contacts functionality not yet implemented'
        ]);
    }
}