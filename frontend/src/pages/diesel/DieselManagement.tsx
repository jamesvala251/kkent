import { useCallback, useEffect, useState } from 'react';
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
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import InventoryIcon from '@mui/icons-material/Inventory';
import IconButton from '@mui/material/IconButton';
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
import type {
  DieselIssue,
  DieselLedgerEntry,
  DieselPurchase,
  DieselSummary,
  HitachiMachine,
  Trip,
  Truck,
} from '../../types';

interface AvailablePurchase {
  id: number;
  purchase_date: string;
  supplier?: string;
  bill_number?: string;
  remaining_quantity: number;
  rate_per_liter: number;
}

const emptyPurchaseForm = {
  purchase_date: dayjs().format('YYYY-MM-DD'),
  supplier: '',
  bill_number: '',
  quantity: '',
  rate_per_liter: '',
  notes: '',
};

const emptyIssueForm = {
  issue_date: dayjs().format('YYYY-MM-DD'),
  quantity: '',
  rate_per_liter: '',
  vehicle_type: 'truck' as 'truck' | 'hitachi',
  truck_id: '',
  hitachi_id: '',
  trip_id: '',
  diesel_purchase_id: '',
  notes: '',
};

const purchaseInitialFilters: FilterValues = { date_from: '', date_to: '' };
const issueInitialFilters: FilterValues = { date_from: '', date_to: '', truck_id: '' };
const ledgerInitialFilters: FilterValues = { date_from: '', date_to: '' };

