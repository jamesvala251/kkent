<?php

namespace App\Services;

use App\Models\AppNotification;
use App\Models\Customer;
use App\Models\Document;
use App\Models\Driver;
use App\Models\HitachiMachine;
use App\Models\Invoice;
use App\Models\Truck;
use App\Models\User;
use Carbon\Carbon;

class NotificationService
{
    private const WARNING_DAYS = 30;

    public function generate(): int
    {
        $today = Carbon::today();
        $horizon = $today->copy()->addDays(self::WARNING_DAYS);
        $users = User::query()->where('status', 'active')->get(['id']);
        if ($users->isEmpty()) {
            return 0;
        }

        $alerts = collect()
            ->merge($this->truckExpiryAlerts($horizon, $today))
            ->merge($this->driverExpiryAlerts($horizon, $today))
            ->merge($this->documentExpiryAlerts($horizon, $today))
            ->merge($this->overdueInvoiceAlerts($today));

        $keys = [];
        foreach ($users as $user) {
            foreach ($alerts as $alert) {
                $key = $user->id.'|'.$alert['key'];
                $keys[] = $key;
                $this->upsert($user->id, $key, $alert);
            }
        }

        $this->forgetStale($keys);

        return count($keys);
    }

    /**
     * @return list<array{key: string, type: string, title: string, message: string, link: string|null, data: array<string, mixed>}>
     */
    private function truckExpiryAlerts(Carbon $horizon, Carbon $today): array
    {
        $fields = [
            'insurance_expiry' => 'Insurance',
            'fitness_expiry' => 'Fitness',
            'permit_expiry' => 'Permit',
            'puc_expiry' => 'PUC',
            'tax_expiry' => 'Tax',
        ];

        $trucks = Truck::query()
            ->where(function ($query) use ($fields, $horizon) {
                foreach (array_keys($fields) as $field) {
                    $query->orWhere(function ($inner) use ($field, $horizon) {
                        $inner->whereNotNull($field)->whereDate($field, '<=', $horizon->toDateString());
                    });
                }
            })
            ->get();

        $alerts = [];
        foreach ($trucks as $truck) {
            foreach ($fields as $field => $label) {
                $date = $truck->{$field};
                if (! $date) {
                    continue;
                }
                $expiry = Carbon::parse($date)->startOfDay();
                if ($expiry->gt($horizon)) {
                    continue;
                }
                $daysLeft = (int) $today->diffInDays($expiry, false);
                $alerts[] = $this->expiryAlert(
                    "expiry|truck|{$truck->id}|{$field}",
                    $label,
                    $truck->truck_number,
                    $daysLeft,
                    "/trucks/{$truck->id}/edit",
                    ['truck_id' => $truck->id, 'field' => $field, 'days_left' => $daysLeft]
                );
            }
        }

        return $alerts;
    }

    /**
     * @return list<array{key: string, type: string, title: string, message: string, link: string|null, data: array<string, mixed>}>
     */
    private function driverExpiryAlerts(Carbon $horizon, Carbon $today): array
    {
        $drivers = Driver::query()
            ->whereNotNull('license_expiry')
            ->whereDate('license_expiry', '<=', $horizon->toDateString())
            ->get();

        return $drivers->map(function (Driver $driver) use ($today) {
            $daysLeft = (int) $today->diffInDays(Carbon::parse($driver->license_expiry)->startOfDay(), false);

            return $this->expiryAlert(
                "expiry|driver|{$driver->id}|license",
                'Driving licence',
                $driver->name,
                $daysLeft,
                "/drivers/{$driver->id}/edit",
                ['driver_id' => $driver->id, 'field' => 'license_expiry', 'days_left' => $daysLeft]
            );
        })->all();
    }

    /**
     * @return list<array{key: string, type: string, title: string, message: string, link: string|null, data: array<string, mixed>}>
     */
    private function documentExpiryAlerts(Carbon $horizon, Carbon $today): array
    {
        $documents = Document::query()
            ->whereNotNull('expiry_date')
            ->whereDate('expiry_date', '<=', $horizon->toDateString())
            ->get();

        $alerts = [];
        foreach ($documents as $document) {
            $daysLeft = (int) $today->diffInDays(Carbon::parse($document->expiry_date)->startOfDay(), false);
            $owner = $this->documentOwnerLabel($document);
            $link = $this->documentLink($document);
            $alerts[] = $this->expiryAlert(
                "expiry|document|{$document->id}",
                $document->title ?: ucfirst($document->type),
                $owner,
                $daysLeft,
                $link,
                ['document_id' => $document->id, 'days_left' => $daysLeft]
            );
        }

        return $alerts;
    }

