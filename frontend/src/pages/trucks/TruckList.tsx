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
import { deleteItem, fetchList, formatDate } from '../../services/resourceService';
import { buildFilterParams, type FilterValues } from '../../utils/listFilters';
import type { Truck } from '../../types';
import { toast } from 'react-toastify';

const initialFilters: FilterValues = { status: '', fuel_type: '', search: '' };

export default function TruckList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [filters, setFilters] = useState<FilterValues>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<FilterValues>(initialFilters);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchList<Truck>('/trucks', buildFilterParams(appliedFilters));
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
      await deleteItem('/trucks', deleteId);
      toast.success('Truck deleted');
      setDeleteId(null);
      load();
    } catch {
      toast.error('Failed to delete truck');
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Truck>[] = [
    { id: 'truck_number', label: 'Truck Number', minWidth: 140 },
    { id: 'rc_number', label: 'RC Number', format: (r) => r.rc_number || '-' },
    { id: 'brand', label: 'Brand', format: (r) => r.brand || '-' },
    { id: 'model', label: 'Model', format: (r) => r.model || '-' },
    { id: 'capacity', label: 'Capacity', format: (r) => r.capacity || '-' },
    {
      id: 'fuel_type',
      label: 'Fuel',
      format: (r) => (r.fuel_type ? r.fuel_type.charAt(0).toUpperCase() + r.fuel_type.slice(1) : '-'),
    },
    {
      id: 'current_km',
      label: 'Current KM',
      align: 'right',
      format: (r) => (r.current_km != null ? Number(r.current_km).toLocaleString('en-IN') : '-'),
    },
    {
      id: 'insurance_expiry',
      label: 'Insurance Expiry',
      format: (r) => formatDate(r.insurance_expiry || ''),
    },
    {
      id: 'status',
      label: 'Status',
      format: (r) => (
        <Chip
          label={r.status}
          size="small"
          color={
            r.status === 'active'
              ? 'success'
              : r.status === 'maintenance'
                ? 'warning'
                : r.status === 'breakdown'
                  ? 'error'
                  : 'default'
          }
        />
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      format: (row) => (
        <>
          <IconButton size="small" onClick={() => navigate(`/trucks/${row.id}/edit`)}>
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
        title="Trucks"
        subtitle="Fleet management and vehicle tracking"
        breadcrumbs={[{ label: 'Trucks' }]}
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/trucks/new')}>
            Add Truck
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
            <MenuItem value="maintenance">Maintenance</MenuItem>
            <MenuItem value="breakdown">Breakdown</MenuItem>
          </TextField>
        </FilterField>
        <FilterField>
          <TextField
            select
            label="Fuel Type"
            fullWidth
            size="small"
            value={filters.fuel_type ?? ''}
            onChange={(e) => setFilters({ ...filters, fuel_type: e.target.value })}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="diesel">Diesel</MenuItem>
            <MenuItem value="petrol">Petrol</MenuItem>
            <MenuItem value="cng">CNG</MenuItem>
            <MenuItem value="electric">Electric</MenuItem>
          </TextField>
        </FilterField>
        <FilterField size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            label="Search"
            fullWidth
            size="small"
            placeholder="Truck #, RC, brand, model..."
            value={filters.search ?? ''}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </FilterField>
      </FilterPanel>
      <DataTable columns={columns} rows={rows} loading={loading} searchable={false} getRowId={(r) => r.id} />
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Truck"
        message="Are you sure you want to delete this truck? This action cannot be undone."
        confirmText="Delete"
        severity="error"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </>
  );
}
