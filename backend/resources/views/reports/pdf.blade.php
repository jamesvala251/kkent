<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $report['title'] }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #333; }
        .header { display: table; width: 100%; margin-bottom: 18px; border-bottom: 2px solid #1a237e; padding-bottom: 10px; }
        .header-left, .header-right { display: table-cell; vertical-align: middle; }
        .header-left { width: 40%; }
        .header-right { width: 60%; text-align: right; font-size: 10px; line-height: 1.5; color: #444; }
        .logo { height: 50px; width: auto; max-width: 180px; }
        .company-name { font-size: 15px; font-weight: bold; color: #1a237e; margin-bottom: 3px; }
        .meta { margin-bottom: 15px; }
        .summary { margin-bottom: 20px; }
        .summary table { width: 100%; border-collapse: collapse; }
        .summary td { border: 1px solid #ddd; padding: 6px; }
        .summary td.label { background: #f5f5f5; font-weight: bold; width: 25%; }
        table.data { width: 100%; border-collapse: collapse; margin-top: 10px; }
        table.data th, table.data td { border: 1px solid #ddd; padding: 5px; text-align: left; }
        table.data th { background: #1a237e; color: white; font-size: 10px; }
        table.data td.num { text-align: right; }
        h2 { color: #1a237e; font-size: 14px; }
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
        </div>
    </div>

    <h2>{{ $report['title'] }}</h2>
    <div class="meta">
        <strong>Period:</strong> {{ $report['date_from'] }} to {{ $report['date_to'] }}<br>
        <strong>Generated:</strong> {{ now()->format('d M Y H:i') }}
    </div>

    @if(!empty($report['summary']))
    <div class="summary">
        <table>
            @foreach(array_chunk($report['summary'], 2) as $pair)
            <tr>
                @foreach($pair as $item)
                <td class="label">{{ $item['label'] }}</td>
                <td>{{ is_numeric($item['value']) && $item['value'] > 999 ? '₹'.number_format($item['value'], 2) : $item['value'] }}</td>
                @endforeach
                @if(count($pair) === 1)
                <td class="label"></td><td></td>
                @endif
            </tr>
            @endforeach
        </table>
    </div>
    @endif

    <table class="data">
        <thead>
            <tr>
                @foreach($report['columns'] as $col)
                <th>{{ $col['label'] }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @forelse($report['rows'] as $row)
            <tr>
                @foreach($report['columns'] as $col)
                <td class="{{ ($col['format'] ?? '') === 'currency' ? 'num' : '' }}">
                    @php $val = $row[$col['key']] ?? '-' @endphp
                    @if(($col['format'] ?? '') === 'currency' && is_numeric($val))
                        ₹{{ number_format($val, 2) }}
                    @else
                        {{ $val }}
                    @endif
                </td>
                @endforeach
            </tr>
            @empty
            <tr>
                <td colspan="{{ count($report['columns']) }}" style="text-align:center;">No records found for this period</td>
            </tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
