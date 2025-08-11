<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Artist;
use App\Models\Agency;
use App\Models\Venue;
use App\Models\Stage;
use App\Models\Booking;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;

class SimpleDataSeeder extends Seeder
{
    public function run(): void
    {
        // Create additional agencies
        $agencies = [
            ['name' => 'Global Music Agency', 'email' => 'global@example.com', 'phone' => '+1-555-0101'],
            ['name' => 'Elite Artist Management', 'email' => 'elite@example.com', 'phone' => '+1-555-0202'],
            ['name' => 'European Talent Group', 'email' => 'europe@example.com', 'phone' => '+44-20-7946-0958'],
        ];

        foreach ($agencies as $agencyData) {
            Agency::firstOrCreate(['email' => $agencyData['email']], $agencyData);
        }

        // Create additional venues
        $venues = [
            ['name' => 'Red Rocks Amphitheatre', 'city' => 'Morrison', 'country' => 'USA', 'time_zone' => 'America/Denver'],
            ['name' => 'Fabric', 'city' => 'London', 'country' => 'UK', 'time_zone' => 'Europe/London'],
            ['name' => 'Berghain', 'city' => 'Berlin', 'country' => 'Germany', 'time_zone' => 'Europe/Berlin'],
            ['name' => 'Coachella', 'city' => 'Indio', 'country' => 'USA', 'time_zone' => 'America/Los_Angeles'],
            ['name' => 'Tomorrowland', 'city' => 'Boom', 'country' => 'Belgium', 'time_zone' => 'Europe/Brussels'],
            ['name' => 'Ministry of Sound', 'city' => 'London', 'country' => 'UK', 'time_zone' => 'Europe/London'],
            ['name' => 'Amnesia Ibiza', 'city' => 'Ibiza', 'country' => 'Spain', 'time_zone' => 'Europe/Madrid'],
        ];

        foreach ($venues as $venueData) {
            Venue::firstOrCreate(['name' => $venueData['name']], $venueData);
        }

        // Create stages
        $stages = [
            ['name' => 'Main Stage', 'capacity' => 50000, 'policies' => 'No pyrotechnics without approval'],
            ['name' => 'Room One', 'capacity' => 2500, 'policies' => 'Sound limit 95dB'],
            ['name' => 'Panorama Bar', 'capacity' => 800, 'policies' => 'Smoking area available'],
            ['name' => 'Sahara Tent', 'capacity' => 15000, 'policies' => 'Festival regulations apply'],
            ['name' => 'Freedom Stage', 'capacity' => 30000, 'policies' => 'International broadcast ready'],
            ['name' => 'The Box', 'capacity' => 1200, 'policies' => 'VIP area included'],
            ['name' => 'Terrace', 'capacity' => 3000, 'policies' => 'Outdoor area, weather dependent'],
        ];

        foreach ($stages as $stageData) {
            Stage::firstOrCreate(['name' => $stageData['name']], $stageData);
        }

        // Get existing artist
        $artist = Artist::first();
        
        if (!$artist) {
            echo "No artist found, creating default artist...\n";
            
            $user = User::firstOrCreate(
                ['email' => 'jane@example.com'],
                [
                    'name' => 'Jane Doe',
                    'email' => 'jane@example.com',
                    'password' => Hash::make('password'),
                ]
            );

            $artist = Artist::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'name' => 'Jane Doe',
                    'email' => 'jane@example.com',
                    'bio' => 'Electronic music artist specializing in progressive house and techno.',
                    'user_id' => $user->id,
                    'agency_id' => 1,
                ]
            );
        }

        // Create comprehensive bookings
        $bookings = [
            [
                'booking_code' => 'RR2025001',
                'title' => 'Red Rocks Electronic Night',
                'event_date' => Carbon::now()->addDays(15)->format('Y-m-d'),
                'start_time' => '20:00:00',
                'end_time' => '23:00:00',
                'venue_id' => 1,
                'stage_id' => 1,
                'status' => 'confirmed',
                'fee' => 25000.00,
                'currency' => 'USD',
                'rider_requirements' => 'Pioneer CDJ-3000, Allen & Heath mixer, full lighting rig',
                'technical_requirements' => 'Sound check at 18:00, 90-minute set',
                'notes' => 'High-profile show, VIP meet & greet included',
            ],
            [
                'booking_code' => 'FAB2025002',
                'title' => 'Fabric Room One',
                'event_date' => Carbon::now()->addDays(32)->format('Y-m-d'),
                'start_time' => '01:00:00',
                'end_time' => '03:00:00',
                'venue_id' => 2,
                'stage_id' => 2,
                'status' => 'confirmed',
                'fee' => 8000.00,
                'currency' => 'GBP',
                'rider_requirements' => 'Pioneer setup, green room access',
                'technical_requirements' => '2-hour set, b2b with local resident',
                'notes' => 'Legendary London venue, sold out show',
            ],
            [
                'booking_code' => 'BER2025003',
                'title' => 'Berghain Weekend Residency',
                'event_date' => Carbon::now()->addDays(45)->format('Y-m-d'),
                'start_time' => '06:00:00',
                'end_time' => '10:00:00',
                'venue_id' => 3,
                'stage_id' => 3,
                'status' => 'pending',
                'fee' => 15000.00,
                'currency' => 'EUR',
                'rider_requirements' => 'Full Funktion-One sound system',
                'technical_requirements' => '4-hour sunrise set',
                'notes' => 'Exclusive Berlin techno temple booking',
            ],
            [
                'booking_code' => 'COACH2025004',
                'title' => 'Coachella Weekend 1',
                'event_date' => Carbon::now()->addDays(120)->format('Y-m-d'),
                'start_time' => '16:30:00',
                'end_time' => '17:30:00',
                'venue_id' => 4,
                'stage_id' => 4,
                'status' => 'confirmed',
                'fee' => 75000.00,
                'currency' => 'USD',
                'rider_requirements' => 'Full production, LED screens, pyrotechnics',
                'technical_requirements' => '60-minute festival set, live stream',
                'notes' => 'Major festival appearance, international broadcast',
            ],
            [
                'booking_code' => 'TML2025005',
                'title' => 'Tomorrowland Belgium',
                'event_date' => Carbon::now()->addDays(180)->format('Y-m-d'),
                'start_time' => '22:00:00',
                'end_time' => '23:30:00',
                'venue_id' => 5,
                'stage_id' => 5,
                'status' => 'confirmed',
                'fee' => 100000.00,
                'currency' => 'EUR',
                'rider_requirements' => 'Custom stage design, full production team',
                'technical_requirements' => '90-minute headline set, special effects',
                'notes' => 'Headline slot at world\'s biggest electronic festival',
            ],
            [
                'booking_code' => 'MOS2025006',
                'title' => 'Ministry of Sound Anniversary',
                'event_date' => Carbon::now()->addDays(67)->format('Y-m-d'),
                'start_time' => '23:00:00',
                'end_time' => '02:00:00',
                'venue_id' => 6,
                'stage_id' => 6,
                'status' => 'confirmed',
                'fee' => 12000.00,
                'currency' => 'GBP',
                'rider_requirements' => 'Classic MoS sound system, backstage catering',
                'technical_requirements' => '3-hour extended set',
                'notes' => '30th anniversary celebration, historic venue',
            ],
            [
                'booking_code' => 'AMN2025007',
                'title' => 'Amnesia Ibiza Opening',
                'event_date' => Carbon::now()->addDays(95)->format('Y-m-d'),
                'start_time' => '02:00:00',
                'end_time' => '06:00:00',
                'venue_id' => 7,
                'stage_id' => 7,
                'status' => 'confirmed',
                'fee' => 35000.00,
                'currency' => 'EUR',
                'rider_requirements' => 'Terrace setup, CO2 cannons, confetti',
                'technical_requirements' => '4-hour closing set, sunrise finish',
                'notes' => 'Ibiza season opener, exclusive aftermovie rights',
            ],
            [
                'booking_code' => 'PRIV2025008',
                'title' => 'Private Corporate Event',
                'event_date' => Carbon::now()->addDays(28)->format('Y-m-d'),
                'start_time' => '19:00:00',
                'end_time' => '22:00:00',
                'venue_id' => 1,
                'stage_id' => 1,
                'status' => 'tentative',
                'fee' => 50000.00,
                'currency' => 'USD',
                'rider_requirements' => 'Discrete setup, corporate-friendly playlist',
                'technical_requirements' => '3-hour background music set',
                'notes' => 'High-profile tech company launch event',
            ],
            [
                'booking_code' => 'LOCAL2025009',
                'title' => 'Local Club Night',
                'event_date' => Carbon::now()->addDays(7)->format('Y-m-d'),
                'start_time' => '22:00:00',
                'end_time' => '04:00:00',
                'venue_id' => 2,
                'stage_id' => 2,
                'status' => 'confirmed',
                'fee' => 3500.00,
                'currency' => 'GBP',
                'rider_requirements' => 'Standard club setup',
                'technical_requirements' => '6-hour set, warm-up and main',
                'notes' => 'Weekly residency, building local fanbase',
            ],
            [
                'booking_code' => 'FEST2025010',
                'title' => 'Summer Music Festival',
                'event_date' => Carbon::now()->addDays(200)->format('Y-m-d'),
                'start_time' => '18:00:00',
                'end_time' => '19:30:00',
                'venue_id' => 4,
                'stage_id' => 4,
                'status' => 'pending',
                'fee' => 45000.00,
                'currency' => 'USD',
                'rider_requirements' => 'Festival standard production',
                'technical_requirements' => '90-minute festival set',
                'notes' => 'Prime time slot, potential for future bookings',
            ],
        ];

        foreach ($bookings as $bookingData) {
            Booking::firstOrCreate(
                ['booking_code' => $bookingData['booking_code']],
                array_merge($bookingData, ['artist_id' => $artist->id])
            );
        }

        echo "✅ Simple data seeding completed successfully!\n";
        echo "📊 Data created:\n";
        echo "   - " . Agency::count() . " agencies\n";
        echo "   - " . Venue::count() . " venues\n";
        echo "   - " . Stage::count() . " stages\n";
        echo "   - " . Artist::count() . " artists\n";
        echo "   - " . Booking::count() . " bookings\n";
        echo "   - " . User::count() . " users\n";
    }
}
