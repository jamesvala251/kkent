import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, MenuItem, TextField } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { type Column } from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import FilterPanel, { FilterField } from '../../components/common/FilterPanel';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import { deleteItem, downloadInvoicePdf, fetchList, formatCurrency, formatDate } from '../../services/resourceService';
import { buildFilterParams, type FilterValues } from '../../utils/listFilters';
import type { Customer, Invoice } from '../../types';
import { toast } from 'react-toastify';

const initialFilters: FilterValues = {
  customer_id: '',
  date_from: '',
  date_to: '',
  search: '',
};

export default function InvoiceList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [filters, setFilters] = useState<FilterValues>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<FilterValues>(initialFilters);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    fetchList<Customer>('/customers', { per_page: 200, status: 'active' }).then(setCustomers);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchList<Invoice>('/invoices', buildFilterParams(appliedFilters));
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
      await deleteItem('/invoices', deleteId);
      toast.success('Invoice deleted');
      setDeleteId(null);
      load();
    } catch {
      toast.error('Failed to delete invoice');
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = async (row: Invoice) => {
    setDownloadingId(row.id);
    try {
      await downloadInvoicePdf(row.id, `${row.invoice_number}.pdf`);
      toast.success('PDF downloaded');
    } catch {
      toast.error('Failed to download PDF');
    }
    setDownloadingId(null);
  };

  const columns: Column<Invoice>[] = [
    { id: 'invoice_number', label: 'Invoice #', minWidth: 130 },
    { id: 'customer', label: 'Customer', format: (r) => r.customer?.name || `Customer #${r.customer_id}` },
    {
      id: 'source',
      label: 'Source',
      format: (r) => {
        if (r.hitachi_rental?.rental_number) return `Hitachi ${r.hitachi_rental.rental_number}`;
        const tripCount = r.trips?.length || (r.trip ? 1 : 0);
        if (tripCount > 1 && r.billing_month) {
          const [year, month] = r.billing_month.split('-');
          const label = new Date(Number(year), Number(month) - 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
          return `${tripCount} trips · ${label}`;
        }
        if (tripCount > 1) return `${tripCount} trips`;
        if (r.billing_month && tripCount === 1) {
          const [year, month] = r.billing_month.split('-');
          const label = new Date(Number(year), Number(month) - 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
          return `Trip ${r.trip?.trip_number || r.trips?.[0]?.trip_number || ''} · ${label}`.trim();
        }
        return r.trip?.trip_number ? `Trip ${r.trip.trip_number}` : '-';
      },
    },
    { id: 'invoice_date', label: 'Date', format: (r) => formatDate(r.invoice_date) },
    { id: 'due_date', label: 'Due Date', format: (r) => formatDate(r.due_date || '') },
    { id: 'subtotal', label: 'Subtotal', align: 'right', format: (r) => formatCurrency(Number(r.subtotal)) },
    { id: 'total_amount', label: 'Total', align: 'right', format: (r) => formatCurrency(Number(r.total_amount)) },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      format: (row) => (
        <>
          <IconButton
            size="small"
            title="Download PDF"
            disabled={downloadingId === row.id}
            onClick={() => handleDownload(row)}
          >
            <PictureAsPdfIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => navigate(`/invoices/${row.id}/edit`)}>
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
        title="Invoices"
        subtitle="Billing and invoice management"
        breadcrumbs={[{ label: 'Invoices' }]}
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/invoices/new')}>
            Create Invoice
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
            label="Customer"
            fullWidth
            size="small"
            value={filters.customer_id ?? ''}
            onChange={(e) => setFilters({ ...filters, customer_id: e.target.value })}
          >
            <MenuItem value="">All</MenuItem>
            {customers.map((c) => (
              <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
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
            placeholder="Invoice #, notes..."
            value={filters.search ?? ''}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </FilterField>
      </FilterPanel>
      <DataTable columns={columns} rows={rows} loading={loading} searchable={false} getRowId={(r) => r.id} />
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Invoice"
        message="Are you sure you want to delete this invoice?"
        confirmText="Delete"
        severity="error"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </>
  );
}
