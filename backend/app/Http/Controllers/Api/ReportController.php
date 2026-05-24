<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Event;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function bookings(Request $request): JsonResponse
    {
        $data = $this->validatedFilters($request, allowStatus: true);
        $query = $this->filteredBookings($data, 'reserved_at');

        $summary = [
            'bookings_count' => (clone $query)->count(),
            'tickets_count' => (int) (clone $query)->sum('quantity'),
            'total_amount' => (float) (clone $query)->sum('total_price'),
        ];

        $byStatus = (clone $query)
            ->select([
                'status',
                DB::raw('COUNT(*) as bookings_count'),
                DB::raw('COALESCE(SUM(quantity), 0) as tickets_count'),
                DB::raw('COALESCE(SUM(total_price), 0) as total_amount'),
            ])
            ->groupBy('status')
            ->orderBy('status')
            ->get();

        return response()->json([
            'filters' => $data,
            'summary' => $summary,
            'by_status' => $byStatus,
        ]);
    }

    public function revenue(Request $request): JsonResponse
    {
        $data = $this->validatedFilters($request);
        $query = $this->filteredBookings($data, 'paid_at')
            ->where('bookings.status', 'paid')
            ->whereNotNull('bookings.paid_at');

        $summary = [
            'paid_bookings_count' => (clone $query)->count(),
            'paid_tickets_count' => (int) (clone $query)->sum('quantity'),
            'total_revenue' => (float) (clone $query)->sum('total_price'),
        ];

        $byEvents = (clone $query)
            ->join('ticket_categories', 'bookings.ticket_category_id', '=', 'ticket_categories.id')
            ->join('events', 'ticket_categories.event_id', '=', 'events.id')
            ->select([
                'events.id as event_id',
                'events.title as event_title',
                DB::raw('COUNT(bookings.id) as paid_bookings_count'),
                DB::raw('COALESCE(SUM(bookings.quantity), 0) as paid_tickets_count'),
                DB::raw('COALESCE(SUM(bookings.total_price), 0) as revenue'),
            ])
            ->groupBy('events.id', 'events.title')
            ->orderByDesc('revenue')
            ->get();

        return response()->json([
            'filters' => $data,
            'summary' => $summary,
            'by_events' => $byEvents,
        ]);
    }

    public function eventsOccupancy(Request $request): JsonResponse
    {
        $data = $request->validate([
            'event_id' => ['nullable', 'integer', 'exists:events,id'],
        ]);

        $events = Event::query()
            ->with('ticketCategories.bookings')
            ->when(isset($data['event_id']), fn (Builder $query) => $query->whereKey($data['event_id']))
            ->orderBy('starts_at')
            ->get()
            ->map(function (Event $event) {
                $totalTickets = $event->ticketCategories->sum('quantity');
                $reservedTickets = 0;
                $paidTickets = 0;
                $cancelledTickets = 0;
                $revenue = 0.0;

                foreach ($event->ticketCategories as $category) {
                    foreach ($category->bookings as $booking) {
                        if ($booking->status === 'reserved') {
                            $reservedTickets += $booking->quantity;
                        }

                        if ($booking->status === 'paid') {
                            $paidTickets += $booking->quantity;
                            $revenue += (float) $booking->total_price;
                        }

                        if ($booking->status === 'cancelled') {
                            $cancelledTickets += $booking->quantity;
                        }
                    }
                }

                $activeTickets = $reservedTickets + $paidTickets;

                return [
                    'event_id' => $event->id,
                    'event_title' => $event->title,
                    'starts_at' => $event->starts_at,
                    'total_tickets' => $totalTickets,
                    'reserved_tickets' => $reservedTickets,
                    'paid_tickets' => $paidTickets,
                    'cancelled_tickets' => $cancelledTickets,
                    'active_tickets' => $activeTickets,
                    'available_tickets' => max(0, $totalTickets - $activeTickets),
                    'occupancy_percent' => $totalTickets > 0 ? round($activeTickets / $totalTickets * 100, 2) : 0,
                    'revenue' => $revenue,
                ];
            });

        return response()->json([
            'filters' => $data,
            'events' => $events,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedFilters(Request $request, bool $allowStatus = false): array
    {
        return $request->validate([
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
            'event_id' => ['nullable', 'integer', 'exists:events,id'],
            'status' => [$allowStatus ? 'nullable' : 'prohibited', 'in:reserved,cancelled,paid'],
        ]);
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return Builder<Booking>
     */
    private function filteredBookings(array $filters, string $dateColumn): Builder
    {
        return Booking::query()
            ->when(isset($filters['date_from']), fn (Builder $query) => $query->whereDate("bookings.{$dateColumn}", '>=', $filters['date_from']))
            ->when(isset($filters['date_to']), fn (Builder $query) => $query->whereDate("bookings.{$dateColumn}", '<=', $filters['date_to']))
            ->when(isset($filters['status']), fn (Builder $query) => $query->where('bookings.status', $filters['status']))
            ->when(isset($filters['event_id']), function (Builder $query) use ($filters) {
                $query->whereHas('ticketCategory', fn (Builder $categoryQuery) => $categoryQuery->where('event_id', $filters['event_id']));
            });
    }
}