    /**
     * @return list<array{key: string, type: string, title: string, message: string, link: string|null, data: array<string, mixed>}>
     */
    private function overdueInvoiceAlerts(Carbon $today): array
    {
        $invoices = Invoice::query()
            ->with('customer:id,name')
            ->whereIn('payment_status', ['pending', 'partial', 'overdue'])
            ->whereNotNull('due_date')
            ->whereDate('due_date', '<', $today->toDateString())
            ->where(function ($query) {
                $query->whereNull('paid_amount')
                    ->orWhereColumn('paid_amount', '<', 'total_amount');
            })
            ->get();

        return $invoices->map(function (Invoice $invoice) use ($today) {
            $daysOverdue = (int) Carbon::parse($invoice->due_date)->startOfDay()->diffInDays($today);
            $outstanding = round((float) $invoice->total_amount - (float) $invoice->paid_amount, 2);
            $customer = $invoice->customer?->name ?? 'Customer';

            return [
                'key' => "invoice|overdue|{$invoice->id}",
                'type' => 'invoice_overdue',
                'title' => "Overdue invoice {$invoice->invoice_number}",
                'message' => "{$customer} · ₹".number_format($outstanding, 0)." unpaid · {$daysOverdue} day".($daysOverdue === 1 ? '' : 's').' overdue',
                'link' => "/invoices/{$invoice->id}/edit",
                'data' => [
                    'invoice_id' => $invoice->id,
                    'days_overdue' => $daysOverdue,
                    'outstanding' => $outstanding,
                ],
            ];
        })->all();
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array{key: string, type: string, title: string, message: string, link: string|null, data: array<string, mixed>}
     */
    private function expiryAlert(string $key, string $label, string $owner, int $daysLeft, ?string $link, array $data): array
    {
        if ($daysLeft < 0) {
            $ago = abs($daysLeft);
            $title = "{$label} expired";
            $message = "{$label} for {$owner} expired {$ago} day".($ago === 1 ? '' : 's').' ago';
        } elseif ($daysLeft === 0) {
            $title = "{$label} expires today";
            $message = "{$label} for {$owner} expires today";
        } else {
            $title = "{$label} expiring";
            $message = "{$label} for {$owner} expires in {$daysLeft} day".($daysLeft === 1 ? '' : 's');
        }

        return [
            'key' => $key,
            'type' => 'expiry',
            'title' => $title,
            'message' => $message,
            'link' => $link,
            'data' => $data,
        ];
    }

    /**
     * @param  array{type: string, title: string, message: string, link: string|null, data: array<string, mixed>}  $alert
     */
    private function upsert(int $userId, string $key, array $alert): void
    {
        $existing = AppNotification::query()->where('dedupe_key', $key)->first();
        $payload = [
            'user_id' => $userId,
            'type' => $alert['type'],
            'title' => $alert['title'],
            'message' => $alert['message'],
            'link' => $alert['link'],
            'data' => $alert['data'],
        ];

        if (! $existing) {
            AppNotification::create(array_merge($payload, [
                'dedupe_key' => $key,
                'is_read' => false,
            ]));

            return;
        }

        $wasWarning = (int) ($existing->data['days_left'] ?? 1) >= 0;
        $nowExpired = (int) ($alert['data']['days_left'] ?? 1) < 0;
        if ($existing->is_read && $wasWarning && $nowExpired) {
            $payload['is_read'] = false;
            $payload['read_at'] = null;
        }

        $existing->update($payload);
    }

    /**
     * @param  list<string>  $activeKeys
     */
    private function forgetStale(array $activeKeys): void
    {
        $query = AppNotification::query()
            ->whereIn('type', ['expiry', 'invoice_overdue'])
            ->whereNotNull('dedupe_key');

        if ($activeKeys === []) {
            $query->delete();

            return;
        }

        $query->whereNotIn('dedupe_key', $activeKeys)->delete();
    }

    private function documentOwnerLabel(Document $document): string
    {
        $type = $document->documentable_type;
        $id = $document->documentable_id;

        return match ($type) {
            'truck', Truck::class => Truck::query()->find($id)?->truck_number ?? 'Truck',
            'driver', Driver::class => Driver::query()->find($id)?->name ?? 'Driver',
            'hitachi', HitachiMachine::class => HitachiMachine::query()->find($id)?->machine_number ?? 'Hitachi',
            'customer', Customer::class => Customer::query()->find($id)?->name ?? 'Customer',
            default => 'Document',
        };
    }

    private function documentLink(Document $document): ?string
    {
        $id = $document->documentable_id;

        return match ($document->documentable_type) {
            'truck', Truck::class => "/trucks/{$id}/edit",
            'driver', Driver::class => "/drivers/{$id}/edit",
            'hitachi', HitachiMachine::class => "/hitachi/{$id}/edit",
            'customer', Customer::class => "/customers/{$id}/edit",
            default => null,
        };
    }
}
