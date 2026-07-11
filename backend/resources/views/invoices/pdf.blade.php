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
                <td>Transport Services @if($invoice->trip) - Trip {{ $invoice->trip->trip_number }} @endif</td>
                <td>₹{{ number_format($invoice->subtotal, 2) }}</td>
            </tr>
        </tbody>
    </table>

    <div class="totals">
        <table>
            <tr><td>Subtotal</td><td>₹{{ number_format($invoice->subtotal, 2) }}</td></tr>
            @if($invoice->cgst > 0)
            <tr><td>CGST @ {{ number_format($invoice->cgst_rate, 2) }}%</td><td>₹{{ number_format($invoice->cgst, 2) }}</td></tr>
            @endif
            @if($invoice->sgst > 0)
            <tr><td>SGST @ {{ number_format($invoice->sgst_rate, 2) }}%</td><td>₹{{ number_format($invoice->sgst, 2) }}</td></tr>
            @endif
            @if($invoice->igst > 0)
            <tr><td>IGST @ {{ number_format($invoice->igst_rate, 2) }}%</td><td>₹{{ number_format($invoice->igst, 2) }}</td></tr>
            @endif
            <tr><td><strong>Total</strong></td><td><strong>₹{{ number_format($invoice->total_amount, 2) }}</strong></td></tr>
        </table>
    </div>

    @if($invoice->notes)
    <p><strong>Notes:</strong> {{ $invoice->notes }}</p>
    @endif
</body>
</html>
