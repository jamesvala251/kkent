import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, MenuItem, TextField } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { type Column } from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import FilterPanel, { FilterField } from '../../components/common/FilterPanel';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import api from '../../services/api';
import { deleteItem, fetchList, formatCurrency, formatDate } from '../../services/resourceService';
import { buildFilterParams, type FilterValues } from '../../utils/listFilters';
import type { Expense, Truck } from '../../types';
import { toast } from 'react-toastify';

interface ExpenseCategory {
  id: number;
  name: string;
}

const initialFilters: FilterValues = {
  category_id: '',
  truck_id: '',
  date_from: '',
  date_to: '',
  search: '',
};

export default function ExpenseList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [filters, setFilters] = useState<FilterValues>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<FilterValues>(initialFilters);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);

  useEffect(() => {
    Promise.all([
      api.get<ExpenseCategory[]>('/expense-categories').then((r) => r.data ?? []),
      fetchList<Truck>('/trucks', { per_page: 200 }),
    ]).then(([cats, truckList]) => {
      setCategories(Array.isArray(cats) ? cats : []);
      setTrucks(truckList);
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

  const columns: Column<Expense>[] = [
    { id: 'expense_date', label: 'Date', format: (r) => formatDate(r.expense_date) },
    { id: 'category', label: 'Category', format: (r) => r.category?.name ?? '-' },
    { id: 'truck', label: 'Truck', format: (r) => r.truck?.truck_number ?? '-' },
    { id: 'description', label: 'Description', minWidth: 200 },
    { id: 'amount', label: 'Amount', align: 'right', format: (r) => formatCurrency(Number(r.amount)) },
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
        subtitle="Track operational and trip-related expenses"
        breadcrumbs={[{ label: 'Expenses' }]}
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/expenses/new')}>
            Add Expense
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
            placeholder="Description, category..."
            value={filters.search ?? ''}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </FilterField>
      </FilterPanel>
      <DataTable columns={columns} rows={rows} loading={loading} searchable={false} getRowId={(r) => r.id} />
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
