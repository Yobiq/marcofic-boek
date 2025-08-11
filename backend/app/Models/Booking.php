<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_code',
        'title',
        'artist_id',
        'venue_id',
        'stage_id',
        'event_date',
        'status',
        'is_confirmed',
        'checked_in',
    ];

    protected $casts = [
        'event_date' => 'datetime',
        'is_confirmed' => 'boolean',
        'checked_in' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function artist(): BelongsTo
    {
        return $this->belongsTo(Artist::class);
    }

    public function venue(): BelongsTo
    {
        return $this->belongsTo(Venue::class);
    }

    public function stage(): BelongsTo
    {
        return $this->belongsTo(Stage::class);
    }

    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class);
    }

    public function itineraryItems(): HasMany
    {
        return $this->hasMany(ItineraryItem::class);
    }

    public function flightDetails(): HasMany
    {
        return $this->hasMany(FlightDetail::class);
    }

    public function hotelDetails(): HasMany
    {
        return $this->hasMany(HotelDetail::class);
    }

    public function transportLegs(): HasMany
    {
        return $this->hasMany(TransportLeg::class);
    }

    // Scope for artist-only access
    public function scopeForArtist($query, $artistId)
    {
        return $query->where('artist_id', $artistId);
    }
}