export default function DieselManagement() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DieselSummary>({ total_in: 0, total_out: 0, stock_balance: 0, total_expense: 0 });
  const [purchases, setPurchases] = useState<DieselPurchase[]>([]);
  const [issues, setIssues] = useState<DieselIssue[]>([]);
  const [ledger, setLedger] = useState<DieselLedgerEntry[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [machines, setMachines] = useState<HitachiMachine[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [availablePurchases, setAvailablePurchases] = useState<AvailablePurchase[]>([]);
  const [defaultRate, setDefaultRate] = useState<number>(0);

  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<DieselPurchase | null>(null);
  const [purchaseForm, setPurchaseForm] = useState(emptyPurchaseForm);
  const [issueForm, setIssueForm] = useState(emptyIssueForm);
  const [saving, setSaving] = useState(false);

  const [deletePurchaseId, setDeletePurchaseId] = useState<number | null>(null);
  const [deleteIssueId, setDeleteIssueId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [purchaseFilters, setPurchaseFilters] = useState<FilterValues>(purchaseInitialFilters);
  const [appliedPurchaseFilters, setAppliedPurchaseFilters] = useState<FilterValues>(purchaseInitialFilters);
  const [issueFilters, setIssueFilters] = useState<FilterValues>(issueInitialFilters);
  const [appliedIssueFilters, setAppliedIssueFilters] = useState<FilterValues>(issueInitialFilters);
  const [ledgerFilters, setLedgerFilters] = useState<FilterValues>(ledgerInitialFilters);
  const [appliedLedgerFilters, setAppliedLedgerFilters] = useState<FilterValues>(ledgerInitialFilters);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, purchasesRes, issuesRes, ledgerRes, trucksList, machinesList, tripsList, availableRes, settingsRes] =
        await Promise.all([
          api.get<DieselSummary>('/diesel/summary'),
          api.get<{ data: DieselPurchase[] } | DieselPurchase[]>('/diesel/purchases', {
            params: buildFilterParams(appliedPurchaseFilters),
          }),
          api.get<{ data: DieselIssue[] } | DieselIssue[]>('/diesel/issues', {
            params: buildFilterParams(appliedIssueFilters),
          }),
          api.get<DieselLedgerEntry[]>('/diesel/ledger', { params: buildFilterParams(appliedLedgerFilters) }),
          fetchList<Truck>('/trucks'),
          fetchList<HitachiMachine>('/hitachi-machines'),
          fetchList<Trip>('/trips', { per_page: 100 }),
          api.get<AvailablePurchase[]>('/diesel/available-purchases'),
          api.get<{ diesel_default_price?: number }>('/settings').catch(() => ({ data: {} })),
        ]);

      setSummary(summaryRes.data ?? { total_in: 0, total_out: 0, stock_balance: 0, total_expense: 0 });

      const purchaseData = purchasesRes.data;
      setPurchases(Array.isArray(purchaseData) ? purchaseData : purchaseData?.data ?? []);

      const issueData = issuesRes.data;
      setIssues(Array.isArray(issueData) ? issueData : issueData?.data ?? []);

      setLedger(Array.isArray(ledgerRes.data) ? ledgerRes.data : []);
      setTrucks(trucksList);
      setMachines(machinesList);
      setTrips(tripsList);
      setAvailablePurchases(Array.isArray(availableRes.data) ? availableRes.data : []);
      setDefaultRate(Number(settingsRes.data?.diesel_default_price) || 0);
    } catch {
      toast.error('Failed to load diesel data');
    }
    setLoading(false);
  }, [appliedPurchaseFilters, appliedIssueFilters, appliedLedgerFilters]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const openPurchaseDialog = (purchase?: DieselPurchase) => {
    if (purchase) {
      setEditingPurchase(purchase);
      setPurchaseForm({
        purchase_date: purchase.purchase_date?.split('T')[0] ?? '',
        supplier: purchase.supplier ?? '',
        bill_number: purchase.bill_number ?? '',
        quantity: String(purchase.quantity),
        rate_per_liter: String(purchase.rate_per_liter),
        notes: purchase.notes ?? '',
      });
    } else {
      setEditingPurchase(null);
      setPurchaseForm({ ...emptyPurchaseForm, rate_per_liter: defaultRate ? String(defaultRate) : '' });
    }
    setPurchaseDialogOpen(true);
  };

  const openIssueDialog = () => {
    setIssueForm({ ...emptyIssueForm, rate_per_liter: defaultRate ? String(defaultRate) : '' });
    setIssueDialogOpen(true);
  };

  const handleSavePurchase = async () => {
    const quantity = Number(purchaseForm.quantity);
    const rate = Number(purchaseForm.rate_per_liter);
    if (!purchaseForm.purchase_date || !quantity || !rate) {
      toast.error('Date, quantity and rate are required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        purchase_date: purchaseForm.purchase_date,
        supplier: purchaseForm.supplier || null,
        bill_number: purchaseForm.bill_number || null,
        quantity,
        rate_per_liter: rate,
        notes: purchaseForm.notes || null,
      };

      if (editingPurchase) {
        await api.put(`/diesel/purchases/${editingPurchase.id}`, payload);
        toast.success('Purchase updated');
      } else {
        await api.post('/diesel/purchases', payload);
        toast.success('Diesel IN recorded and expense mapped');
      }
      setPurchaseDialogOpen(false);
      loadAll();
    } catch {
      // interceptor shows error
    }
    setSaving(false);
  };

  const handleSaveIssue = async () => {
    const quantity = Number(issueForm.quantity);
    if (!issueForm.issue_date || !quantity) {
      toast.error('Date and quantity are required');
      return;
    }
    if (issueForm.vehicle_type === 'truck' && !issueForm.truck_id) {
      toast.error('Select a truck');
      return;
    }
    if (issueForm.vehicle_type === 'hitachi' && !issueForm.hitachi_id) {
      toast.error('Select a hitachi machine');
      return;
    }

    setSaving(true);
    try {
      await api.post('/diesel/issues', {
        issue_date: issueForm.issue_date,
        quantity,
        rate_per_liter: issueForm.rate_per_liter ? Number(issueForm.rate_per_liter) : undefined,
        truck_id: issueForm.vehicle_type === 'truck' ? Number(issueForm.truck_id) : null,
        hitachi_id: issueForm.vehicle_type === 'hitachi' ? Number(issueForm.hitachi_id) : null,
        trip_id: issueForm.trip_id ? Number(issueForm.trip_id) : null,
        diesel_purchase_id: issueForm.diesel_purchase_id ? Number(issueForm.diesel_purchase_id) : null,
        notes: issueForm.notes || null,
      });
      toast.success('Diesel OUT recorded');
      setIssueDialogOpen(false);
      loadAll();
    } catch {
      // interceptor shows error
    }
    setSaving(false);
  };

  const handleDeletePurchase = async () => {
    if (!deletePurchaseId) return;
    setDeleting(true);
    try {
      await deleteItem('/diesel/purchases', deletePurchaseId);
      toast.success('Purchase deleted');
      setDeletePurchaseId(null);
      loadAll();
    } catch {
      toast.error('Failed to delete purchase');
    }
    setDeleting(false);
  };

  const handleDeleteIssue = async () => {
    if (!deleteIssueId) return;
    setDeleting(true);
    try {
      await deleteItem('/diesel/issues', deleteIssueId);
      toast.success('Issue deleted and stock restored');
      setDeleteIssueId(null);
      loadAll();
    } catch {
      toast.error('Failed to delete issue');
    }
    setDeleting(false);
  };

  const purchaseColumns: Column<DieselPurchase>[] = [
    { id: 'purchase_date', label: 'Date', format: (r) => formatDate(r.purchase_date) },
    { id: 'supplier', label: 'Supplier / Tanker', format: (r) => r.supplier || r.bill_number || '-' },
    { id: 'quantity', label: 'Qty (L)', align: 'right', format: (r) => `${Number(r.quantity).toLocaleString('en-IN')} L` },
    { id: 'remaining_quantity', label: 'Remaining', align: 'right', format: (r) => `${Number(r.remaining_quantity).toLocaleString('en-IN')} L` },
    { id: 'rate_per_liter', label: 'Rate/L', align: 'right', format: (r) => formatCurrency(Number(r.rate_per_liter)) },
    { id: 'total_amount', label: 'Amount', align: 'right', format: (r) => formatCurrency(Number(r.total_amount)) },
    {
      id: 'expense_id',
      label: 'Expense',
      format: (r) => (r.expense_id ? <Chip label="Mapped" size="small" color="success" /> : '-'),
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      format: (row) => (
        <>
          <IconButton size="small" onClick={() => openPurchaseDialog(row)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => setDeletePurchaseId(row.id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </>
      ),
    },
  ];

  const issueColumns: Column<DieselIssue>[] = [
    { id: 'issue_date', label: 'Date', format: (r) => formatDate(r.issue_date) },
    {
      id: 'vehicle',
      label: 'Truck / Hitachi',
      format: (r) => r.truck?.truck_number ?? r.hitachi?.machine_number ?? '-',
    },
    { id: 'trip', label: 'Trip', format: (r) => r.trip?.trip_number ?? '-' },
    { id: 'quantity', label: 'Qty (L)', align: 'right', format: (r) => `${Number(r.quantity).toLocaleString('en-IN')} L` },
    { id: 'rate_per_liter', label: 'Rate/L', align: 'right', format: (r) => formatCurrency(Number(r.rate_per_liter)) },
    { id: 'total_amount', label: 'Value', align: 'right', format: (r) => formatCurrency(Number(r.total_amount)) },
    { id: 'notes', label: 'Notes' },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      format: (row) => (
        <IconButton size="small" color="error" onClick={() => setDeleteIssueId(row.id)}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  const ledgerColumns: Column<DieselLedgerEntry>[] = [
    {
      id: 'type',
      label: 'Type',
      format: (r) => (
        <Chip
          icon={r.type === 'in' ? <ArrowDownwardIcon /> : <ArrowUpwardIcon />}
          label={r.type === 'in' ? 'IN' : 'OUT'}
          size="small"
          color={r.type === 'in' ? 'success' : 'warning'}
        />
      ),
    },
    { id: 'date', label: 'Date', format: (r) => formatDate(r.date) },
    { id: 'reference', label: 'Reference', minWidth: 180 },
    { id: 'vehicle', label: 'Truck / Hitachi', format: (r) => r.vehicle ?? '-' },
    { id: 'quantity', label: 'Qty (L)', align: 'right', format: (r) => `${Number(r.quantity).toLocaleString('en-IN')} L` },
    { id: 'rate_per_liter', label: 'Rate/L', align: 'right', format: (r) => formatCurrency(Number(r.rate_per_liter)) },
    { id: 'total_amount', label: 'Amount', align: 'right', format: (r) => formatCurrency(Number(r.total_amount)) },
    {
      id: 'remaining_quantity',
      label: 'Stock After (IN)',
      align: 'right',
      format: (r) => (r.type === 'in' && r.remaining_quantity != null ? `${Number(r.remaining_quantity).toLocaleString('en-IN')} L` : '-'),
    },
    {
      id: 'expense_id',
      label: 'Expense',
      format: (r) => (r.expense_id ? <Chip label="Yes" size="small" color="success" /> : '-'),
    },
  ];

  if (loading) return <LoadingSkeleton variant="table" rows={8} />;

  return (
    <Box>
      <PageHeader
        title="Diesel Management"
        subtitle="Track diesel IN (purchases) and OUT (fuel to trucks & hitachi) with expense mapping"
        breadcrumbs={[{ label: 'Diesel Management' }]}
        action={
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button variant="contained" color="success" startIcon={<ArrowDownwardIcon />} onClick={() => openPurchaseDialog()}>
              Diesel IN
            </Button>
            <Button variant="contained" color="warning" startIcon={<ArrowUpwardIcon />} onClick={openIssueDialog}>
              Diesel OUT
            </Button>
          </Box>
        }
      />

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard title="Total IN" value={`${summary.total_in.toLocaleString('en-IN')} L`} icon={<ArrowDownwardIcon />} color="#2e7d32" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard title="Total OUT" value={`${summary.total_out.toLocaleString('en-IN')} L`} icon={<ArrowUpwardIcon />} color="#ed6c02" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard title="Stock Balance" value={`${summary.stock_balance.toLocaleString('en-IN')} L`} icon={<InventoryIcon />} color="#1565c0" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard title="Purchase Expense" value={formatCurrency(summary.total_expense)} icon={<LocalGasStationIcon />} color="#6a1b9a" />
        </Grid>
      </Grid>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tab} onChange={(_, value) => setTab(value)}>
          <Tab label="Purchases (IN)" />
          <Tab label="Issues (OUT)" />
          <Tab label="In / Out Report" />
        </Tabs>
      </Box>

      {tab === 0 && (
        <>
          <FilterPanel
            loading={loading}
            onApply={() => setAppliedPurchaseFilters({ ...purchaseFilters })}
            onClear={() => {
              setPurchaseFilters(purchaseInitialFilters);
              setAppliedPurchaseFilters(purchaseInitialFilters);
            }}
          >
            <FilterField>
              <TextField
                label="From Date"
                type="date"
                fullWidth
                size="small"
                value={purchaseFilters.date_from ?? ''}
                onChange={(e) => setPurchaseFilters({ ...purchaseFilters, date_from: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </FilterField>
            <FilterField>
              <TextField
                label="To Date"
                type="date"
                fullWidth
                size="small"
                value={purchaseFilters.date_to ?? ''}
                onChange={(e) => setPurchaseFilters({ ...purchaseFilters, date_to: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </FilterField>
          </FilterPanel>
          <DataTable columns={purchaseColumns} rows={purchases} loading={loading} searchable={false} getRowId={(r) => r.id} />
        </>
      )}
      {tab === 1 && (
        <>
          <FilterPanel
            loading={loading}
            onApply={() => setAppliedIssueFilters({ ...issueFilters })}
            onClear={() => {
              setIssueFilters(issueInitialFilters);
              setAppliedIssueFilters(issueInitialFilters);
            }}
          >
            <FilterField>
              <TextField
                select
                label="Truck"
                fullWidth
                size="small"
                value={issueFilters.truck_id ?? ''}
                onChange={(e) => setIssueFilters({ ...issueFilters, truck_id: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                {trucks.map((t) => (
                  <MenuItem key={t.id} value={t.id}>{t.truck_number}</MenuItem>
                ))}
              </TextField>
            </FilterField>
            <FilterField>
              <TextField
                label="From Date"
                type="date"
                fullWidth
                size="small"
                value={issueFilters.date_from ?? ''}
                onChange={(e) => setIssueFilters({ ...issueFilters, date_from: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </FilterField>
            <FilterField>
              <TextField
                label="To Date"
                type="date"
                fullWidth
                size="small"
                value={issueFilters.date_to ?? ''}
                onChange={(e) => setIssueFilters({ ...issueFilters, date_to: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </FilterField>
          </FilterPanel>
          <DataTable columns={issueColumns} rows={issues} loading={loading} searchable={false} getRowId={(r) => r.id} />
        </>
      )}
      {tab === 2 && (
        <>
          <FilterPanel
            loading={loading}
            onApply={() => setAppliedLedgerFilters({ ...ledgerFilters })}
            onClear={() => {
              setLedgerFilters(ledgerInitialFilters);
              setAppliedLedgerFilters(ledgerInitialFilters);
            }}
          >
            <FilterField>
              <TextField
                label="From Date"
                type="date"
                fullWidth
                size="small"
                value={ledgerFilters.date_from ?? ''}
                onChange={(e) => setLedgerFilters({ ...ledgerFilters, date_from: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </FilterField>
            <FilterField>
              <TextField
                label="To Date"
                type="date"
                fullWidth
                size="small"
                value={ledgerFilters.date_to ?? ''}
                onChange={(e) => setLedgerFilters({ ...ledgerFilters, date_to: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </FilterField>
          </FilterPanel>
          <DataTable columns={ledgerColumns} rows={ledger} loading={loading} searchable={false} getRowId={(r) => `${r.type}-${r.id}`} />
        </>
      )}

      <Dialog open={purchaseDialogOpen} onClose={() => setPurchaseDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingPurchase ? 'Edit Diesel Purchase (IN)' : 'Record Diesel Purchase (IN)'}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            e.g. Bought 1 tanker 2000 L — auto-creates a Diesel expense entry.
          </Typography>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Purchase Date"
                type="date"
                fullWidth
                value={purchaseForm.purchase_date}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, purchase_date: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Supplier / Tanker"
                fullWidth
                value={purchaseForm.supplier}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, supplier: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Bill Number"
                fullWidth
                value={purchaseForm.bill_number}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, bill_number: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Quantity (Liters)"
                type="number"
                fullWidth
                value={purchaseForm.quantity}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, quantity: e.target.value })}
                helperText="e.g. 2000 for one tanker"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Rate per Liter (₹)"
                type="number"
                fullWidth
                value={purchaseForm.rate_per_liter}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, rate_per_liter: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Total Amount"
                fullWidth
                value={
                  purchaseForm.quantity && purchaseForm.rate_per_liter
                    ? formatCurrency(Number(purchaseForm.quantity) * Number(purchaseForm.rate_per_liter))
                    : '-'
                }
                slotProps={{ input: { readOnly: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Notes"
                fullWidth
                multiline
                rows={2}
                value={purchaseForm.notes}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPurchaseDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSavePurchase} disabled={saving}>
            {editingPurchase ? 'Update' : 'Save Purchase'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={issueDialogOpen} onClose={() => setIssueDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Diesel Issue (OUT)</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Fuel dispensed to a truck or hitachi. Stock: {summary.stock_balance.toLocaleString('en-IN')} L available.
          </Typography>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Issue Date"
                type="date"
                fullWidth
                value={issueForm.issue_date}
                onChange={(e) => setIssueForm({ ...issueForm, issue_date: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Quantity (Liters)"
                type="number"
                fullWidth
                value={issueForm.quantity}
                onChange={(e) => setIssueForm({ ...issueForm, quantity: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Vehicle Type"
                select
                fullWidth
                value={issueForm.vehicle_type}
                onChange={(e) =>
                  setIssueForm({
                    ...issueForm,
                    vehicle_type: e.target.value as 'truck' | 'hitachi',
                    truck_id: '',
                    hitachi_id: '',
                  })
                }
              >
                <MenuItem value="truck">Truck</MenuItem>
                <MenuItem value="hitachi">Hitachi</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              {issueForm.vehicle_type === 'truck' ? (
                <TextField
                  label="Truck"
                  select
                  fullWidth
                  value={issueForm.truck_id}
                  onChange={(e) => setIssueForm({ ...issueForm, truck_id: e.target.value })}
                >
                  {trucks.map((truck) => (
                    <MenuItem key={truck.id} value={truck.id}>
                      {truck.truck_number}
                    </MenuItem>
                  ))}
                </TextField>
              ) : (
                <TextField
                  label="Hitachi"
                  select
                  fullWidth
                  value={issueForm.hitachi_id}
                  onChange={(e) => setIssueForm({ ...issueForm, hitachi_id: e.target.value })}
                >
                  {machines.map((machine) => (
                    <MenuItem key={machine.id} value={machine.id}>
                      {machine.machine_number}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="From Tanker (Optional)"
                select
                fullWidth
                value={issueForm.diesel_purchase_id}
                onChange={(e) => setIssueForm({ ...issueForm, diesel_purchase_id: e.target.value })}
                helperText="Leave empty for auto FIFO from oldest stock"
              >
                <MenuItem value="">Auto (FIFO)</MenuItem>
                {availablePurchases.map((purchase) => (
                  <MenuItem key={purchase.id} value={purchase.id}>
                    {formatDate(purchase.purchase_date)} — {purchase.remaining_quantity} L
                    {purchase.supplier ? ` (${purchase.supplier})` : ''}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Trip (Optional)"
                select
                fullWidth
                value={issueForm.trip_id}
                onChange={(e) => setIssueForm({ ...issueForm, trip_id: e.target.value })}
              >
                <MenuItem value="">None</MenuItem>
                {trips.map((trip) => (
                  <MenuItem key={trip.id} value={trip.id}>
                    {trip.trip_number}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Rate per Liter (Optional)"
                type="number"
                fullWidth
                value={issueForm.rate_per_liter}
                onChange={(e) => setIssueForm({ ...issueForm, rate_per_liter: e.target.value })}
                helperText="Auto-calculated from purchase rate if empty"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Notes"
                fullWidth
                multiline
                rows={2}
                value={issueForm.notes}
                onChange={(e) => setIssueForm({ ...issueForm, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIssueDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={handleSaveIssue} disabled={saving}>
            Save Issue
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deletePurchaseId}
        title="Delete Purchase"
        message="Delete this diesel purchase? Linked expense will also be removed. Only allowed if no diesel was issued from it."
        confirmText="Delete"
        severity="error"
        loading={deleting}
        onConfirm={handleDeletePurchase}
        onCancel={() => setDeletePurchaseId(null)}
      />

      <ConfirmDialog
        open={!!deleteIssueId}
        title="Delete Issue"
        message="Delete this diesel issue? The quantity will be restored to stock."
        confirmText="Delete"
        severity="error"
        loading={deleting}
        onConfirm={handleDeleteIssue}
        onCancel={() => setDeleteIssueId(null)}
      />
    </Box>
  );
}
