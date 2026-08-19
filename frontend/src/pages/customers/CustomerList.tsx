import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, IconButton, TextField } from '@mui/material';
import Grid from '@mui/material/Grid2';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import RouteIcon from '@mui/icons-material/Route';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import PaymentsIcon from '@mui/icons-material/Payments';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import DataTable, { type Column } from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import FilterPanel, { FilterField } from '../../components/common/FilterPanel';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import api from '../../services/api';
import { deleteItem, formatCurrency } from '../../services/resourceService';
import { buildFilterParams, type FilterValues } from '../../utils/listFilters';
import type { Customer } from '../../types';
import { toast } from 'react-toastify';

type CustomerSummary = {
  total_customers: number;
  active_customers: number;
  total_trips: number;
  billed: number;
  paid: number;
  outstanding: number;
};

const emptySummary: CustomerSummary = {
  total_customers: 0,
  active_customers: 0,
  total_trips: 0,
  billed: 0,
  paid: 0,
  outstanding: 0,
};

const initialFilters: FilterValues = { search: '' };

export default function CustomerList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Customer[]>([]);
  const [summary, setSummary] = useState<CustomerSummary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [filters, setFilters] = useState<FilterValues>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<FilterValues>(initialFilters);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/customers', { params: buildFilterParams(appliedFilters) });
      const list: Customer[] = Array.isArray(data) ? data : (data?.data ?? []);
      setRows(list);
      const apiSummary = data && !Array.isArray(data) ? data.summary : undefined;
      setSummary({
        total_customers: Number(apiSummary?.total_customers ?? list.length),
        active_customers: Number(apiSummary?.active_customers ?? list.filter((row) => row.status === 'active').length),
        total_trips: Number(apiSummary?.total_trips ?? 0),
        billed: Number(apiSummary?.billed ?? 0),
        paid: Number(apiSummary?.paid ?? 0),
        outstanding: Number(apiSummary?.outstanding ?? 0),
      });
    } catch {
      setRows([]);
      setSummary(emptySummary);
    } finally {
      setLoading(false);
    }
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
      id: 'actions',
      label: 'Actions',
      align: 'right',
      format: (row) => (
        <Box onClick={(e) => e.stopPropagation()} sx={{ display: 'inline-flex', gap: 0.5 }}>
          <Button
            size="small"
            startIcon={<ReceiptLongIcon fontSize="small" />}
            onClick={() => navigate(`/customers/${row.id}/ledger`)}
          >
            Ledger
          </Button>
          <IconButton size="small" title="Edit" onClick={() => navigate(`/customers/${row.id}/edit`)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" title="Delete" onClick={() => setDeleteId(row.id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
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
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <StatCard title="Customers" value={summary.total_customers} icon={<PeopleIcon />} color="#1a237e" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <StatCard title="Active" value={summary.active_customers} icon={<PersonIcon />} color="#1565c0" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <StatCard title="Trips" value={summary.total_trips} icon={<RouteIcon />} color="#6a1b9a" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <StatCard title="Billed" value={formatCurrency(summary.billed)} icon={<RequestQuoteIcon />} color="#2e7d32" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <StatCard title="Paid" value={formatCurrency(summary.paid)} icon={<PaymentsIcon />} color="#00897b" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <StatCard title="Outstanding" value={formatCurrency(summary.outstanding)} icon={<AccountBalanceWalletIcon />} color="#e65100" />
        </Grid>
      </Grid>
      <FilterPanel
        loading={loading}
        onApply={() => setAppliedFilters({ ...filters })}
        onClear={() => {
          setFilters(initialFilters);
          setAppliedFilters(initialFilters);
        }}
      >
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
      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        searchable={false}
        getRowId={(r) => r.id}
        onRowClick={(row) => navigate(`/customers/${row.id}/ledger`)}
      />
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
