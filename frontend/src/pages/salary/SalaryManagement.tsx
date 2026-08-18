import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  MenuItem,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { type Column } from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import api from '../../services/api';
import { createItem, deleteItem, fetchList, formatDate, updateItem } from '../../services/resourceService';
import type { Driver, SalaryAdvance, SalaryReconciliationRow } from '../../types';

const money = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(Number(value) || 0);

const emptyForm = {
  driver_id: '',
  advance_date: dayjs().format('YYYY-MM-DD'),
  amount: '',
  remarks: '',
};

const emptyFilters = {
  driver_id: '',
  date_from: '',
  date_to: '',
};

export default function SalaryManagement() {
  const [tab, setTab] = useState(0);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [advances, setAdvances] = useState<SalaryAdvance[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filters, setFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [reconMonth, setReconMonth] = useState(dayjs().format('YYYY-MM'));
  const [reconDriverId, setReconDriverId] = useState('');
  const [reconRows, setReconRows] = useState<SalaryReconciliationRow[]>([]);
  const [reconLoading, setReconLoading] = useState(false);

  useEffect(() => {
    fetchList<Driver>('/drivers', { per_page: 200 }).then(setDrivers);
  }, []);

  const loadAdvances = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string | number> = { per_page: 500 };
    Object.entries(appliedFilters).forEach(([key, value]) => {
      if (value !== '') params[key] = value;
    });
    const data = await fetchList<SalaryAdvance>('/salary-advances', params);
    setAdvances(data);
    setLoading(false);
  }, [appliedFilters]);

  useEffect(() => {
    loadAdvances();
  }, [loadAdvances]);

  const loadReconciliation = useCallback(async () => {
    setReconLoading(true);
    try {
      const { data } = await api.get<{ rows: SalaryReconciliationRow[] }>('/salary-advances/reconcile', {
        params: {
          month: reconMonth,
          ...(reconDriverId ? { driver_id: reconDriverId } : {}),
        },
      });
      setReconRows(data?.rows ?? []);
    } catch {
      setReconRows([]);
    } finally {
      setReconLoading(false);
    }
  }, [reconMonth, reconDriverId]);

  useEffect(() => {
    if (tab === 1) loadReconciliation();
  }, [tab, loadReconciliation]);

  const advanceTotal = useMemo(
    () => advances.reduce((sum, row) => sum + Number(row.amount || 0), 0),
    [advances],
  );

  const reconTotals = useMemo(() => {
    const trip = reconRows.reduce((sum, row) => sum + Number(row.total_trip_salary || 0), 0);
    const advanced = reconRows.reduce((sum, row) => sum + Number(row.total_advanced_salary || 0), 0);
    return { trip, advanced, remaining: trip - advanced };
  }, [reconRows]);

  const handleSave = async () => {
    if (!form.driver_id || !form.advance_date || !form.amount) {
      toast.error('Driver, date and advance salary are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        driver_id: Number(form.driver_id),
        advance_date: form.advance_date,
        amount: Number(form.amount),
        remarks: form.remarks || undefined,
      };
      if (editingId) {
        await updateItem<SalaryAdvance>('/salary-advances', editingId, payload);
        toast.success('Advance salary updated');
      } else {
        await createItem<SalaryAdvance>('/salary-advances', payload);
        toast.success('Advance salary saved');
      }
      setForm(emptyForm);
      setEditingId(null);
      loadAdvances();
    } catch {
      // interceptor
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (row: SalaryAdvance) => {
    setEditingId(row.id);
    setForm({
      driver_id: String(row.driver_id),
      advance_date: row.advance_date?.split('T')[0] ?? '',
      amount: String(row.amount ?? ''),
      remarks: row.remarks ?? '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteItem('/salary-advances', deleteId);
      toast.success('Advance salary deleted');
      setDeleteId(null);
      loadAdvances();
    } catch {
      toast.error('Failed to delete record');
    } finally {
      setDeleting(false);
    }
  };

  const advanceColumns: Column<SalaryAdvance>[] = [
    {
      id: 'driver',
      label: 'Driver Name',
      format: (r) => <Chip label={r.driver?.name ?? `Driver #${r.driver_id}`} size="small" color="primary" variant="outlined" />,
    },
    { id: 'advance_date', label: 'Date', format: (r) => formatDate(r.advance_date) },
    { id: 'amount', label: 'Advance Salary', align: 'right', format: (r) => money(Number(r.amount)) },
    { id: 'remarks', label: 'Remarks', format: (r) => r.remarks || '-' },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      format: (row) => (
        <>
          <IconButton size="small" color="primary" onClick={() => startEdit(row)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => setDeleteId(row.id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </>
      ),
    },
  ];

  const reconColumns: Column<SalaryReconciliationRow>[] = useMemo(
    () => [
      { id: 'driver_name', label: 'Driver Name' },
      { id: 'total_trip_salary', label: 'Total Trip Salary', align: 'right', format: (r) => money(r.total_trip_salary) },
      { id: 'total_advanced_salary', label: 'Total Advanced Salary', align: 'right', format: (r) => money(r.total_advanced_salary) },
      {
        id: 'remaining_salary',
        label: 'Remaining Salary',
        align: 'right',
        format: (r) => (
          <Typography fontWeight={700} color={r.remaining_salary < 0 ? 'error.main' : 'success.main'}>
            {money(r.remaining_salary)}
          </Typography>
        ),
      },
    ],
    [],
  );

  if (loading && advances.length === 0 && tab === 0) return <LoadingSkeleton variant="table" />;

  return (
    <Box>
      <PageHeader
        title={tab === 1 ? 'Monthly Salary Reconciliation' : 'Driver Salary Management'}
        subtitle={
          tab === 1
            ? 'View total driver salary from trips and compare with advanced salary given to calculate remaining salary.'
            : 'Record advance salary paid to drivers'
        }
        breadcrumbs={[{ label: 'Salary' }]}
      />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2.5 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Driver Salary Management" />
          <Tab label="Monthly Salary Reconciliation" />
        </Tabs>
      </Box>

      {tab === 0 && (
        <>
          <Card sx={{ mb: 2.5 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                {editingId ? 'Edit Driver Salary' : 'Add New Driver Salary'}
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    select
                    required
                    label="Driver Name"
                    fullWidth
                    value={form.driver_id}
                    onChange={(e) => setForm({ ...form, driver_id: e.target.value })}
                  >
                    <MenuItem value="">Select driver</MenuItem>
                    {drivers.map((d) => (
                      <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    required
                    label="Date"
                    type="date"
                    fullWidth
                    value={form.advance_date}
                    onChange={(e) => setForm({ ...form, advance_date: e.target.value })}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    required
                    label="Advance Salary"
                    type="number"
                    fullWidth
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Remarks"
                    fullWidth
                    multiline
                    rows={2}
                    value={form.remarks}
                    onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Button variant="contained" startIcon={<AddIcon />} onClick={handleSave} disabled={saving}>
                    {editingId ? 'Update' : 'Save'}
                  </Button>
                  {editingId && (
                    <Button sx={{ ml: 1 }} onClick={() => { setEditingId(null); setForm(emptyForm); }}>
                      Cancel
                    </Button>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ mb: 2.5 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField select label="Driver" fullWidth size="small" value={filters.driver_id} onChange={(e) => setFilters({ ...filters, driver_id: e.target.value })}>
                    <MenuItem value="">All</MenuItem>
                    {drivers.map((d) => (
                      <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField label="From Date" type="date" fullWidth size="small" value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField label="To Date" type="date" fullWidth size="small" value={filters.date_to} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="contained" size="small" onClick={() => setAppliedFilters({ ...filters })}>Apply</Button>
                    <Button variant="outlined" size="small" onClick={() => { setFilters(emptyFilters); setAppliedFilters(emptyFilters); }}>Clear</Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <DataTable
            columns={advanceColumns}
            rows={advances}
            loading={loading}
            searchable={false}
            getRowId={(r) => r.id}
            defaultRowsPerPage={25}
            emptyMessage="No salary records found"
            footer={{
              driver: 'Total',
              amount: money(advanceTotal),
            }}
          />
          <Box
            sx={{
              mt: 1.5,
              px: 3,
              py: 2,
              display: 'flex',
              justifyContent: 'flex-end',
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
            }}
          >
            <Typography variant="subtitle1" fontWeight={700}>
              Total Amount: {money(advanceTotal)}
            </Typography>
          </Box>
        </>
      )}

      {tab === 1 && (
        <>
          <Card sx={{ mb: 2.5 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    select
                    label="Driver"
                    fullWidth
                    value={reconDriverId}
                    onChange={(e) => setReconDriverId(e.target.value)}
                  >
                    <MenuItem value="">All Drivers</MenuItem>
                    {drivers.map((d) => (
                      <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="Select Month"
                    type="month"
                    fullWidth
                    value={reconMonth}
                    onChange={(e) => setReconMonth(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Button variant="contained" onClick={loadReconciliation} disabled={reconLoading}>
                    Generate
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          <DataTable
            columns={reconColumns}
            rows={reconRows}
            loading={reconLoading}
            searchable={false}
            getRowId={(r) => r.driver_id}
            emptyMessage="No reconciliation data for this month"
            defaultRowsPerPage={25}
            footer={{
              driver_name: 'Total',
              total_trip_salary: money(reconTotals.trip),
              total_advanced_salary: money(reconTotals.advanced),
              remaining_salary: money(reconTotals.remaining),
            }}
          />
          <Box
            sx={{
              mt: 1.5,
              px: 3,
              py: 2,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: { xs: 2, md: 4 },
              flexWrap: 'wrap',
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
            }}
          >
            <Typography variant="subtitle1" fontWeight={700}>
              Total Trip Salary: {money(reconTotals.trip)}
            </Typography>
            <Typography variant="subtitle1" fontWeight={700} color="text.secondary">
              Total Advance: {money(reconTotals.advanced)}
            </Typography>
            <Typography variant="subtitle1" fontWeight={700} color={reconTotals.remaining < 0 ? 'error.main' : 'success.main'}>
              Remaining: {money(reconTotals.remaining)}
            </Typography>
          </Box>
        </>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Advance Salary"
        message="Are you sure you want to delete this salary record?"
        confirmText="Delete"
        severity="error"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
}
