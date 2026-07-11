import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Chip, MenuItem, TextField } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { type Column } from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import FilterPanel, { FilterField } from '../../components/common/FilterPanel';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import { deleteItem, fetchList, formatCurrency } from '../../services/resourceService';
import { buildFilterParams, type FilterValues } from '../../utils/listFilters';
import type { Driver, Salary } from '../../types';
import { toast } from 'react-toastify';

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const formatMonthYear = (month: number, year: number) => `${MONTH_LABELS[month - 1] ?? month} ${year}`;

const initialFilters: FilterValues = {
  driver_id: '',
  month: '',
  year: '',
  payment_status: '',
};

export default function SalaryList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Salary[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [filters, setFilters] = useState<FilterValues>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<FilterValues>(initialFilters);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  useEffect(() => {
    fetchList<Driver>('/drivers', { per_page: 200, status: 'active' }).then(setDrivers);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchList<Salary>('/salaries', buildFilterParams(appliedFilters));
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
      await deleteItem('/salaries', deleteId);
      toast.success('Salary deleted');
      setDeleteId(null);
      load();
    } catch {
      toast.error('Failed to delete salary');
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Salary>[] = [
    { id: 'driver', label: 'Driver', format: (r) => r.driver?.name || `Driver #${r.driver_id}` },
    { id: 'period', label: 'Period', format: (r) => formatMonthYear(Number(r.month), Number(r.year)) },
    { id: 'salary_type', label: 'Type', format: (r) => <Chip label={r.salary_type} size="small" /> },
    { id: 'base_amount', label: 'Base', align: 'right', format: (r) => formatCurrency(Number(r.base_amount)) },
    { id: 'bonus', label: 'Bonus', align: 'right', format: (r) => formatCurrency(Number(r.bonus) || 0) },
    { id: 'net_amount', label: 'Net Salary', align: 'right', format: (r) => formatCurrency(Number(r.net_amount)) },
    {
      id: 'payment_status',
      label: 'Status',
      format: (r) => (
        <Chip label={r.payment_status} size="small" color={r.payment_status === 'paid' ? 'success' : 'warning'} />
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      format: (row) => (
        <>
          <IconButton size="small" onClick={() => navigate(`/salary/${row.id}/edit`)}>
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
        title="Salary"
        subtitle="Driver salary processing and payment tracking"
        breadcrumbs={[{ label: 'Salary' }]}
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/salary/new')}>
            Process Salary
          </Button>
        }
      />
      <FilterPanel
        loading={loading}
        onApply={() => setAppliedFilters({ ...filters })}
        onClear={() => {
          setFilters({ driver_id: '', month: '', year: '', payment_status: '' });
          setAppliedFilters({ driver_id: '', month: '', year: '', payment_status: '' });
        }}
      >
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
            select
            label="Month"
            fullWidth
            size="small"
            value={filters.month ?? ''}
            onChange={(e) => setFilters({ ...filters, month: e.target.value })}
          >
            <MenuItem value="">All</MenuItem>
            {MONTHS.map((m) => (
              <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
            ))}
          </TextField>
        </FilterField>
        <FilterField>
          <TextField
            label="Year"
            type="number"
            fullWidth
            size="small"
            value={filters.year ?? ''}
            onChange={(e) => setFilters({ ...filters, year: e.target.value })}
          />
        </FilterField>
        <FilterField>
          <TextField
            select
            label="Payment Status"
            fullWidth
            size="small"
            value={filters.payment_status ?? ''}
            onChange={(e) => setFilters({ ...filters, payment_status: e.target.value })}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="paid">Paid</MenuItem>
            <MenuItem value="partial">Partial</MenuItem>
          </TextField>
        </FilterField>
      </FilterPanel>
      <DataTable columns={columns} rows={rows} loading={loading} searchable={false} getRowId={(r) => r.id} />
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Salary"
        message="Are you sure you want to delete this salary record?"
        confirmText="Delete"
        severity="error"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </>
  );
}
