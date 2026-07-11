import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Chip, IconButton, MenuItem, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { type Column } from '../../components/common/DataTable';
import FilterPanel, { FilterField } from '../../components/common/FilterPanel';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import { fetchList, formatCurrency, formatDate } from '../../services/resourceService';
import { buildFilterParams, type FilterValues } from '../../utils/listFilters';
import type { Customer, Driver, Trip, Truck } from '../../types';

const initialFilters: FilterValues = {
  status: '',
  customer_id: '',
  truck_id: '',
  driver_id: '',
  date_from: '',
  date_to: '',
  search: '',
};

export default function TripList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterValues>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<FilterValues>(initialFilters);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  useEffect(() => {
    Promise.all([
      fetchList<Customer>('/customers', { per_page: 200, status: 'active' }),
      fetchList<Truck>('/trucks', { per_page: 200, status: 'active' }),
      fetchList<Driver>('/drivers', { per_page: 200, status: 'active' }),
    ]).then(([c, t, d]) => {
      setCustomers(c);
      setTrucks(t);
      setDrivers(d);
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchList<Trip>('/trips', buildFilterParams(appliedFilters));
    setRows(data);
    setLoading(false);
  }, [appliedFilters]);

  useEffect(() => {
    load();
  }, [load]);

  const columns: Column<Trip>[] = [
    { id: 'trip_number', label: 'Trip #', minWidth: 130 },
    { id: 'from_location', label: 'From' },
    { id: 'to_location', label: 'To' },
    { id: 'start_date', label: 'Date', format: (r) => formatDate(r.start_date) },
    { id: 'customer', label: 'Customer', format: (r) => r.customer?.name ?? '-' },
    { id: 'truck', label: 'Truck', format: (r) => r.truck?.truck_number ?? '-' },
    { id: 'total_km', label: 'KM', align: 'right' },
    { id: 'total_freight', label: 'Total Freight', align: 'right', format: (r) => formatCurrency(r.total_freight || 0) },
    { id: 'total_expense', label: 'Expense', align: 'right', format: (r) => formatCurrency(r.total_expense || 0) },
    { id: 'profit', label: 'Profit', align: 'right', format: (r) => formatCurrency(r.profit || 0) },
    {
      id: 'status',
      label: 'Status',
      format: (r) => (
        <Chip label={r.status.replace('_', ' ')} size="small" color={r.status === 'completed' ? 'success' : r.status === 'running' ? 'info' : 'warning'} />
      ),
    },
    {
      id: 'actions',
      label: '',
      align: 'right',
      format: (r) => (
        <IconButton size="small" onClick={() => navigate(`/trips/${r.id}/edit`)}>
          <EditIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  if (loading && rows.length === 0) return <LoadingSkeleton variant="table" />;

  return (
    <>
      <PageHeader
        title="Trips"
        subtitle="Trip entries, expenses and profit tracking"
        breadcrumbs={[{ label: 'Trips' }]}
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/trips/new')}>
            New Trip
          </Button>
        }
      />
      <FilterPanel
        loading={loading}
        onApply={() => setAppliedFilters({ ...filters })}
        onClear={() => {
          setFilters(initialFilters);
          setAppliedFilters(initialFilters);
        }}
      >
        <FilterField>
          <TextField
            select
            label="Status"
            fullWidth
            size="small"
            value={filters.status ?? ''}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="running">Running</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </TextField>
        </FilterField>
        <FilterField>
          <TextField
            select
            label="Customer"
            fullWidth
            size="small"
            value={filters.customer_id ?? ''}
            onChange={(e) => setFilters({ ...filters, customer_id: e.target.value })}
          >
            <MenuItem value="">All</MenuItem>
            {customers.map((c) => (
              <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
            ))}
          </TextField>
        </FilterField>
        <FilterField>
          <TextField
            select
            label="Truck"
            fullWidth
            size="small"
            value={filters.truck_id ?? ''}
            onChange={(e) => setFilters({ ...filters, truck_id: e.target.value })}
          >
            <MenuItem value="">All</MenuItem>
            {trucks.map((t) => (
              <MenuItem key={t.id} value={t.id}>{t.truck_number}</MenuItem>
            ))}
          </TextField>
        </FilterField>
        <FilterField>
          <TextField
            select
            label="Driver"
            fullWidth
            size="small"
            value={filters.driver_id ?? ''}
            onChange={(e) => setFilters({ ...filters, driver_id: e.target.value })}
          >
            <MenuItem value="">All</MenuItem>
            {drivers.map((d) => (
              <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
            ))}
          </TextField>
        </FilterField>
        <FilterField>
          <TextField
            label="From Date"
            type="date"
            fullWidth
            size="small"
            value={filters.date_from ?? ''}
            onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </FilterField>
        <FilterField>
          <TextField
            label="To Date"
            type="date"
            fullWidth
            size="small"
            value={filters.date_to ?? ''}
            onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </FilterField>
        <FilterField size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            label="Search"
            fullWidth
            size="small"
            placeholder="Trip #, from, to..."
            value={filters.search ?? ''}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </FilterField>
      </FilterPanel>
      <DataTable columns={columns} rows={rows} loading={loading} searchable={false} getRowId={(r) => r.id} />
    </>
  );
}
