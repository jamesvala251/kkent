import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import type { Customer, Invoice, Trip } from '../../types';

const toNumber = (value: unknown, fallback?: number) => {
  if (value === '' || value === null || value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const requiredId = (label: string) =>
  yup.number().transform((_v, o) => toNumber(o)).required(`${label} is required`);

const optionalNumber = () => yup.number().transform((_v, o) => toNumber(o, 0)).optional();

const schema = yup.object({
  customer_id: requiredId('Customer'),
  trip_id: yup.number().transform((_v, o) => toNumber(o)).optional().nullable(),
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

export default function InvoiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id && id !== 'new');
  const [loadingData, setLoadingData] = useState(isEdit);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
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
    control,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceFormData>({
    resolver: yupResolver(schema) as Resolver<InvoiceFormData>,
    defaultValues: {
      invoice_date: dayjs().format('YYYY-MM-DD'),
      subtotal: 0,
      cgst_rate: 9,
      sgst_rate: 9,
      igst_rate: 0,
      paid_amount: 0,
      payment_status: 'pending',
    },
  });

  const watched = useWatch({ control });
  const gst = useMemo(() => calcTotals(watched), [watched]);

  useEffect(() => {
    Promise.all([
      fetchList<Customer>('/customers'),
      fetchList<Trip>('/trips', { per_page: 100 }),
      api.get<typeof companySettings>('/settings'),
    ]).then(([c, t, settingsRes]) => {
      setCustomers(c);
      setTrips(t);
      if (settingsRes.data) {
        setCompanySettings((prev) => ({ ...prev, ...settingsRes.data }));
      }
    });
  }, []);

  useEffect(() => {
    if (!isEdit || !id) return;
    setLoadingData(true);
    fetchOne<Invoice>('/invoices', id).then((data) => {
      if (data) {
        const subtotal = Number(data.subtotal);
        setInvoiceNumber(data.invoice_number);
        reset({
          customer_id: data.customer_id,
          trip_id: data.trip_id ?? undefined,
          invoice_date: data.invoice_date?.split('T')[0] ?? '',
          due_date: data.due_date?.split('T')[0] ?? '',
          subtotal,
          cgst_rate: data.cgst_rate != null
            ? Number(data.cgst_rate)
            : deriveRate(Number(data.cgst ?? 0), subtotal),
          sgst_rate: data.sgst_rate != null
            ? Number(data.sgst_rate)
            : deriveRate(Number(data.sgst ?? 0), subtotal),
          igst_rate: data.igst_rate != null
            ? Number(data.igst_rate)
            : deriveRate(Number(data.igst ?? 0), subtotal),
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
      trip_id: data.trip_id ?? null,
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
        subtitle="Enter GST as % — amounts are calculated automatically"
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
                <TextField {...register('trip_id')} label="Trip (Optional)" select fullWidth>
                  <MenuItem value="">None</MenuItem>
                  {trips.map((t) => (
                    <MenuItem key={t.id} value={t.id}>{t.trip_number}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  {...register('invoice_date')}
                  label="Invoice Date"
                  type="date"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  error={!!errors.invoice_date}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
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
                  helperText={`Amount: ${formatCurrency(gst.cgst)}`}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  {...register('sgst_rate')}
                  label="SGST (%)"
                  type="number"
                  fullWidth
                  helperText={`Amount: ${formatCurrency(gst.sgst)}`}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  {...register('igst_rate')}
                  label="IGST (%)"
                  type="number"
                  fullWidth
                  helperText={`Amount: ${formatCurrency(gst.igst)} — use for inter-state`}
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
