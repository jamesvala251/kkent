import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import { useForm, useWatch, type FieldErrors, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import PageHeader from '../../components/common/PageHeader';
import InvoiceLetterhead from '../../components/common/InvoiceLetterhead';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import api from '../../services/api';
import { createItem, downloadInvoicePdf, fetchList, fetchOne, formatCurrency, formatDate, updateItem } from '../../services/resourceService';
import type { Customer, HitachiRental, Invoice, InvoiceExtraCharge, MonthlyInvoicePreview, Trip } from '../../types';

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
  billing_month: yup.string().optional(),
  invoice_date: yup.string().required('Invoice date is required'),
  due_date: yup.string(),
  subtotal: optionalNumber(),
  cgst_rate: optionalNumber(),
  sgst_rate: optionalNumber(),
  igst_rate: optionalNumber(),
  paid_amount: optionalNumber(),
  notes: yup.string(),
});

interface InvoiceFormData {
  customer_id: number;
  trip_id?: number | null;
  hitachi_rental_id?: number | null;
  billing_month?: string;
  invoice_date: string;
  due_date?: string;
  subtotal?: number;
  cgst_rate?: number;
  sgst_rate?: number;
  igst_rate?: number;
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

const tripAmount = (trip: Trip) => {
  const total = Number(trip.total_freight);
  return total > 0 ? total : Number(trip.freight || 0);
};

const tripDateValue = (value?: string) => (value ? value.split('T')[0] : '');

const emptyCharge = (): InvoiceExtraCharge => ({ description: '', amount: 0 });

export default function InvoiceForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id && id !== 'new');
  const [loadingData, setLoadingData] = useState(isEdit || Boolean(searchParams.get('hitachi_rental_id')));
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [rentals, setRentals] = useState<HitachiRental[]>([]);
  const [monthTrips, setMonthTrips] = useState<Trip[]>([]);
  const [extraCharges, setExtraCharges] = useState<InvoiceExtraCharge[]>([emptyCharge()]);
  const [loadingTrips, setLoadingTrips] = useState(false);
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
      billing_month: dayjs().format('YYYY-MM'),
      subtotal: 0,
      cgst_rate: 0,
      sgst_rate: 0,
      igst_rate: 0,
      paid_amount: 0,
      trip_id: null,
      hitachi_rental_id: null,
    },
  });

  const watched = useWatch({ control });
  const selectedCustomerId = Number(watched.customer_id) || 0;
  const billingMonth = watched.billing_month || dayjs().format('YYYY-MM');
  const hasRental = Boolean(watched.hitachi_rental_id);

  const customerRentals = useMemo(() => {
    if (!selectedCustomerId) return [];
    return rentals.filter((r) => Number(r.customer_id) === selectedCustomerId);
  }, [rentals, selectedCustomerId]);

  const selectedRental = customerRentals.find((r) => r.id === Number(watched.hitachi_rental_id));

  const tripTotal = useMemo(
    () => monthTrips.reduce((sum, trip) => sum + tripAmount(trip), 0),
    [monthTrips],
  );
  const extraTotal = useMemo(
    () => extraCharges.reduce((sum, row) => sum + (Number(row.amount) || 0), 0),
    [extraCharges],
  );
  const rentalTotal = hasRental ? Number(selectedRental?.total_amount) || 0 : 0;
  const baseAmount = hasRental ? rentalTotal : tripTotal;
  const subtotal = baseAmount + extraTotal;
  const gst = useMemo(
    () => calcTotals({ ...watched, subtotal }),
    [watched, subtotal],
  );

  const applyRental = (rental: HitachiRental) => {
    setValue('hitachi_rental_id', rental.id);
    setValue('trip_id', null);
    setValue('customer_id', rental.customer_id);
    setMonthTrips([]);
    const noteParts = [
      `Hitachi rental ${rental.rental_number}`,
      rental.hitachi?.machine_number ? `Machine ${rental.hitachi.machine_number}` : null,
      rental.site_location ? `Site: ${rental.site_location}` : null,
    ].filter(Boolean);
    setValue('notes', noteParts.join(' · '));
  };

  useEffect(() => {
    Promise.all([
      fetchList<Customer>('/customers', { per_page: 500 }),
      fetchList<HitachiRental>('/hitachi/rentals', { per_page: 500 }),
      api.get<typeof companySettings>('/settings'),
    ]).then(([c, r, settingsRes]) => {
      setCustomers(c);
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
        const linkedTrips = data.trips?.length ? data.trips : (data.trip ? [data.trip] : []);
        const month =
          data.billing_month
          || (linkedTrips[0]?.start_date ? dayjs(tripDateValue(linkedTrips[0].start_date)).format('YYYY-MM') : dayjs().format('YYYY-MM'));
        setInvoiceNumber(data.invoice_number);
        setMonthTrips(linkedTrips);
        const loadedCharges = (data.extra_charges || [])
          .filter((row) => row.description || Number(row.amount) > 0)
          .map((row) => ({ description: row.description, amount: Number(row.amount) || 0 }));
        setExtraCharges(loadedCharges.length ? loadedCharges : [emptyCharge()]);
        reset({
          customer_id: data.customer_id,
          trip_id: data.trip_id ?? null,
          hitachi_rental_id: data.hitachi_rental_id ?? null,
          billing_month: month,
          invoice_date: data.invoice_date?.split('T')[0] ?? '',
          due_date: data.due_date?.split('T')[0] ?? '',
          subtotal,
          cgst_rate: resolveRate(data.cgst_rate, data.cgst, subtotal),
          sgst_rate: resolveRate(data.sgst_rate, data.sgst, subtotal),
          igst_rate: resolveRate(data.igst_rate, data.igst, subtotal),
          paid_amount: Number(data.paid_amount ?? 0),
          notes: data.notes ?? '',
        });
      }
      setLoadingData(false);
    });
  }, [id, isEdit, reset]);

  useEffect(() => {
    if (loadingData) return;
    if (hasRental) {
      setMonthTrips([]);
      return;
    }
    if (!selectedCustomerId || !billingMonth) {
      setMonthTrips([]);
      return;
    }

    let cancelled = false;
    setLoadingTrips(true);
    api
      .get<MonthlyInvoicePreview>('/invoices/preview-monthly', {
        params: {
          customer_id: selectedCustomerId,
          month: billingMonth,
          ...(isEdit && id ? { exclude_invoice_id: id } : {}),
        },
      })
      .then((res) => {
        if (cancelled) return;
        const preview = res.data;
        setMonthTrips(preview.trips || []);
        if (!isEdit) {
          const monthLabel = dayjs(`${billingMonth}-01`).format('MMMM YYYY');
          const count = preview.trip_count || 0;
          setValue(
            'notes',
            count > 0
              ? `Monthly trips — ${monthLabel} (${count} trip${count === 1 ? '' : 's'})`
              : '',
          );
          const monthEnd = dayjs(`${billingMonth}-01`).endOf('month');
          setValue('invoice_date', monthEnd.format('YYYY-MM-DD'));
          setValue('due_date', monthEnd.add(15, 'day').format('YYYY-MM-DD'));
        }
      })
      .catch(() => {
        if (!cancelled) setMonthTrips([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingTrips(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCustomerId, billingMonth, hasRental, isEdit, id, setValue, loadingData]);

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
      trip_id: null,
      trip_ids: data.hitachi_rental_id ? [] : monthTrips.map((trip) => trip.id),
      billing_month: data.hitachi_rental_id ? null : billingMonth,
      hitachi_rental_id: data.hitachi_rental_id ?? null,
      invoice_date: data.invoice_date,
      due_date: data.due_date || null,
      subtotal,
      extra_charges: extraCharges.filter((row) => row.description.trim() && Number(row.amount) > 0),
      cgst_rate: Number(data.cgst_rate) || 0,
      sgst_rate: Number(data.sgst_rate) || 0,
      igst_rate: Number(data.igst_rate) || 0,
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
        subtitle="Select a customer and month to bill all trips together, or link a Hitachi rental"
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
                  {...register('customer_id', {
                    onChange: (e) => {
                      const nextCustomerId = Number(e.target.value) || 0;
                      const linkedRental = rentals.find((r) => r.id === Number(watched.hitachi_rental_id));
                      if (linkedRental && Number(linkedRental.customer_id) !== nextCustomerId) {
                        setValue('hitachi_rental_id', null);
                      }
                    },
                  })}
                  label="Customer"
                  select
                  fullWidth
                  value={watched.customer_id ?? ''}
                  error={!!errors.customer_id}
                  helperText={errors.customer_id?.message}
                >
                  {customers.map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  {...register('billing_month')}
                  label="Billing Month"
                  type="month"
                  fullWidth
                  disabled={hasRental}
                  slotProps={{ inputLabel: { shrink: true } }}
                  helperText={hasRental ? 'Clear Hitachi rental to bill monthly trips' : 'All trips in this month are included'}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  select
                  fullWidth
                  label="Hitachi Rental (Optional)"
                  value={watched.hitachi_rental_id ?? ''}
                  disabled={!selectedCustomerId}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!value) {
                      setValue('hitachi_rental_id', null);
                      return;
                    }
                    const rental = rentals.find((item) => item.id === Number(value));
                    if (rental) applyRental(rental);
                  }}
                  helperText={
                    !selectedCustomerId
                      ? 'Select a customer to see related Hitachi rentals'
                      : 'Selecting a rental bills equipment instead of trips'
                  }
                >
                  <MenuItem value="">None</MenuItem>
                  {customerRentals.map((r) => (
                    <MenuItem key={r.id} value={r.id}>
                      {r.rental_number} · {r.hitachi?.machine_number ?? 'Machine'} · {billingLabel(r)} · {formatCurrency(Number(r.total_amount))}
                    </MenuItem>
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
            </Grid>

            {!hasRental && (
              <>
                <Divider sx={{ my: 3 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Trips in {dayjs(`${billingMonth}-01`).format('MMMM YYYY')}
                  </Typography>
                  {loadingTrips && <CircularProgress size={18} />}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {selectedCustomerId
                    ? 'Every uninvoiced trip for this customer in the selected month is added to the invoice.'
                    : 'Select a customer to load trips for the month.'}
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Trip #</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Route</TableCell>
                      <TableCell>Truck / Driver</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {monthTrips.map((trip) => (
                      <TableRow key={trip.id}>
                        <TableCell>{trip.trip_number}</TableCell>
                        <TableCell>{formatDate(tripDateValue(trip.start_date))}</TableCell>
                        <TableCell>
                          {trip.from_location || trip.to_location
                            ? `${trip.from_location || '-'} → ${trip.to_location || '-'}`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {[trip.truck?.truck_number, trip.driver?.name].filter(Boolean).join(' · ') || '-'}
                        </TableCell>
                        <TableCell align="right">{formatCurrency(tripAmount(trip))}</TableCell>
                      </TableRow>
                    ))}
                    {!loadingTrips && monthTrips.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          {selectedCustomerId ? 'No uninvoiced trips for this customer in this month' : '—'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                  {monthTrips.length > 0 && (
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={4} sx={{ fontWeight: 700 }}>
                          Total ({monthTrips.length} trip{monthTrips.length === 1 ? '' : 's'})
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {formatCurrency(monthTrips.reduce((sum, trip) => sum + tripAmount(trip), 0))}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  )}
                </Table>
              </>
            )}

            <Divider sx={{ my: 3 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Extra charges / additional work
              </Typography>
              <Button
                type="button"
                size="small"
                startIcon={<AddIcon />}
                onClick={(e) => {
                  e.preventDefault();
                  setExtraCharges((rows) => [...rows, emptyCharge()]);
                }}
              >
                Add extra charge
              </Button>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Optional. Add loading, extra work, or any other charge after the trips.
            </Typography>
            {extraCharges.map((row, index) => (
                <Grid container spacing={2} key={`extra-${index}`} sx={{ mb: 1 }}>
                  <Grid size={{ xs: 12, md: 7 }}>
                    <TextField
                      label="Description"
                      fullWidth
                      value={row.description}
                      onChange={(e) => {
                        const value = e.target.value;
                        setExtraCharges((rows) => rows.map((item, i) => (i === index ? { ...item, description: value } : item)));
                      }}
                      placeholder="e.g. Extra loading, Sunday work"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.preventDefault();
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      label="Amount (₹)"
                      type="number"
                      fullWidth
                      value={row.amount || ''}
                      onChange={(e) => {
                        const value = Number(e.target.value) || 0;
                        setExtraCharges((rows) => rows.map((item, i) => (i === index ? { ...item, amount: value } : item)));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.preventDefault();
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 1 }} sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton
                      type="button"
                      color="error"
                      onClick={(e) => {
                        e.preventDefault();
                        setExtraCharges((rows) => (rows.length <= 1 ? [emptyCharge()] : rows.filter((_, i) => i !== index)));
                      }}
                      aria-label="Remove extra charge"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
            ))}

            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>
              Amount & tax (optional)
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label={hasRental ? 'Rental amount (₹)' : 'Trips total (₹)'}
                  value={formatCurrency(baseAmount)}
                  fullWidth
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Extra charges (₹)"
                  value={formatCurrency(extraTotal)}
                  fullWidth
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Subtotal (₹)"
                  value={formatCurrency(subtotal)}
                  fullWidth
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  {...register('cgst_rate')}
                  label="CGST (%)"
                  type="number"
                  fullWidth
                  placeholder="Optional"
                  inputProps={{ min: 0, max: 100, step: 0.01 }}
                  InputProps={{ endAdornment: <Typography color="text.secondary">%</Typography> }}
                  helperText={Number(watched.cgst_rate) > 0 ? `Tax amount: ${formatCurrency(gst.cgst)}` : 'Optional'}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  {...register('sgst_rate')}
                  label="SGST (%)"
                  type="number"
                  fullWidth
                  placeholder="Optional"
                  inputProps={{ min: 0, max: 100, step: 0.01 }}
                  InputProps={{ endAdornment: <Typography color="text.secondary">%</Typography> }}
                  helperText={Number(watched.sgst_rate) > 0 ? `Tax amount: ${formatCurrency(gst.sgst)}` : 'Optional'}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  {...register('igst_rate')}
                  label="IGST (%)"
                  type="number"
                  fullWidth
                  placeholder="Optional"
                  inputProps={{ min: 0, max: 100, step: 0.01 }}
                  InputProps={{ endAdornment: <Typography color="text.secondary">%</Typography> }}
                  helperText={Number(watched.igst_rate) > 0 ? `Tax amount: ${formatCurrency(gst.igst)}` : 'Optional — inter-state'}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField label="Total Amount" value={formatCurrency(gst.total)} fullWidth slotProps={{ input: { readOnly: true } }} />
              </Grid>
              {isEdit && (
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField {...register('paid_amount')} label="Paid Amount (₹)" type="number" fullWidth />
                </Grid>
              )}
              <Grid size={{ xs: 12 }}>
                <Typography variant="body2" color="text.secondary">
                  Tax is optional. Leave CGST / SGST / IGST at 0 if not applicable.
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
