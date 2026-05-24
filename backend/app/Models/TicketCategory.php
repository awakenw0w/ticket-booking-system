<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TicketCategory extends Model
{
    protected $fillable = [
        'event_id',
        'name',
        'price',
        'quantity',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'quantity' => 'integer',
        ];
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function activeBookedQuantity(): int
    {
        return (int) $this->bookings()
            ->whereIn('status', ['reserved', 'paid'])
            ->sum('quantity');
    }

    public function availableQuantity(): int
    {
        return max(0, $this->quantity - $this->activeBookedQuantity());
    }
}
