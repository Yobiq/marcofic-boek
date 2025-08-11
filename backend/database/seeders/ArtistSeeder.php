<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Artist;
use App\Models\Agency;
use App\Models\Venue;
use App\Models\Stage;
use App\Models\Booking;
use Illuminate\Support\Facades\Hash;

class ArtistSeeder extends Seeder
{
    public function run(): void
    {
        // Create agency
        $agency = Agency::create([
            'name' => 'Electronic Music Agency',
            'email' => 'contact@ema.com',
            'phone' => '+31 20 123 4567',
        ]);

        // Create user
        $user = User::create([
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => Hash::make('password'),
        ]);

        // Create artist
        $artist = Artist::create([
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'bio' => 'Electronic music artist specializing in progressive house and techno.',
            'user_id' => $user->id,
            'agency_id' => $agency->id,
        ]);

        // Create venues
        $venues = [
            [
                'name' => 'React Rocks',
                'city' => 'Rotterdam',
                'country' => 'Netherlands',
                'time_zone' => 'Europe/Amsterdam',
            ],
            [
                'name' => 'Club Warehouse',
                'city' => 'Amsterdam',
                'country' => 'Netherlands',
                'time_zone' => 'Europe/Amsterdam',
            ],
            [
                'name' => 'Electronic Paradise',
                'city' => 'Berlin',
                'country' => 'Germany',
                'time_zone' => 'Europe/Berlin',
            ],
            [
                'name' => 'Beat Factory',
                'city' => 'London',
                'country' => 'UK',
                'time_zone' => 'Europe/London',
            ],
        ];

        foreach ($venues as $venueData) {
            Venue::create($venueData);
        }

        // Create stages
        $stage = Stage::create([
            'name' => 'Main Stage',
            'capacity' => 2200,
            'policies' => 'No smoking, no outside drinks',
        ]);

        // Create bookings for different dates
        $bookings = [
            [
                'booking_code' => 'RR2025001',
                'title' => 'React Rocks Festival',
                'artist_id' => $artist->id,
                'venue_id' => 1,
                'stage_id' => $stage->id,
                'event_date' => '2025-07-16 21:30:00',
                'status' => 'confirmed',
                'is_confirmed' => true,
            ],
            [
                'booking_code' => 'CW2025002',
                'title' => 'Underground Night',
                'artist_id' => $artist->id,
                'venue_id' => 2,
                'stage_id' => $stage->id,
                'event_date' => '2025-07-18 22:00:00',
                'status' => 'confirmed',
                'is_confirmed' => true,
            ],
            [
                'booking_code' => 'EP2025003',
                'title' => 'Electronic Paradise Opening',
                'artist_id' => $artist->id,
                'venue_id' => 3,
                'stage_id' => $stage->id,
                'event_date' => '2025-07-20 23:00:00',
                'status' => 'confirmed',
                'is_confirmed' => true,
            ],
            [
                'booking_code' => 'BF2025004',
                'title' => 'Beat Factory Sessions',
                'artist_id' => $artist->id,
                'venue_id' => 4,
                'stage_id' => $stage->id,
                'event_date' => '2025-07-25 20:00:00',
                'status' => 'pending',
                'is_confirmed' => false,
            ],
            [
                'booking_code' => 'RR2025005',
                'title' => 'React Rocks After Party',
                'artist_id' => $artist->id,
                'venue_id' => 1,
                'stage_id' => $stage->id,
                'event_date' => '2025-08-01 22:30:00',
                'status' => 'confirmed',
                'is_confirmed' => true,
            ],
        ];

        foreach ($bookings as $bookingData) {
            Booking::create($bookingData);
        }
    }
}
