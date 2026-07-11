import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import DownloadIcon from '@mui/icons-material/Download';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { useTheme } from '@mui/material/styles';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { type Column } from '../../components/common/DataTable';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { downloadReport, formatCurrency } from '../../services/resourceService';

const reportTypes = [
  { value: 'trip_summary', label: 'Trip Summary Report' },
  { value: 'profit_loss', label: 'Profit & Loss Report' },
  { value: 'expense', label: 'Expense Report' },
  { value: 'salary', label: 'Salary Report' },
  { value: 'invoice', label: 'Invoice Report' },
  { value: 'fleet', label: 'Fleet Utilization Report' },
];

interface ReportColumn {
  key: string;
  label: string;
  format?: 'currency';
}

interface ReportSummaryItem {
  label: string;
  value: number | string;
}

interface ReportData {
  title: string;
  type: string;
  date_from: string;
  date_to: string;
  summary: ReportSummaryItem[];
  columns: ReportColumn[];
  rows: Record<string, string | number>[];
  chart: {
    categories: string[];
    series: { name: string; data: number[] }[];
  };
}

const defaultDateFrom = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

const defaultDateTo = () => {
  const d = new Date();
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
};

export default function Reports() {
  const theme = useTheme();
  const [reportType, setReportType] = useState('trip_summary');
  const [dateFrom, setDateFrom] = useState(defaultDateFrom);
  const [dateTo, setDateTo] = useState(defaultDateTo);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);
  const [report, setReport] = useState<ReportData | null>(null);

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<ReportData>('/reports/generate', {
        params: { type: reportType, date_from: dateFrom, date_to: dateTo },
      });
      setReport(data);
      toast.success('Report generated successfully');
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [reportType, dateFrom, dateTo]);

  useEffect(() => {
    handleGenerate();
  }, [handleGenerate]);

  const handleExport = async (format: 'pdf' | 'excel') => {
    setExporting(format);
    try {
      await downloadReport(reportType, dateFrom, dateTo, format);
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch {
      toast.error(`Failed to export ${format.toUpperCase()}`);
    } finally {
      setExporting(null);
    }
  };

  const chartOptions: ApexOptions = useMemo(() => ({
    chart: { toolbar: { show: false }, fontFamily: theme.typography.fontFamily },
    colors: [theme.palette.primary.main],
    plotOptions: { bar: { borderRadius: 6, columnWidth: '55%' } },
    xaxis: { categories: report?.chart?.categories ?? [] },
    grid: { borderColor: theme.palette.divider },
    dataLabels: { enabled: false },
    yaxis: {
      labels: {
        formatter: (val: number) => (val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : String(val)),
      },
    },
  }), [report, theme]);

  const tableColumns: Column<Record<string, string | number>>[] = useMemo(
    () => (report?.columns ?? []).map((col) => ({
      id: col.key,
      label: col.label,
      align: col.format === 'currency' ? 'right' : 'left',
      format: (row) => {
        const val = row[col.key];
        if (col.format === 'currency' && typeof val === 'number') return formatCurrency(val);
        return val ?? '-';
      },
    })),
    [report],
  );

  const formatSummaryValue = (item: ReportSummaryItem) => {
    const currencyKeywords = ['total', 'revenue', 'profit', 'freight', 'expense', 'billed', 'outstanding', 'salary', 'net'];
    if (typeof item.value === 'number' && currencyKeywords.some((kw) => item.label.toLowerCase().includes(kw))) {
      return formatCurrency(item.value);
    }
    return item.value;
  };

  return (
    <Box>
      <PageHeader title="Reports" subtitle="Generate and export business reports" breadcrumbs={[{ label: 'Reports' }]} />

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <TextField select label="Report Type" fullWidth value={reportType} onChange={(e) => setReportType(e.target.value)} sx={{ mb: 2 }}>
                {reportTypes.map((r) => (
                  <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                ))}
              </TextField>
              <TextField label="From Date" type="date" fullWidth value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={{ mb: 2 }} />
              <TextField label="To Date" type="date" fullWidth value={dateTo} onChange={(e) => setDateTo(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={{ mb: 3 }} />
              <Button variant="contained" fullWidth onClick={handleGenerate} disabled={loading} sx={{ mb: 1 }}>
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Generate Report'}
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={exporting === 'pdf' ? <CircularProgress size={18} /> : <DownloadIcon />}
                onClick={() => handleExport('pdf')}
                disabled={!!exporting || !report}
                sx={{ mb: 1 }}
              >
                Export PDF
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={exporting === 'excel' ? <CircularProgress size={18} /> : <DownloadIcon />}
                onClick={() => handleExport('excel')}
                disabled={!!exporting || !report}
              >
                Export Excel
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ mb: 2.5 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {report?.title ?? reportTypes.find((r) => r.value === reportType)?.label ?? 'Report Preview'}
              </Typography>
              {report?.summary && (
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  {report.summary.map((item) => (
                    <Grid key={item.label} size={{ xs: 6, sm: 3 }}>
                      <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                      <Typography variant="h6" fontWeight={600}>{formatSummaryValue(item)}</Typography>
                    </Grid>
                  ))}
                </Grid>
              )}
              {loading ? (
                <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
              ) : report?.chart?.categories?.length ? (
                <Chart
                  options={chartOptions}
                  series={report.chart.series}
                  type="bar"
                  height={280}
                />
              ) : (
                <Typography color="text.secondary" textAlign="center" py={4}>
                  No chart data for this period
                </Typography>
              )}
            </CardContent>
          </Card>

          <DataTable
            columns={tableColumns}
            rows={report?.rows ?? []}
            loading={loading}
            emptyMessage="No records found for the selected period"
            defaultRowsPerPage={10}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
