import { useEffect, useMemo, useState } from 'react';
import { Box, Card, CardContent, Chip, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import RouteIcon from '@mui/icons-material/Route';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { useTheme } from '@mui/material/styles';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import DataTable, { type Column } from '../components/common/DataTable';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import api from '../services/api';
import { fetchList, formatCurrency, formatDate } from '../services/resourceService';
import type { DashboardStats, Trip } from '../types';

interface DashboardStatsResponse {
  total_trips?: number;
  total_trucks?: number;
  active_drivers?: number;
  monthly_income?: number;
  monthly_profit?: number;
  pending_invoices?: number;
}

interface DashboardChartsResponse {
  monthly_revenue?: { month: string; amount: number }[];
  monthly_expense?: { month: string; amount: number }[];
  trip_status?: {
    completed: number;
    running: number;
    pending: number;
    cancelled: number;
  };
}

const emptyStats: DashboardStats = {
  total_trips: 0,
  active_trucks: 0,
  total_revenue: 0,
  total_profit: 0,
  pending_invoices: 0,
  active_drivers: 0,
};

export default function Dashboard() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);
  const [revenueMonths, setRevenueMonths] = useState<string[]>([]);
  const [revenueData, setRevenueData] = useState<number[]>([]);
  const [profitData, setProfitData] = useState<number[]>([]);
  const [tripStatusSeries, setTripStatusSeries] = useState<number[]>([0, 0, 0, 0]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [statsRes, chartsRes, trips] = await Promise.all([
          api.get<DashboardStatsResponse>('/dashboard/stats'),
          api.get<DashboardChartsResponse>('/dashboard/charts'),
          fetchList<Trip>('/trips', { per_page: 5, sort_by: 'start_date', sort_order: 'desc' }),
        ]);

        const statsData = statsRes.data ?? {};
        setStats({
          total_trips: statsData.total_trips ?? 0,
          active_trucks: statsData.total_trucks ?? 0,
          total_revenue: statsData.monthly_income ?? 0,
          total_profit: statsData.monthly_profit ?? 0,
          pending_invoices: statsData.pending_invoices ?? 0,
          active_drivers: statsData.active_drivers ?? 0,
        });

        const chartsData = chartsRes.data ?? {};
        const monthlyRevenue = chartsData.monthly_revenue ?? [];
        const monthlyExpense = chartsData.monthly_expense ?? [];

        setRevenueMonths(monthlyRevenue.map((item) => item.month));
        setRevenueData(monthlyRevenue.map((item) => Number(item.amount) || 0));
        setProfitData(
          monthlyRevenue.map((item, index) => {
            const expense = Number(monthlyExpense[index]?.amount) || 0;
            return (Number(item.amount) || 0) - expense;
          }),
        );

        const tripStatus = chartsData.trip_status;
        setTripStatusSeries([
          tripStatus?.completed ?? 0,
          tripStatus?.running ?? 0,
          tripStatus?.pending ?? 0,
          tripStatus?.cancelled ?? 0,
        ]);

        setRecentTrips(trips);
      } catch {
        setStats(emptyStats);
        setRecentTrips([]);
        setRevenueMonths([]);
        setRevenueData([]);
        setProfitData([]);
        setTripStatusSeries([0, 0, 0, 0]);
      }
      setLoading(false);
    };
    load();
  }, []);

  const revenueChartOptions: ApexOptions = useMemo(
    () => ({
      chart: { toolbar: { show: false }, fontFamily: theme.typography.fontFamily },
      colors: [theme.palette.primary.main, theme.palette.success.main],
      stroke: { curve: 'smooth', width: 3 },
      xaxis: { categories: revenueMonths },
      legend: { position: 'top' },
      grid: { borderColor: theme.palette.divider },
      yaxis: {
        labels: {
          formatter: (value) => formatCurrency(value),
        },
      },
      tooltip: {
        y: {
          formatter: (value) => formatCurrency(value),
        },
      },
    }),
    [revenueMonths, theme],
  );

  const revenueSeries = useMemo(
    () => [
      { name: 'Revenue', data: revenueData },
      { name: 'Profit', data: profitData },
    ],
    [revenueData, profitData],
  );

  const tripStatusOptions: ApexOptions = useMemo(
    () => ({
      chart: { type: 'donut' },
      labels: ['Completed', 'Running', 'Pending', 'Cancelled'],
      colors: [
        theme.palette.success.main,
        theme.palette.info.main,
        theme.palette.warning.main,
        theme.palette.error.main,
      ],
      legend: { position: 'bottom' },
      plotOptions: {
        pie: {
          donut: {
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total Trips',
              },
            },
          },
        },
      },
    }),
    [theme],
  );

  const tripColumns: Column<Trip>[] = [
    { id: 'trip_number', label: 'Trip #', minWidth: 120 },
    { id: 'from_location', label: 'From' },
    { id: 'to_location', label: 'To' },
    { id: 'start_date', label: 'Date', format: (row) => formatDate(row.start_date) },
    {
      id: 'total_freight',
      label: 'Freight',
      align: 'right',
      format: (row) => formatCurrency(row.total_freight || 0),
    },
    { id: 'profit', label: 'Profit', align: 'right', format: (row) => formatCurrency(row.profit || 0) },
    {
      id: 'status',
      label: 'Status',
      format: (row) => (
        <Chip
          label={row.status.replace('_', ' ')}
          size="small"
          color={row.status === 'completed' ? 'success' : row.status === 'running' ? 'info' : 'warning'}
        />
      ),
    },
  ];

  if (loading) return <LoadingSkeleton />;

  return (
    <Box>
      <PageHeader title="Dashboard" subtitle="Overview of your transport operations" />

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatCard title="Total Trips" value={stats.total_trips} icon={<RouteIcon />} color="#1a237e" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatCard title="Active Trucks" value={stats.active_trucks} icon={<DirectionsCarIcon />} color="#3949ab" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatCard title="Total Revenue" value={formatCurrency(stats.total_revenue)} icon={<AccountBalanceWalletIcon />} color="#1565c0" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatCard title="Total Profit" value={formatCurrency(stats.total_profit)} icon={<TrendingUpIcon />} color="#2e7d32" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatCard title="Active Drivers" value={stats.active_drivers} icon={<PeopleIcon />} color="#6a1b9a" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatCard title="Pending Invoices" value={stats.pending_invoices} icon={<RequestQuoteIcon />} color="#e65100" />
        </Grid>
      </Grid>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600 }} gutterBottom>
                Revenue & Profit Trend
              </Typography>
              <Chart options={revenueChartOptions} series={revenueSeries} type="area" height={320} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600 }} gutterBottom>
                Trip Status
              </Typography>
              <Chart options={tripStatusOptions} series={tripStatusSeries} type="donut" height={320} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Recent Trips
      </Typography>
      <DataTable columns={tripColumns} rows={recentTrips} searchKeys={['trip_number', 'from_location', 'to_location']} getRowId={(row) => row.id} />
    </Box>
  );
}
