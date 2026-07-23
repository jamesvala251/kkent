import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Tab,
  Tabs,
  TextField,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import ConstructionIcon from '@mui/icons-material/Construction';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import DataTable, { type Column } from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import FilterPanel, { FilterField } from '../../components/common/FilterPanel';
import { buildFilterParams, type FilterValues } from '../../utils/listFilters';
import api from '../../services/api';
import { deleteItem, fetchList, formatCurrency, formatDate } from '../../services/resourceService';
import type { Customer, HitachiMachine, HitachiRental, HitachiSummary } from '../../types';

type BillingType = 'hourly' | 'daily' | 'monthly';

const emptyRentalForm = {
  hitachi_id: '',
  customer_id: '',
  site_location: '',
  billing_type: 'hourly' as BillingType,
  start_date: dayjs().format('YYYY-MM-DD'),
  end_date: '',
  hours: '',
  days: '',
  months: '',
  rate: '',
  advance_received: '',
  operator_name: '',
  status: 'booked',
  notes: '',
};

const billingLabel: Record<BillingType, string> = {
  hourly: 'Hourly',
  daily: 'Daily',
  monthly: 'Monthly',
};

const statusColor = (status: string) => {
  if (status === 'running') return 'info';
  if (status === 'completed') return 'success';
  if (status === 'cancelled') return 'default';
  return 'warning';
};

const machineInitialFilters: FilterValues = { status: '', search: '' };
const rentalInitialFilters: FilterValues = { status: '', customer_id: '', hitachi_id: '', billing_type: '' };

