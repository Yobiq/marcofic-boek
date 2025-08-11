# Artist Tour Management API

A Laravel API backend for the artist-focused mobile and web applications, providing artist-scoped endpoints with Sanctum authentication and real-time capabilities.

## Features

- **Authentication**: Laravel Sanctum with Personal Access Tokens for mobile
- **Artist-Scoped Access**: All endpoints enforce artist-only data access
- **Real-time**: Laravel Reverb for WebSocket broadcasting
- **Calendar API**: Month view aggregation of bookings
- **Itinerary Management**: Check-in functionality for bookings and itinerary items
- **Contract Downloads**: Signed URLs for secure PDF access
- **Chat & Notifications**: Real-time messaging and push notifications
- **Profile Management**: Artist profile updates

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email/password, returns bearer token
- `POST /api/auth/logout` - Revoke current token
- `POST /api/auth/refresh` - Refresh token
- `GET /api/me` - Get authenticated user info

### Artist Data
- `GET /api/artist/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD` - Calendar view
- `GET /api/artist/bookings` - List bookings with filters
- `GET /api/artist/bookings/{id}` - Booking detail
- `GET /api/artist/contacts` - Contact list (manager, agent, etc.)
- `GET /api/artist/profile` - Artist profile
- `PUT /api/artist/profile` - Update profile

### Bookings & Itinerary
- `POST /api/bookings/{id}/check-in` - Check into booking
- `GET /api/bookings/{id}/contracts` - List contracts for booking
- `GET /api/bookings/{id}/itinerary` - Itinerary items for booking
- `GET /api/tours/{id}/itinerary` - Itinerary items for tour
- `POST /api/itinerary-items/{id}/check-in` - Check into itinerary item

### Contracts
- `GET /api/contracts/{id}` - Contract details
- `GET /api/contracts/{id}/pdf` - Get signed URL for PDF download

### Chat & Notifications
- `GET /api/chat/threads` - List conversation threads
- `GET /api/chat/threads/{id}` - Messages in thread
- `POST /api/chat/messages` - Send message
- `GET /api/notifications` - List notifications
- `POST /api/notifications/read` - Mark notifications as read
- `PATCH /api/devices` - Register device for push notifications

### Public Shares (no auth)
- `GET /api/share/{token}/json` - Public itinerary JSON
- `GET /api/share/{token}/pdf` - Public itinerary PDF
- `GET /api/booking-overview/{token}/json` - Public booking overview

## Setup

1. Install dependencies:
```bash
composer install
```

2. Set up environment:
```bash
cp .env.example .env
php artisan key:generate
```

3. Configure database and run migrations:
```bash
php artisan migrate
php artisan db:seed --class=ArtistSeeder
```

4. Install Sanctum:
```bash
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan migrate
```

5. Configure broadcasting (Laravel Reverb is installed):
```bash
php artisan reverb:start
```

## Environment Variables

```env
# Database
DB_CONNECTION=sqlite
DB_DATABASE=database/database.sqlite

# Broadcasting
BROADCAST_DRIVER=reverb
REVERB_APP_ID=your-app-id
REVERB_APP_KEY=your-app-key
REVERB_APP_SECRET=your-app-secret
REVERB_HOST=localhost
REVERB_PORT=8080

# CORS for mobile app
SANCTUM_STATEFUL_DOMAINS=localhost:8081,localhost:19006
```

## Security

- All API routes use `auth:sanctum` middleware
- Artist-scoped queries prevent cross-artist data access
- Signed URLs for contract downloads with expiration
- Rate limiting on API routes
- CORS configured for mobile origins

## Development

Start the development server:
```bash
php artisan serve
```

Start the WebSocket server:
```bash
php artisan reverb:start
```

Run tests:
```bash
php artisan test
```

## Models

- `User` - Authentication with HasApiTokens
- `Artist` - Artist profiles linked to users
- `Booking` - Events with artist_id scoping
- `ItineraryItem` - Schedule items for bookings/tours
- `Contract` - PDF contracts with signed URL access
- `ChatThread` & `ChatMessage` - Real-time messaging
- `Notification` - Push notifications and in-app alerts

## Policies

All models implement artist-scoped access:
```php
public function view(User $user, Booking $booking)
{
    return $user->artist->id === $booking->artist_id;
}
```

## Broadcasting

Real-time events for:
- New chat messages
- Booking updates
- Itinerary changes
- Contract notifications

Channels:
- `private-artist.{artistId}` - Artist-specific updates
- `private-chat.{threadId}` - Chat thread messages