import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Box, Button, Card, CardContent, Divider, MenuItem, TextField, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { useForm, useWatch, type FieldErrors, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import PageHeader from '../../components/common/PageHeader';
import InvoiceLetterhead from '../../components/common/InvoiceLetterhead';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import api from '../../services/api';
import { createItem, downloadInvoicePdf, fetchList, fetchOne, formatCurrency, updateItem } from '../../services/resourceService';
import type { Customer, HitachiRental, Invoice, Trip } from '../../types';

const toNumber = (value: unknown, fallback?: number) => {
  if (value === '' || value === null || value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const requiredId = (label: string) =>
  yup.number().transform((_v, o) => toNumber(o)).required(`${label} is required`);

const optionalNumber = () => yup.number().transform((_v, o) => toNumber(o, 0)).optional();

const optionalId = () =>
  yup
    .number()
    .transform((_v, o) => (o === '' || o === null || o === undefined ? null : toNumber(o)))
    .nullable()
    .optional();

const schema = yup.object({
  customer_id: requiredId('Customer'),
  trip_id: optionalId(),
  hitachi_rental_id: optionalId(),
  invoice_date: yup.string().required('Invoice date is required'),
  due_date: yup.string(),
  subtotal: optionalNumber(),
  cgst_rate: optionalNumber(),
  sgst_rate: optionalNumber(),
  igst_rate: optionalNumber(),
  payment_status: yup.string(),
  paid_amount: optionalNumber(),
  notes: yup.string(),
});

interface InvoiceFormData {
  customer_id: number;
  trip_id?: number | null;
  hitachi_rental_id?: number | null;
  invoice_date: string;
  due_date?: string;
  subtotal?: number;
  cgst_rate?: number;
  sgst_rate?: number;
  igst_rate?: number;
  payment_status?: string;
  paid_amount?: number;
  notes?: string;
}

const calcGstAmount = (subtotal: number, rate: number) =>
  Math.round((subtotal * rate) / 100 * 100) / 100;

const calcTotals = (data: Partial<InvoiceFormData>) => {
  const subtotal = Number(data.subtotal) || 0;
  const cgst = calcGstAmount(subtotal, Number(data.cgst_rate) || 0);
  const sgst = calcGstAmount(subtotal, Number(data.sgst_rate) || 0);
  const igst = calcGstAmount(subtotal, Number(data.igst_rate) || 0);
  const total = subtotal + cgst + sgst + igst;
  return { subtotal, cgst, sgst, igst, total };
};

const deriveRate = (amount: number, subtotal: number) =>
  subtotal > 0 ? Math.round((amount / subtotal) * 100 * 100) / 100 : 0;

const resolveRate = (rate: number | null | undefined, amount: number | null | undefined, subtotal: number) => {
  const storedRate = Number(rate ?? 0);
  if (storedRate > 0) return storedRate;
  const taxAmount = Number(amount ?? 0);
  if (taxAmount > 0 && subtotal > 0) return deriveRate(taxAmount, subtotal);
  return storedRate;
};

const billingLabel = (rental: HitachiRental) => {
  if (rental.billing_type === 'hourly') return `${rental.hours ?? 0} hrs`;
  if (rental.billing_type === 'daily') return `${rental.days ?? 0} days`;
  return `${rental.months ?? 0} mo`;
};

export default function InvoiceForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id && id !== 'new');
  const [loadingData, setLoadingData] = useState(isEdit || Boolean(searchParams.get('hitachi_rental_id')));
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [rentals, setRentals] = useState<HitachiRental[]>([]);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [companySettings, setCompanySettings] = useState({
    company_name: 'KK Enterprise',
    address: '',
    phone: '',
    email: '',
    gst_number: '',
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceFormData>({
    resolver: yupResolver(schema) as Resolver<InvoiceFormData>,
    defaultValues: {
      invoice_date: dayjs().format('YYYY-MM-DD'),
      due_date: dayjs().add(15, 'day').format('YYYY-MM-DD'),
      subtotal: 0,
      cgst_rate: 9,
      sgst_rate: 9,
      igst_rate: 0,
      paid_amount: 0,
      payment_status: 'pending',
      trip_id: null,
      hitachi_rental_id: null,
    },
  });

  const watched = useWatch({ control });
  const gst = useMemo(() => calcTotals(watched), [watched]);

  const applyRental = (rental: HitachiRental) => {
    setValue('hitachi_rental_id', rental.id);
    setValue('trip_id', null);
    setValue('customer_id', rental.customer_id);
    setValue('subtotal', Number(rental.total_amount) || 0);
    const noteParts = [
      `Hitachi rental ${rental.rental_number}`,
      rental.hitachi?.machine_number ? `Machine ${rental.hitachi.machine_number}` : null,
      rental.site_location ? `Site: ${rental.site_location}` : null,
    ].filter(Boolean);
    setValue('notes', noteParts.join(' · '));
  };

  useEffect(() => {
    Promise.all([
      fetchList<Customer>('/customers'),
      fetchList<Trip>('/trips', { per_page: 100 }),
      fetchList<HitachiRental>('/hitachi/rentals', { per_page: 100 }),
      api.get<typeof companySettings>('/settings'),
    ]).then(([c, t, r, settingsRes]) => {
      setCustomers(c);
      setTrips(t);
      setRentals(r);
      if (settingsRes.data) {
        setCompanySettings((prev) => ({ ...prev, ...settingsRes.data }));
      }
    });
  }, []);

  useEffect(() => {
    if (isEdit || !rentals.length) return;
    const rentalId = searchParams.get('hitachi_rental_id');
    if (!rentalId) {
      setLoadingData(false);
      return;
    }
    const rental = rentals.find((item) => item.id === Number(rentalId));
    if (rental) {
      applyRental(rental);
    } else {
      toast.error('Hitachi rental not found');
    }
    setLoadingData(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, rentals, searchParams]);

  useEffect(() => {
    if (!isEdit || !id) return;
    setLoadingData(true);
    fetchOne<Invoice>('/invoices', id).then((data) => {
      if (data) {
        const subtotal = Number(data.subtotal);
        setInvoiceNumber(data.invoice_number);
        reset({
          customer_id: data.customer_id,
          trip_id: data.trip_id ?? null,
          hitachi_rental_id: data.hitachi_rental_id ?? null,
          invoice_date: data.invoice_date?.split('T')[0] ?? '',
          due_date: data.due_date?.split('T')[0] ?? '',
          subtotal,
          cgst_rate: resolveRate(data.cgst_rate, data.cgst, subtotal),
          sgst_rate: resolveRate(data.sgst_rate, data.sgst, subtotal),
          igst_rate: resolveRate(data.igst_rate, data.igst, subtotal),
          payment_status: data.payment_status,
          paid_amount: Number(data.paid_amount ?? 0),
          notes: data.notes ?? '',
        });
      }
      setLoadingData(false);
    });
  }, [id, isEdit, reset]);

  const onInvalid = (formErrors: FieldErrors<InvoiceFormData>) => {
    const firstError = Object.values(formErrors).find((e) => e?.message);
    toast.error(firstError?.message ? String(firstError.message) : 'Please fill required fields');
  };

  const handleDownloadPdf = async (invoiceId: number, invoiceNo?: string) => {
    setDownloadingPdf(true);
    try {
      await downloadInvoicePdf(invoiceId, invoiceNo ? `${invoiceNo}.pdf` : 'invoice.pdf');
      toast.success('PDF downloaded');
    } catch {
      toast.error('Failed to download PDF');
    }
    setDownloadingPdf(false);
  };

  const onSubmit = async (data: InvoiceFormData) => {
    const payload: Partial<Invoice> = {
      customer_id: data.customer_id,
      trip_id: data.hitachi_rental_id ? null : (data.trip_id ?? null),
      hitachi_rental_id: data.hitachi_rental_id ?? null,
      invoice_date: data.invoice_date,
      due_date: data.due_date || null,
      subtotal: data.subtotal,
      cgst_rate: data.cgst_rate ?? 0,
      sgst_rate: data.sgst_rate ?? 0,
      igst_rate: data.igst_rate ?? 0,
      payment_status: data.payment_status as Invoice['payment_status'] | undefined,
      paid_amount: data.paid_amount,
      notes: data.notes || undefined,
    };
    try {
      if (isEdit && id) {
        await updateItem<Invoice>('/invoices', id, payload);
        toast.success('Invoice updated');
        navigate('/invoices');
      } else {
        const invoice = await createItem<Invoice>('/invoices', payload);
        toast.success('Invoice created');
        await handleDownloadPdf(invoice.id, invoice.invoice_number);
        navigate('/invoices');
      }
    } catch {
      // interceptor
    }
  };

  if (loadingData) return <LoadingSkeleton variant="form" rows={8} />;

  return (
    <Box>
      <PageHeader
        title={isEdit ? 'Edit Invoice' : 'Create Invoice'}
        subtitle="Link a trip or Hitachi rental — GST % calculates tax automatically"
        breadcrumbs={[{ label: 'Invoices', to: '/invoices' }, { label: isEdit ? 'Edit' : 'New' }]}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            {isEdit && id && (
              <Button
                variant="outlined"
                startIcon={<PictureAsPdfIcon />}
                disabled={downloadingPdf}
                onClick={() => handleDownloadPdf(Number(id), invoiceNumber)}
              >
                Download PDF
              </Button>
            )}
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/invoices')}>
              Back
            </Button>
          </Box>
        }
      />

      <Card>
        <CardContent>
          <InvoiceLetterhead
            companyName={companySettings.company_name}
            address={companySettings.address}
            phone={companySettings.phone}
            email={companySettings.email}
            gstNumber={companySettings.gst_number}
          />
          <Box component="form" onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
            {isEdit && (
              <TextField
                label="Invoice Number"
                value={invoiceNumber}
                fullWidth
                sx={{ mb: 2 }}
                slotProps={{ input: { readOnly: true } }}
              />
            )}

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  {...register('customer_id')}
                  label="Customer"
                  select
                  fullWidth
                  error={!!errors.customer_id}
                  helperText={errors.customer_id?.message}
                >
                  {customers.map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Hitachi Rental (Optional)"
                  value={watched.hitachi_rental_id ?? ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!value) {
                      setValue('hitachi_rental_id', null);
                      return;
                    }
                    const rental = rentals.find((item) => item.id === Number(value));
                    if (rental) applyRental(rental);
                  }}
                  helperText="Selecting a rental fills customer & subtotal"
                >
                  <MenuItem value="">None</MenuItem>
                  {rentals.map((r) => (
                    <MenuItem key={r.id} value={r.id}>
                      {r.rental_number} · {r.hitachi?.machine_number ?? 'Machine'} · {r.customer?.name ?? 'Customer'} · {billingLabel(r)} · {formatCurrency(Number(r.total_amount))}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Trip (Optional)"
                  value={watched.trip_id ?? ''}
                  disabled={Boolean(watched.hitachi_rental_id)}
                  onChange={(e) => {
                    const value = e.target.value;
                    setValue('trip_id', value ? Number(value) : null);
                    if (value) setValue('hitachi_rental_id', null);
                  }}
                  helperText={watched.hitachi_rental_id ? 'Clear Hitachi rental to link a trip' : ' '}
                >
                  <MenuItem value="">None</MenuItem>
                  {trips.map((t) => (
                    <MenuItem key={t.id} value={t.id}>{t.trip_number}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  {...register('invoice_date')}
                  label="Invoice Date"
                  type="date"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  error={!!errors.invoice_date}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField {...register('due_date')} label="Due Date" type="date" fullWidth slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
              {isEdit && (
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField {...register('payment_status')} label="Payment Status" select fullWidth>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="paid">Paid</MenuItem>
                    <MenuItem value="partial">Partial</MenuItem>
                    <MenuItem value="overdue">Overdue</MenuItem>
                  </TextField>
                </Grid>
              )}
            </Grid>

            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>
              Amount & GST (%)
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField {...register('subtotal')} label="Subtotal (₹)" type="number" fullWidth />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  {...register('cgst_rate')}
                  label="CGST (%)"
                  type="number"
                  fullWidth
                  inputProps={{ min: 0, max: 100, step: 0.01 }}
                  InputProps={{ endAdornment: <Typography color="text.secondary">%</Typography> }}
                  helperText={`Tax amount: ${formatCurrency(gst.cgst)}`}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  {...register('sgst_rate')}
                  label="SGST (%)"
                  type="number"
                  fullWidth
                  inputProps={{ min: 0, max: 100, step: 0.01 }}
                  InputProps={{ endAdornment: <Typography color="text.secondary">%</Typography> }}
                  helperText={`Tax amount: ${formatCurrency(gst.sgst)}`}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  {...register('igst_rate')}
                  label="IGST (%)"
                  type="number"
                  fullWidth
                  inputProps={{ min: 0, max: 100, step: 0.01 }}
                  InputProps={{ endAdornment: <Typography color="text.secondary">%</Typography> }}
                  helperText={`Tax amount: ${formatCurrency(gst.igst)} — use for inter-state`}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField label="Total Amount" value={formatCurrency(gst.total)} fullWidth slotProps={{ input: { readOnly: true } }} />
              </Grid>
              {isEdit && (
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField {...register('paid_amount')} label="Paid Amount (₹)" type="number" fullWidth />
                </Grid>
              )}
              <Grid size={{ xs: 12 }}>
                <Typography variant="body2" color="text.secondary">
                  Intra-state: CGST + SGST (e.g. 9% + 9%). Inter-state: IGST only (e.g. 18%).
                </Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField {...register('notes')} label="Notes" fullWidth multiline rows={2} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={isSubmitting}>
                  {isEdit ? 'Update Invoice' : 'Create Invoice'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
