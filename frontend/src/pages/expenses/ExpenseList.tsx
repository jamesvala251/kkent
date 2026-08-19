import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Button, Chip, MenuItem, Tab, Tabs, TextField } from '@mui/material';
import Grid from '@mui/material/Grid2';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ConstructionIcon from '@mui/icons-material/Construction';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import DataTable, { type Column } from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import FilterPanel, { FilterField } from '../../components/common/FilterPanel';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import api from '../../services/api';
import { deleteItem, fetchList, formatCurrency, formatDate } from '../../services/resourceService';
import { buildFilterParams, type FilterValues } from '../../utils/listFilters';
import type { Expense, HitachiMachine, Truck } from '../../types';
import { toast } from 'react-toastify';

interface ExpenseCategory {
  id: number;
  name: string;
}

type ExpenseTab = 'all' | 'truck' | 'hitachi' | 'other';

const tabs: { id: ExpenseTab; label: string }[] = [
  { id: 'all', label: 'All expenses' },
  { id: 'truck', label: 'Truck & trips' },
  { id: 'hitachi', label: 'Hitachi' },
  { id: 'other', label: 'Other' },
];

const initialFilters: FilterValues = {
  category_id: '',
  truck_id: '',
  hitachi_id: '',
  date_from: '',
  date_to: '',
  search: '',
};

function expenseKind(row: Expense): Exclude<ExpenseTab, 'all'> {
  if (row.hitachi_id || row.hitachi_rental_id || row.hitachi || row.hitachi_rental) return 'hitachi';
  if (row.truck_id || row.trip_id || row.driver_id) return 'truck';
  return 'other';
}

function linkedLabel(row: Expense): string {
  if (row.hitachi?.machine_number || row.hitachi_rental?.hitachi?.machine_number) {
    const machine = row.hitachi?.machine_number || row.hitachi_rental?.hitachi?.machine_number;
    return row.hitachi_rental?.rental_number
      ? `${machine} · ${row.hitachi_rental.rental_number}`
      : `Hitachi ${machine}`;
  }
  if (row.hitachi_rental?.rental_number) return `Hitachi ${row.hitachi_rental.rental_number}`;
  const parts = [row.truck?.truck_number, row.trip?.trip_number, row.driver?.name].filter(Boolean);
  return parts.length ? parts.join(' · ') : 'Unlinked';
}

function kindChip(kind: Exclude<ExpenseTab, 'all'>) {
  if (kind === 'hitachi') return <Chip size="small" color="warning" label="Hitachi" />;
  if (kind === 'truck') return <Chip size="small" color="primary" label="Truck / trip" />;
  return <Chip size="small" label="Other" />;
}

