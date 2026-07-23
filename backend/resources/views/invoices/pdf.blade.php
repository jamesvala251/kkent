<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice {{ $invoice->invoice_number }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #333; }
        .header { display: table; width: 100%; margin-bottom: 24px; border-bottom: 2px solid #1a237e; padding-bottom: 12px; }
        .header-left, .header-right { display: table-cell; vertical-align: middle; }
        .header-left { width: 42%; }
        .header-right { width: 58%; text-align: right; font-size: 11px; line-height: 1.5; color: #444; }
        .logo { height: 58px; width: auto; max-width: 200px; }
        .company-name { font-size: 16px; font-weight: bold; color: #1a237e; margin-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #1a237e; color: white; }
        .totals { margin-top: 20px; text-align: right; }
        .totals table { width: 300px; margin-left: auto; }
        h2 { color: #1a237e; font-size: 16px; margin: 0 0 12px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-left">
            @if(file_exists(public_path('images/logo.png')))
            <img src="{{ public_path('images/logo.png') }}" class="logo" alt="KK Enterprise">
            @else
            <div class="company-name">{{ $settings->company_name ?? 'KK Enterprise' }}</div>
            @endif
        </div>
        <div class="header-right">
            <div class="company-name">{{ $settings->company_name ?? 'KK Enterprise' }}</div>
            <div>{{ $settings->address ?? '' }}</div>
            @if($settings->phone ?? false)
            <div>Phone: {{ $settings->phone }}</div>
            @endif
            @if($settings->email ?? false)
            <div>Email: {{ $settings->email }}</div>
            @endif
            <div>GST: {{ $settings->gst_number ?? 'N/A' }}</div>
        </div>
    </div>

    <h2>Tax Invoice</h2>
    <p><strong>Invoice No:</strong> {{ $invoice->invoice_number }}</p>
    <p><strong>Date:</strong> {{ $invoice->invoice_date->format('d M Y') }}</p>
    <p><strong>Due Date:</strong> {{ $invoice->due_date?->format('d M Y') ?? 'N/A' }}</p>

    <h3>Bill To</h3>
    <p>
        <strong>{{ $invoice->customer->name }}</strong><br>
        {{ $invoice->customer->company_name }}<br>
        {{ $invoice->customer->address }}<br>
        GST: {{ $invoice->customer->gst_number ?? 'N/A' }}
    </p>

    <table>
        <thead>
            <tr>
                <th>Description</th>
                <th>Amount</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>
                    @if($invoice->hitachiRental)
                        Hitachi Rental — {{ $invoice->hitachiRental->rental_number }}
                        @if($invoice->hitachiRental->hitachi)
                            ({{ $invoice->hitachiRental->hitachi->machine_number }})
                        @endif
                        <br>
                        <small>
                            Billing: {{ ucfirst($invoice->hitachiRental->billing_type) }}
                            @if($invoice->hitachiRental->billing_type === 'hourly')
                                · {{ number_format((float) $invoice->hitachiRental->hours, 2) }} hrs
                            @elseif($invoice->hitachiRental->billing_type === 'daily')
                                · {{ number_format((float) $invoice->hitachiRental->days, 2) }} days
                            @elseif($invoice->hitachiRental->billing_type === 'monthly')
                                · {{ number_format((float) $invoice->hitachiRental->months, 2) }} months
                            @endif
                            @if($invoice->hitachiRental->site_location)
                                · Site: {{ $invoice->hitachiRental->site_location }}
                            @endif
                            · {{ $invoice->hitachiRental->start_date?->format('d M Y') }}
                            @if($invoice->hitachiRental->end_date)
                                → {{ $invoice->hitachiRental->end_date->format('d M Y') }}
                            @endif
                        </small>
                    @elseif($invoice->trip)
                        Transport Services — Trip {{ $invoice->trip->trip_number }}
                    @else
                        Transport / Equipment Services
                    @endif
                </td>
                <td>₹{{ number_format($invoice->subtotal, 2) }}</td>
            </tr>
        </tbody>
    </table>

    @php
        $subtotal = (float) $invoice->subtotal;
        $cgstRate = (float) $invoice->cgst_rate;
        $sgstRate = (float) $invoice->sgst_rate;
        $igstRate = (float) $invoice->igst_rate;
        // Legacy invoices may have tax amounts but 0% rates — derive % for display
        if ($cgstRate <= 0 && (float) $invoice->cgst > 0 && $subtotal > 0) {
            $cgstRate = round(((float) $invoice->cgst / $subtotal) * 100, 2);
        }
        if ($sgstRate <= 0 && (float) $invoice->sgst > 0 && $subtotal > 0) {
            $sgstRate = round(((float) $invoice->sgst / $subtotal) * 100, 2);
        }
        if ($igstRate <= 0 && (float) $invoice->igst > 0 && $subtotal > 0) {
            $igstRate = round(((float) $invoice->igst / $subtotal) * 100, 2);
        }
        // Amounts always calculated from %
        $cgstAmount = round($subtotal * $cgstRate / 100, 2);
        $sgstAmount = round($subtotal * $sgstRate / 100, 2);
        $igstAmount = round($subtotal * $igstRate / 100, 2);
        $grandTotal = round($subtotal + $cgstAmount + $sgstAmount + $igstAmount, 2);
    @endphp
    <div class="totals">
        <table>
            <tr><td>Subtotal</td><td>₹{{ number_format($subtotal, 2) }}</td></tr>
            @if($cgstRate > 0)
            <tr><td>CGST @ {{ number_format($cgstRate, 2) }}%</td><td>₹{{ number_format($cgstAmount, 2) }}</td></tr>
            @endif
            @if($sgstRate > 0)
            <tr><td>SGST @ {{ number_format($sgstRate, 2) }}%</td><td>₹{{ number_format($sgstAmount, 2) }}</td></tr>
            @endif
            @if($igstRate > 0)
            <tr><td>IGST @ {{ number_format($igstRate, 2) }}%</td><td>₹{{ number_format($igstAmount, 2) }}</td></tr>
            @endif
            <tr><td><strong>Total</strong></td><td><strong>₹{{ number_format($grandTotal, 2) }}</strong></td></tr>
        </table>
    </div>

    @if($invoice->notes)
    <p><strong>Notes:</strong> {{ $invoice->notes }}</p>
    @endif
</body>
</html>
