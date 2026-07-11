import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Chip, IconButton, MenuItem, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { type Column } from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import FilterPanel, { FilterField } from '../../components/common/FilterPanel';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import { deleteItem, fetchList, formatCurrency, formatDate } from '../../services/resourceService';
import { buildFilterParams, type FilterValues } from '../../utils/listFilters';
import type { Driver } from '../../types';
import { toast } from 'react-toastify';

const initialFilters: FilterValues = { status: '', salary_type: '', search: '' };

export default function DriverList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [filters, setFilters] = useState<FilterValues>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<FilterValues>(initialFilters);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchList<Driver>('/drivers', buildFilterParams(appliedFilters));
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
      await deleteItem('/drivers', deleteId);
      toast.success('Driver deleted');
      setDeleteId(null);
      load();
    } catch {
      toast.error('Failed to delete driver');
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Driver>[] = [
    { id: 'name', label: 'Driver Name', minWidth: 160 },
    { id: 'mobile', label: 'Mobile' },
    { id: 'license_number', label: 'License #', format: (r) => r.license_number || '-' },
    { id: 'license_expiry', label: 'License Expiry', format: (r) => formatDate(r.license_expiry || '') },
    {
      id: 'assigned_truck',
      label: 'Assigned Truck',
      format: (r) => r.assigned_truck?.truck_number || '-',
    },
    { id: 'salary_type', label: 'Salary Type', format: (r) => r.salary_type?.replace('_', ' ') || '-' },
    {
      id: 'salary',
      label: 'Salary',
      align: 'right',
      format: (r) =>
        r.salary_type === 'per_trip'
          ? `${formatCurrency(r.per_trip_salary || 0)}/trip`
          : r.salary_type === 'both'
            ? `${formatCurrency(r.monthly_salary || 0)} + ${formatCurrency(r.per_trip_salary || 0)}/trip`
            : formatCurrency(r.monthly_salary || 0),
    },
    {
      id: 'status',
      label: 'Status',
      format: (r) => (
        <Chip
          label={r.status.replace('_', ' ')}
          size="small"
          color={r.status === 'active' ? 'success' : r.status === 'on_leave' ? 'warning' : 'default'}
        />
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      format: (row) => (
        <>
          <IconButton size="small" onClick={() => navigate(`/drivers/${row.id}/edit`)}>
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
        title="Drivers"
        subtitle="Manage driver profiles, licenses and assignments"
        breadcrumbs={[{ label: 'Drivers' }]}
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/drivers/new')}>
            Add Driver
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
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
            <MenuItem value="on_leave">On Leave</MenuItem>
          </TextField>
        </FilterField>
        <FilterField>
          <TextField
            select
            label="Salary Type"
            fullWidth
            size="small"
            value={filters.salary_type ?? ''}
            onChange={(e) => setFilters({ ...filters, salary_type: e.target.value })}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="monthly">Monthly</MenuItem>
            <MenuItem value="per_trip">Per Trip</MenuItem>
            <MenuItem value="both">Both</MenuItem>
          </TextField>
        </FilterField>
        <FilterField size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            label="Search"
            fullWidth
            size="small"
            placeholder="Name, mobile, license..."
            value={filters.search ?? ''}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </FilterField>
      </FilterPanel>
      <DataTable columns={columns} rows={rows} loading={loading} searchable={false} getRowId={(r) => r.id} />
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Driver"
        message="Are you sure you want to delete this driver? This action cannot be undone."
        confirmText="Delete"
        severity="error"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </>
  );
}