export default function ExpenseList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (tabs.some((item) => item.id === searchParams.get('tab')) ? searchParams.get('tab') : 'all') as ExpenseTab;
  const [rows, setRows] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [filters, setFilters] = useState<FilterValues>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<FilterValues>(initialFilters);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [machines, setMachines] = useState<HitachiMachine[]>([]);

  useEffect(() => {
    Promise.all([
      api.get<ExpenseCategory[]>('/expense-categories').then((r) => r.data ?? []),
      fetchList<Truck>('/trucks', { per_page: 500 }),
      fetchList<HitachiMachine>('/hitachi-machines', { per_page: 500 }),
    ]).then(([cats, truckList, machineList]) => {
      setCategories(Array.isArray(cats) ? cats : []);
      setTrucks(truckList);
      setMachines(machineList);
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchList<Expense>('/expenses', buildFilterParams(appliedFilters));
    setRows(data);
    setLoading(false);
  }, [appliedFilters]);

  useEffect(() => {
    load();
  }, [load]);

  const grouped = useMemo(() => {
    const truck = rows.filter((row) => expenseKind(row) === 'truck');
    const hitachi = rows.filter((row) => expenseKind(row) === 'hitachi');
    const other = rows.filter((row) => expenseKind(row) === 'other');
    return { all: rows, truck, hitachi, other };
  }, [rows]);

  const visibleRows = grouped[tab];
  const totalOf = (list: Expense[]) => list.reduce((sum, row) => sum + Number(row.amount || 0), 0);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteItem('/expenses', deleteId);
      toast.success('Expense deleted');
      setDeleteId(null);
      load();
    } catch {
      toast.error('Failed to delete expense');
    } finally {
      setDeleting(false);
    }
  };

  const addPath = tab === 'all' ? '/expenses/new' : `/expenses/new?kind=${tab}`;

  const columns: Column<Expense>[] = [
    { id: 'expense_date', label: 'Date', format: (r) => formatDate(r.expense_date) },
    ...(tab === 'all' ? [{ id: 'kind', label: 'Type', format: (r: Expense) => kindChip(expenseKind(r)) }] : []),
    { id: 'category', label: 'Category', format: (r) => r.category?.name ?? '-' },
    {
      id: 'reference',
      label: tab === 'hitachi' ? 'Machine / rental' : tab === 'other' ? 'Notes' : 'Linked to',
      minWidth: 180,
      format: (r) => (tab === 'other' ? (r.description || '-') : linkedLabel(r)),
    },
    ...(tab === 'other' ? [] : [{ id: 'description', label: 'Description', minWidth: 180, format: (r: Expense) => r.description || '-' }]),
    { id: 'amount', label: 'Amount', align: 'right' as const, format: (r) => formatCurrency(Number(r.amount)) },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      format: (row) => (
        <>
          <IconButton size="small" onClick={() => navigate(`/expenses/${row.id}/edit`)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => setDeleteId(row.id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </>
      ),
    },
  ];

  if (loading && rows.length === 0) return <LoadingSkeleton variant="table" />;

  return (
    <>
      <PageHeader
        title="Expenses"
        subtitle="Truck, trip, Hitachi, diesel, and other costs in one place"
        breadcrumbs={[{ label: 'Expenses' }]}
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate(addPath)}>
            {tab === 'hitachi' ? 'Add Hitachi expense' : tab === 'truck' ? 'Add truck expense' : tab === 'other' ? 'Add other expense' : 'Add Expense'}
          </Button>
        }
      />

      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="All expenses" value={formatCurrency(totalOf(grouped.all))} icon={<ReceiptLongIcon />} color="#1565c0" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Truck & trips" value={formatCurrency(totalOf(grouped.truck))} icon={<LocalShippingIcon />} color="#2e7d32" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Hitachi" value={formatCurrency(totalOf(grouped.hitachi))} icon={<ConstructionIcon />} color="#ed6c02" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Other / general" value={formatCurrency(totalOf(grouped.other))} icon={<AccountBalanceWalletIcon />} color="#6a1b9a" />
        </Grid>
      </Grid>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, value: ExpenseTab) => setSearchParams(value === 'all' ? {} : { tab: value })}
          variant="scrollable"
          allowScrollButtonsMobile
        >
          {tabs.map((item) => (
            <Tab
              key={item.id}
              value={item.id}
              label={`${item.label} (${grouped[item.id].length})`}
            />
          ))}
        </Tabs>
      </Box>

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
            label="Category"
            fullWidth
            size="small"
            value={filters.category_id ?? ''}
            onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}
          >
            <MenuItem value="">All</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
            ))}
          </TextField>
        </FilterField>
        {tab !== 'hitachi' && tab !== 'other' && (
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
        )}
        {(tab === 'all' || tab === 'hitachi') && (
          <FilterField>
            <TextField
              select
              label="Hitachi"
              fullWidth
              size="small"
              value={filters.hitachi_id ?? ''}
              onChange={(e) => setFilters({ ...filters, hitachi_id: e.target.value })}
            >
              <MenuItem value="">All</MenuItem>
              {machines.map((machine) => (
                <MenuItem key={machine.id} value={machine.id}>{machine.machine_number}</MenuItem>
              ))}
            </TextField>
          </FilterField>
        )}
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
            placeholder="Description, truck, machine, trip..."
            value={filters.search ?? ''}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </FilterField>
      </FilterPanel>
      <DataTable
        columns={columns}
        rows={visibleRows}
        loading={loading}
        searchable={false}
        getRowId={(r) => r.id}
        emptyMessage={
          tab === 'hitachi'
            ? 'No Hitachi expenses yet'
            : tab === 'truck'
              ? 'No truck or trip expenses yet'
              : tab === 'other'
                ? 'No unlinked / general expenses yet'
                : 'No expenses found'
        }
      />
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This action cannot be undone."
        confirmText="Delete"
        severity="error"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </>
  );
}
