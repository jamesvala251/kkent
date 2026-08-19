import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Button, Card, CardContent, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { type Column } from '../../components/common/DataTable';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../services/resourceService';
import type { Customer, HitachiRental, Invoice, Trip } from '../../types';
import { toast } from 'react-toastify';

interface Ledger {
  customer: Customer;
  trips: Trip[];
  invoices: Invoice[];
  rentals: HitachiRental[];
  billed: number;
  paid: number;
  outstanding: number;
}

export default function CustomerLedger() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get<Ledger>(`/customers/${id}/ledger`)
      .then((res) => {
        const data = res.data as Ledger;
        setLedger({
          ...data,
          trips: Array.isArray(data.trips) ? data.trips : [],
          invoices: Array.isArray(data.invoices) ? data.invoices : [],
          rentals: Array.isArray(data.rentals) ? data.rentals : [],
          billed: Number(data.billed || 0),
          paid: Number(data.paid || 0),
          outstanding: Number(data.outstanding || 0),
        });
      })
      .catch(() => {
        toast.error('Failed to load customer ledger');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const tripColumns: Column<Trip>[] = [
    { id: 'trip_number', label: 'Trip #' },
    { id: 'start_date', label: 'Date', format: (r) => formatDate(r.start_date) },
    { id: 'from_location', label: 'From' },
    { id: 'to_location', label: 'To' },
    { id: 'total_freight', label: 'Freight', align: 'right', format: (r) => formatCurrency(Number(r.total_freight || r.freight || 0)) },
  ];

  const invoiceColumns: Column<Invoice>[] = [
    { id: 'invoice_number', label: 'Invoice #' },
    { id: 'invoice_date', label: 'Date', format: (r) => formatDate(r.invoice_date) },
    { id: 'total_amount', label: 'Total', align: 'right', format: (r) => formatCurrency(Number(r.total_amount || 0)) },
    { id: 'paid_amount', label: 'Paid', align: 'right', format: (r) => formatCurrency(Number(r.paid_amount || 0)) },
    { id: 'payment_status', label: 'Status' },
  ];

  const rentalColumns: Column<HitachiRental>[] = [
    { id: 'rental_number', label: 'Rental #' },
    { id: 'hitachi', label: 'Machine', format: (r) => r.hitachi?.machine_number || `Machine #${r.hitachi_id}` },
    { id: 'start_date', label: 'Start', format: (r) => formatDate(r.start_date) },
    { id: 'total_amount', label: 'Amount', align: 'right', format: (r) => formatCurrency(Number(r.total_amount || 0)) },
    { id: 'status', label: 'Status' },
  ];

  if (loading) return <LoadingSkeleton variant="table" rows={8} />;

  return (
    <Box>
      <PageHeader
        title={ledger?.customer?.name ? `${ledger.customer.name} ledger` : 'Customer ledger'}
        subtitle={ledger?.customer?.company_name || ledger?.customer?.mobile || 'Trips, invoices, rentals and outstanding balance'}
        breadcrumbs={[{ label: 'Customers', to: '/customers' }, { label: 'Ledger' }]}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            {id && (
              <Button startIcon={<EditIcon />} onClick={() => navigate(`/customers/${id}/edit`)}>
                Edit
              </Button>
            )}
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/customers')}>
              Back
            </Button>
          </Box>
        }
      />
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        {[
          { label: 'Billed', value: ledger?.billed },
          { label: 'Paid', value: ledger?.paid },
          { label: 'Outstanding', value: ledger?.outstanding },
        ].map((card) => (
          <Grid key={card.label} size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">{card.label}</Typography>
                <Typography variant="h6">{formatCurrency(Number(card.value || 0))}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Trips</Typography>
      <DataTable
        columns={tripColumns}
        rows={ledger?.trips ?? []}
        getRowId={(r) => r.id}
        searchable={false}
        emptyMessage="No trips for this customer"
        onRowClick={(row) => navigate(`/trips/${row.id}/edit`)}
      />
      <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 3, mb: 1 }}>Invoices</Typography>
      <DataTable
        columns={invoiceColumns}
        rows={ledger?.invoices ?? []}
        getRowId={(r) => r.id}
        searchable={false}
        emptyMessage="No invoices for this customer"
        onRowClick={(row) => navigate(`/invoices/${row.id}/edit`)}
      />
      <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 3, mb: 1 }}>Hitachi rentals</Typography>
      <DataTable
        columns={rentalColumns}
        rows={ledger?.rentals ?? []}
        getRowId={(r) => r.id}
        searchable={false}
        emptyMessage="No Hitachi rentals for this customer"
      />
    </Box>
  );
}