export default function HitachiManagement() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<HitachiSummary>({
    total_machines: 0,
    on_rent: 0,
    active_rentals: 0,
    monthly_revenue: 0,
    pending_balance: 0,
  });
  const [machines, setMachines] = useState<HitachiMachine[]>([]);
  const [rentals, setRentals] = useState<HitachiRental[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [rentalDialogOpen, setRentalDialogOpen] = useState(false);
  const [editingRental, setEditingRental] = useState<HitachiRental | null>(null);
  const [rentalForm, setRentalForm] = useState(emptyRentalForm);
  const [saving, setSaving] = useState(false);

  const [deleteMachineId, setDeleteMachineId] = useState<number | null>(null);
  const [deleteRentalId, setDeleteRentalId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [machineFilters, setMachineFilters] = useState<FilterValues>(machineInitialFilters);
  const [appliedMachineFilters, setAppliedMachineFilters] = useState<FilterValues>(machineInitialFilters);
  const [rentalFilters, setRentalFilters] = useState<FilterValues>(rentalInitialFilters);
  const [appliedRentalFilters, setAppliedRentalFilters] = useState<FilterValues>(rentalInitialFilters);

  const selectedMachine = useMemo(
    () => machines.find((m) => m.id === Number(rentalForm.hitachi_id)),
    [machines, rentalForm.hitachi_id],
  );

  const estimatedTotal = useMemo(() => {
    const rate = Number(rentalForm.rate) || 0;
    if (rentalForm.billing_type === 'hourly') {
      return (Number(rentalForm.hours) || 0) * rate;
    }
    if (rentalForm.billing_type === 'daily') {
      let days = Number(rentalForm.days) || 0;
      if (!days && rentalForm.start_date && rentalForm.end_date) {
        days = Math.max(1, dayjs(rentalForm.end_date).diff(dayjs(rentalForm.start_date), 'day') + 1);
      }
      return days * rate;
    }
    let months = Number(rentalForm.months) || 0;
    if (!months && rentalForm.start_date && rentalForm.end_date) {
      const days = Math.max(1, dayjs(rentalForm.end_date).diff(dayjs(rentalForm.start_date), 'day') + 1);
      months = Math.round((days / 30) * 100) / 100;
    }
    return months * rate;
  }, [rentalForm]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, machinesList, rentalsRes, customersList] = await Promise.all([
        api.get<HitachiSummary>('/hitachi/summary'),
        fetchList<HitachiMachine>('/hitachi-machines', buildFilterParams(appliedMachineFilters)),
        api.get<{ data: HitachiRental[] } | HitachiRental[]>('/hitachi/rentals', {
          params: buildFilterParams(appliedRentalFilters),
        }),
        fetchList<Customer>('/customers', { per_page: 200 }),
      ]);

      setSummary(summaryRes.data ?? summary);
      setMachines(machinesList);
      const rentalData = rentalsRes.data;
      setRentals(Array.isArray(rentalData) ? rentalData : rentalData?.data ?? []);
      setCustomers(customersList);
    } catch {
      toast.error('Failed to load hitachi data');
    }
    setLoading(false);
  }, [appliedMachineFilters, appliedRentalFilters]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const applyMachineRate = (machineId: string, billingType: BillingType) => {
    const machine = machines.find((m) => m.id === Number(machineId));
    if (!machine) return '';
    if (billingType === 'daily') return String(machine.daily_rate ?? 0);
    if (billingType === 'monthly') return String(machine.monthly_rate ?? 0);
    return String(machine.hourly_rate ?? 0);
  };

  const openRentalDialog = (rental?: HitachiRental) => {
    if (rental) {
      setEditingRental(rental);
      setRentalForm({
        hitachi_id: String(rental.hitachi_id),
        customer_id: String(rental.customer_id),
        site_location: rental.site_location ?? '',
        billing_type: rental.billing_type,
        start_date: rental.start_date?.split('T')[0] ?? '',
        end_date: rental.end_date?.split('T')[0] ?? '',
        hours: rental.hours != null ? String(rental.hours) : '',
        days: rental.days != null ? String(rental.days) : '',
        months: rental.months != null ? String(rental.months) : '',
        rate: String(rental.rate ?? 0),
        advance_received: rental.advance_received != null ? String(rental.advance_received) : '',
        operator_name: rental.operator_name ?? '',
        status: rental.status,
        notes: rental.notes ?? '',
      });
    } else {
      setEditingRental(null);
      setRentalForm(emptyRentalForm);
    }
    setRentalDialogOpen(true);
  };

  const handleSaveRental = async () => {
    if (!rentalForm.hitachi_id || !rentalForm.customer_id || !rentalForm.start_date) {
      toast.error('Machine, customer and start date are required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        hitachi_id: Number(rentalForm.hitachi_id),
        customer_id: Number(rentalForm.customer_id),
        site_location: rentalForm.site_location || null,
        billing_type: rentalForm.billing_type,
        start_date: rentalForm.start_date,
        end_date: rentalForm.end_date || null,
        hours: rentalForm.billing_type === 'hourly' ? Number(rentalForm.hours) || 0 : undefined,
        days: rentalForm.billing_type === 'daily' ? Number(rentalForm.days) || undefined : undefined,
        months: rentalForm.billing_type === 'monthly' ? Number(rentalForm.months) || undefined : undefined,
        rate: rentalForm.rate ? Number(rentalForm.rate) : undefined,
        advance_received: Number(rentalForm.advance_received) || 0,
        operator_name: rentalForm.operator_name || null,
        status: rentalForm.status,
        notes: rentalForm.notes || null,
      };

      if (editingRental) {
        await api.put(`/hitachi/rentals/${editingRental.id}`, payload);
        toast.success('Rental updated');
      } else {
        await api.post('/hitachi/rentals', payload);
        toast.success('Hitachi rental created');
      }
      setRentalDialogOpen(false);
      loadAll();
    } catch {
      // interceptor
    }
    setSaving(false);
  };

  const handleDeleteMachine = async () => {
    if (!deleteMachineId) return;
    setDeleting(true);
    try {
      await deleteItem('/hitachi-machines', deleteMachineId);
      toast.success('Machine deleted');
      setDeleteMachineId(null);
      loadAll();
    } catch {
      toast.error('Failed to delete machine');
    }
    setDeleting(false);
  };

  const handleDeleteRental = async () => {
    if (!deleteRentalId) return;
    setDeleting(true);
    try {
      await deleteItem('/hitachi/rentals', deleteRentalId);
      toast.success('Rental deleted');
      setDeleteRentalId(null);
      loadAll();
    } catch {
      toast.error('Failed to delete rental');
    }
    setDeleting(false);
  };

  const machineColumns: Column<HitachiMachine>[] = [
    { id: 'machine_number', label: 'Machine #', minWidth: 120 },
    { id: 'model', label: 'Model' },
    { id: 'owner', label: 'Owner' },
    { id: 'hourly_rate', label: 'Hourly', align: 'right', format: (r) => formatCurrency(Number(r.hourly_rate) || 0) },
    { id: 'daily_rate', label: 'Daily', align: 'right', format: (r) => formatCurrency(Number(r.daily_rate) || 0) },
    { id: 'monthly_rate', label: 'Monthly', align: 'right', format: (r) => formatCurrency(Number(r.monthly_rate) || 0) },
    {
      id: 'rental_status',
      label: 'On Rent',
      format: (r) =>
        r.active_rental ? (
          <Chip label={r.active_rental.status} size="small" color={statusColor(r.active_rental.status)} />
        ) : (
          <Chip label="Available" size="small" variant="outlined" />
        ),
    },
    {
      id: 'status',
      label: 'Status',
      format: (r) => <Chip label={r.status} size="small" color={r.status === 'active' ? 'success' : 'default'} />,
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      format: (row) => (
        <>
          <IconButton size="small" onClick={() => navigate(`/hitachi/${row.id}/edit`)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => setDeleteMachineId(row.id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </>
      ),
    },
  ];

  const rentalColumns: Column<HitachiRental>[] = [
    { id: 'rental_number', label: 'Rental #', minWidth: 120 },
    { id: 'hitachi', label: 'Machine', format: (r) => r.hitachi?.machine_number ?? '-' },
    { id: 'customer', label: 'Customer', format: (r) => r.customer?.name ?? '-' },
    { id: 'site_location', label: 'Site' },
    {
      id: 'billing_type',
      label: 'Billing',
      format: (r) => <Chip label={billingLabel[r.billing_type]} size="small" />,
    },
    {
      id: 'period',
      label: 'Period',
      format: (r) => `${formatDate(r.start_date)}${r.end_date ? ` → ${formatDate(r.end_date)}` : ''}`,
    },
    {
      id: 'units',
      label: 'Units',
      align: 'right',
      format: (r) => {
        if (r.billing_type === 'hourly') return `${r.hours ?? 0} hrs`;
        if (r.billing_type === 'daily') return `${r.days ?? 0} days`;
        return `${r.months ?? 0} mo`;
      },
    },
    { id: 'rate', label: 'Rate', align: 'right', format: (r) => formatCurrency(Number(r.rate)) },
    { id: 'total_amount', label: 'Total', align: 'right', format: (r) => formatCurrency(Number(r.total_amount)) },
    { id: 'balance', label: 'Balance', align: 'right', format: (r) => formatCurrency(Number(r.balance) || 0) },
    {
      id: 'status',
      label: 'Status',
      format: (r) => <Chip label={r.status} size="small" color={statusColor(r.status)} />,
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      format: (row) => (
        <>
          <IconButton
            size="small"
            color="primary"
            title="Create invoice"
            onClick={() => navigate(`/invoices/new?hitachi_rental_id=${row.id}`)}
          >
            <RequestQuoteIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => openRentalDialog(row)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => setDeleteRentalId(row.id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </>
      ),
    },
  ];

  if (loading) return <LoadingSkeleton variant="table" rows={8} />;

  return (
    <Box>
      <PageHeader
        title="Hitachi Management"
        subtitle="Rent excavators on hourly, daily or monthly basis — track deployments and billing"
        breadcrumbs={[{ label: 'Hitachi' }]}
        action={
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => navigate('/hitachi/new')}>
              Add Machine
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => openRentalDialog()}>
              New Rental
            </Button>
          </Box>
        }
      />

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <StatCard title="Machines" value={summary.total_machines} icon={<ConstructionIcon />} color="#1a237e" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <StatCard title="On Rent" value={summary.on_rent} icon={<ScheduleIcon />} color="#ed6c02" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <StatCard title="Active Rentals" value={summary.active_rentals} icon={<ScheduleIcon />} color="#1565c0" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <StatCard title="Monthly Revenue" value={formatCurrency(summary.monthly_revenue)} icon={<AccountBalanceWalletIcon />} color="#2e7d32" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <StatCard title="Pending Balance" value={formatCurrency(summary.pending_balance)} icon={<AccountBalanceWalletIcon />} color="#6a1b9a" />
        </Grid>
      </Grid>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Machines & Rates" />
          <Tab label="Rentals & Billing" />
        </Tabs>
      </Box>

      {tab === 0 && (
        <>
          <FilterPanel
            loading={loading}
            onApply={() => setAppliedMachineFilters({ ...machineFilters })}
            onClear={() => {
              setMachineFilters(machineInitialFilters);
              setAppliedMachineFilters(machineInitialFilters);
            }}
          >
            <FilterField>
              <TextField
                select
                label="Status"
                fullWidth
                size="small"
                value={machineFilters.status ?? ''}
                onChange={(e) => setMachineFilters({ ...machineFilters, status: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="maintenance">Maintenance</MenuItem>
                <MenuItem value="breakdown">Breakdown</MenuItem>
              </TextField>
            </FilterField>
            <FilterField size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                label="Search"
                fullWidth
                size="small"
                placeholder="Machine #, model, owner..."
                value={machineFilters.search ?? ''}
                onChange={(e) => setMachineFilters({ ...machineFilters, search: e.target.value })}
              />
            </FilterField>
          </FilterPanel>
          <DataTable columns={machineColumns} rows={machines} loading={loading} searchable={false} getRowId={(r) => r.id} />
        </>
      )}
      {tab === 1 && (
        <>
          <FilterPanel
            loading={loading}
            onApply={() => setAppliedRentalFilters({ ...rentalFilters })}
            onClear={() => {
              setRentalFilters(rentalInitialFilters);
              setAppliedRentalFilters(rentalInitialFilters);
            }}
          >
            <FilterField>
              <TextField
                select
                label="Status"
                fullWidth
                size="small"
                value={rentalFilters.status ?? ''}
                onChange={(e) => setRentalFilters({ ...rentalFilters, status: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="booked">Booked</MenuItem>
                <MenuItem value="running">Running</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </TextField>
            </FilterField>
            <FilterField>
              <TextField
                select
                label="Machine"
                fullWidth
                size="small"
                value={rentalFilters.hitachi_id ?? ''}
                onChange={(e) => setRentalFilters({ ...rentalFilters, hitachi_id: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                {machines.map((m) => (
                  <MenuItem key={m.id} value={m.id}>{m.machine_number}</MenuItem>
                ))}
              </TextField>
            </FilterField>
            <FilterField>
              <TextField
                select
                label="Customer"
                fullWidth
                size="small"
                value={rentalFilters.customer_id ?? ''}
                onChange={(e) => setRentalFilters({ ...rentalFilters, customer_id: e.target.value })}
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
                label="Billing Type"
                fullWidth
                size="small"
                value={rentalFilters.billing_type ?? ''}
                onChange={(e) => setRentalFilters({ ...rentalFilters, billing_type: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="hourly">Hourly</MenuItem>
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </TextField>
            </FilterField>
          </FilterPanel>
          <DataTable columns={rentalColumns} rows={rentals} loading={loading} searchable={false} getRowId={(r) => r.id} />
        </>
      )}

      <Dialog open={rentalDialogOpen} onClose={() => setRentalDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingRental ? 'Edit Hitachi Rental' : 'New Hitachi Rental'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Hitachi Machine"
                select
                fullWidth
                value={rentalForm.hitachi_id}
                onChange={(e) => {
                  const rate = applyMachineRate(e.target.value, rentalForm.billing_type);
                  setRentalForm({ ...rentalForm, hitachi_id: e.target.value, rate });
                }}
              >
                {machines.map((m) => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.machine_number} {m.model ? `(${m.model})` : ''}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Customer"
                select
                fullWidth
                value={rentalForm.customer_id}
                onChange={(e) => setRentalForm({ ...rentalForm, customer_id: e.target.value })}
              >
                {customers.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField label="Site Location" fullWidth value={rentalForm.site_location} onChange={(e) => setRentalForm({ ...rentalForm, site_location: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Billing Type"
                select
                fullWidth
                value={rentalForm.billing_type}
                onChange={(e) => {
                  const billingType = e.target.value as BillingType;
                  const rate = applyMachineRate(rentalForm.hitachi_id, billingType);
                  setRentalForm({ ...rentalForm, billing_type: billingType, rate });
                }}
              >
                <MenuItem value="hourly">Hourly</MenuItem>
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField label="Start Date" type="date" fullWidth value={rentalForm.start_date} onChange={(e) => setRentalForm({ ...rentalForm, start_date: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField label="End Date" type="date" fullWidth value={rentalForm.end_date} onChange={(e) => setRentalForm({ ...rentalForm, end_date: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} helperText="Required for daily/monthly auto-calculation" />
            </Grid>

            {rentalForm.billing_type === 'hourly' && (
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField label="Hours" type="number" fullWidth value={rentalForm.hours} onChange={(e) => setRentalForm({ ...rentalForm, hours: e.target.value })} />
              </Grid>
            )}
            {rentalForm.billing_type === 'daily' && (
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField label="Days" type="number" fullWidth value={rentalForm.days} onChange={(e) => setRentalForm({ ...rentalForm, days: e.target.value })} helperText="Leave empty to auto-calc from dates" />
              </Grid>
            )}
            {rentalForm.billing_type === 'monthly' && (
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField label="Months" type="number" fullWidth value={rentalForm.months} onChange={(e) => setRentalForm({ ...rentalForm, months: e.target.value })} helperText="Leave empty to auto-calc (days ÷ 30)" />
              </Grid>
            )}

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label={`Rate (${billingLabel[rentalForm.billing_type]})`}
                type="number"
                fullWidth
                value={rentalForm.rate}
                onChange={(e) => setRentalForm({ ...rentalForm, rate: e.target.value })}
                helperText={selectedMachine ? 'Auto-filled from machine rates' : undefined}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Advance Received (₹)" type="number" fullWidth value={rentalForm.advance_received} onChange={(e) => setRentalForm({ ...rentalForm, advance_received: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Operator Name" fullWidth value={rentalForm.operator_name} onChange={(e) => setRentalForm({ ...rentalForm, operator_name: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Status" select fullWidth value={rentalForm.status} onChange={(e) => setRentalForm({ ...rentalForm, status: e.target.value })}>
                <MenuItem value="booked">Booked</MenuItem>
                <MenuItem value="running">Running</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Estimated Total" fullWidth value={formatCurrency(estimatedTotal)} slotProps={{ input: { readOnly: true } }} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Estimated Balance" fullWidth value={formatCurrency(estimatedTotal - (Number(rentalForm.advance_received) || 0))} slotProps={{ input: { readOnly: true } }} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField label="Notes" fullWidth multiline rows={2} value={rentalForm.notes} onChange={(e) => setRentalForm({ ...rentalForm, notes: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRentalDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveRental} disabled={saving}>
            {editingRental ? 'Update Rental' : 'Save Rental'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={!!deleteMachineId} title="Delete Machine" message="Delete this hitachi machine?" confirmText="Delete" severity="error" loading={deleting} onConfirm={handleDeleteMachine} onCancel={() => setDeleteMachineId(null)} />
      <ConfirmDialog open={!!deleteRentalId} title="Delete Rental" message="Delete this rental record?" confirmText="Delete" severity="error" loading={deleting} onConfirm={handleDeleteRental} onCancel={() => setDeleteRentalId(null)} />
    </Box>
  );
}
