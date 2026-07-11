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
import { deleteItem, fetchList } from '../../services/resourceService';
import { buildFilterParams, type FilterValues } from '../../utils/listFilters';
import type { Customer } from '../../types';
import { toast } from 'react-toastify';

const initialFilters: FilterValues = { status: '', search: '' };

export default function CustomerList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [filters, setFilters] = useState<FilterValues>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<FilterValues>(initialFilters);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchList<Customer>('/customers', buildFilterParams(appliedFilters));
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
      await deleteItem('/customers', deleteId);
      toast.success('Customer deleted');
      setDeleteId(null);
      load();
    } catch {
      toast.error('Failed to delete customer');
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Customer>[] = [
    { id: 'name', label: 'Name', minWidth: 180 },
    { id: 'company_name', label: 'Company' },
    { id: 'mobile', label: 'Mobile' },
    { id: 'city', label: 'City' },
    {
      id: 'status',
      label: 'Status',
      format: (row) => <Chip label={row.status} size="small" color={row.status === 'active' ? 'success' : 'default'} />,
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      format: (row) => (
        <>
          <IconButton size="small" onClick={() => navigate(`/customers/${row.id}/edit`)}>
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
        title="Customers"
        subtitle="Manage customer accounts and billing details"
        breadcrumbs={[{ label: 'Customers' }]}
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/customers/new')}>
            Add Customer
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
          </TextField>
        </FilterField>
        <FilterField size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            label="Search"
            fullWidth
            size="small"
            placeholder="Name, company, mobile, email..."
            value={filters.search ?? ''}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </FilterField>
      </FilterPanel>
      <DataTable columns={columns} rows={rows} loading={loading} searchable={false} getRowId={(r) => r.id} />
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Customer"
        message="Are you sure you want to delete this customer? This action cannot be undone."
        confirmText="Delete"
        severity="error"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </>
  );
}
