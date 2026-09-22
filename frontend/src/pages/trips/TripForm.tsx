import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControlLabel,
  InputAdornment,
  MenuItem,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useForm, useWatch, type FieldErrors, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import PageHeader from '../../components/common/PageHeader';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import { createItem, fetchList, fetchOne, formatCurrency, updateItem } from '../../services/resourceService';
import api from '../../services/api';
import type { Customer, Driver, HitachiMachine, Trip, Truck } from '../../types';

const toNumber = (value: unknown, fallback?: number) => {
  if (value === '' || value === null || value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const requiredId = (label: string) =>
  yup
    .number()
    .transform((_value, originalValue) => toNumber(originalValue))
    .required(`${label} is required`);

const optionalNumber = () =>
  yup
    .number()
    .transform((_value, originalValue) => toNumber(originalValue))
    .optional();

const schema = yup.object({
  customer_id: requiredId('Customer'),
  truck_id: requiredId('Truck'),
  driver_id: requiredId('Driver'),
  hitachi_id: yup
    .number()
    .transform((_value, originalValue) => toNumber(originalValue))
    .optional()
    .nullable(),
  start_date: yup.string().required('Trip date is required'),
  from_location: yup.string().default(''),
  to_location: yup.string().default(''),
  material: yup.string(),
  weight: optionalNumber(),
  start_km: optionalNumber(),
  end_km: optionalNumber(),
  diesel_qty: optionalNumber(),
  diesel_rate: optionalNumber(),
  toll: optionalNumber(),
  maintenance: optionalNumber(),
  other_expense: optionalNumber(),
  driver_salary: optionalNumber(),
  freight: optionalNumber(),
  advance_received: optionalNumber(),
  compressor: yup.boolean(),
  remarks: yup.string(),
});

interface TripFormData {
  customer_id: number;
  truck_id: number;
  driver_id: number;
  hitachi_id?: number;
  start_date: string;
  from_location: string;
  to_location: string;
  material?: string;
  weight?: number;
  start_km?: number;
  end_km?: number;
  diesel_qty?: number;
  diesel_rate?: number;
  toll?: number;
  maintenance?: number;
  other_expense?: number;
  driver_salary?: number;
  freight?: number;
  advance_received?: number;
  compressor?: boolean;
  remarks?: string;
}

const calcTotalKm = (start?: number | null, end?: number | null) => {
  if (start == null || end == null) return 0;
  return Math.max(0, Number(end) - Number(start));
};

const calcDieselAmount = (qty?: number | null, rate?: number | null) => {
  return (Number(qty) || 0) * (Number(rate) || 0);
};

const calcTotalExpense = (
  diesel: number,
  toll?: number | null,
  maintenance?: number | null,
  other?: number | null,
  salary?: number | null,
) => diesel + (Number(toll) || 0) + (Number(maintenance) || 0) + (Number(other) || 0) + (Number(salary) || 0);

const calcTotalFreight = (rate?: number | null, weight?: number | null) =>
  (Number(rate) || 0) * (Number(weight) || 0);

export default function TripForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isView = Boolean(id && id !== 'new' && !location.pathname.endsWith('/edit'));
  const isEdit = Boolean(id && id !== 'new' && location.pathname.endsWith('/edit'));
  const [loadingData, setLoadingData] = useState(true);
  const [autoTripNumber, setAutoTripNumber] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TripFormData>({
    resolver: yupResolver(schema) as Resolver<TripFormData>,
    defaultValues: {
      start_date: dayjs().format('YYYY-MM-DD'),
      from_location: '',
      to_location: '',
      compressor: false,
      diesel_qty: 0,
      diesel_rate: 0,
      start_km: 0,
      toll: 0,
      maintenance: 0,
      other_expense: 0,
      driver_salary: 0,
      freight: 0,
      advance_received: 0,
    },
  });

  const watched = useWatch({ control });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [machines, setMachines] = useState<HitachiMachine[]>([]);
  const [defaultDieselRate, setDefaultDieselRate] = useState<number | null>(null);
  const [dieselFromStock, setDieselFromStock] = useState(false);

  const calculations = useMemo(() => {
    const total_km = calcTotalKm(watched.start_km, watched.end_km);
    const diesel_amount = calcDieselAmount(watched.diesel_qty, watched.diesel_rate);
    const total_expense = calcTotalExpense(
      diesel_amount,
      watched.toll,
      watched.maintenance,
      watched.other_expense,
      watched.driver_salary,
    );
    const total_freight = calcTotalFreight(watched.freight, watched.weight);
    const advance = Number(watched.advance_received) || 0;
    const balance = total_freight - advance;
    const profit = total_freight - total_expense;
    return { total_km, diesel_amount, total_expense, total_freight, balance, profit };
  }, [watched]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const [c, t, d, h, settingsRes] = await Promise.all([
        fetchList<Customer>('/customers', { per_page: 500 }),
        fetchList<Truck>('/trucks', { per_page: 500 }),
        fetchList<Driver>('/drivers', { per_page: 500 }),
        fetchList<HitachiMachine>('/hitachi-machines', { per_page: 500 }),
        api.get<{ diesel_default_price?: number }>('/settings').catch(() => ({ data: {} })),
      ]);

      if (cancelled) return;

      setCustomers(c);
      setTrucks(t);
      setDrivers(d);
      setMachines(h);
      const settingsData = settingsRes.data as { diesel_default_price?: number };
      const dieselPrice = Number(settingsData.diesel_default_price) || 0;
      setDefaultDieselRate(dieselPrice);

      if ((isEdit || isView) && id) {
        const [data, issues] = await Promise.all([
          fetchOne<Trip>('/trips', id),
          fetchList('/diesel/issues', { trip_id: id, per_page: 5 }),
        ]);
        if (cancelled) return;
        setDieselFromStock(issues.length > 0);
        if (data) {
          setAutoTripNumber(data.trip_number);
          reset({
            customer_id: data.customer_id,
            truck_id: data.truck_id,
            driver_id: data.driver_id,
            hitachi_id: data.hitachi_id ?? undefined,
            start_date: data.start_date?.split('T')[0] ?? '',
            from_location: data.from_location ?? '',
            to_location: data.to_location ?? '',
            material: data.material ?? '',
            weight: data.weight != null ? Number(data.weight) : undefined,
            start_km: data.start_km != null ? Number(data.start_km) : undefined,
            end_km: data.end_km != null ? Number(data.end_km) : undefined,
            diesel_qty: data.diesel_qty != null ? Number(data.diesel_qty) : 0,
            diesel_rate: data.diesel_rate != null ? Number(data.diesel_rate) : 0,
            toll: data.toll != null ? Number(data.toll) : 0,
            maintenance: data.maintenance != null ? Number(data.maintenance) : 0,
            other_expense: data.other_expense != null ? Number(data.other_expense) : 0,
            driver_salary: data.driver_salary != null ? Number(data.driver_salary) : 0,
            freight: data.freight != null ? Number(data.freight) : 0,
            advance_received: data.advance_received != null ? Number(data.advance_received) : 0,
            compressor: data.compressor ?? false,
            remarks: data.remarks ?? '',
          });
        } else {
          toast.error('Failed to load trip');
        }
      } else {
        const next = await api.get<{ trip_number: string }>('/trips/next-number');
        if (!cancelled) setAutoTripNumber(next.data.trip_number);
        if (dieselPrice > 0) setValue('diesel_rate', dieselPrice);
      }

      if (!cancelled) setLoadingData(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit, isView, reset, setValue]);

  const onInvalid = (formErrors: FieldErrors<TripFormData>) => {
    const firstError = Object.values(formErrors).find((error) => error?.message);
    toast.error(firstError?.message ? String(firstError.message) : 'Please fill all required fields');
  };

  const onSubmit = async (data: TripFormData) => {
    if (isView) return;
    const payload: Partial<Trip> = {
      ...data,
      hitachi_id: data.hitachi_id ?? undefined,
      end_date: null,
    };
    try {
      if (isEdit && id) {
        await updateItem<Trip>('/trips', id, payload);
        toast.success('Trip updated');
      } else {
        await createItem<Trip>('/trips', payload);
        toast.success('Trip created');
      }
      navigate('/trips');
    } catch {
      // API errors are surfaced by the axios interceptor
    }
  };

  const SummaryRow = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: 1, borderColor: 'divider' }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: highlight ? 700 : 500 }} color={highlight ? 'success.main' : 'text.primary'}>
        {value}
      </Typography>
    </Box>
  );

  if (loadingData) return <LoadingSkeleton variant="form" rows={10} />;

  return (
    <Box>
      <PageHeader
        title={isView ? 'View Trip' : isEdit ? 'Edit Trip' : 'New Trip Entry'}
        subtitle="Freight rate × weight = total freight; profit = total freight − expenses"
        breadcrumbs={[{ label: 'Trips', to: '/trips' }, { label: isView ? 'View' : isEdit ? 'Edit' : 'New' }]}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            {isView && id && (
              <Button variant="contained" startIcon={<EditIcon />} onClick={() => navigate(`/trips/${id}/edit`)}>
                Edit
              </Button>
            )}
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/trips')}>
              Back
            </Button>
          </Box>
        }
      />

      <Box component="form" onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
      <fieldset disabled={isView} style={{ border: 'none', margin: 0, padding: 0, minInlineSize: 0 }}>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ mb: 2.5 }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>
                Trip Details
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Trip Number"
                    value={autoTripNumber}
                    fullWidth
                    margin="normal"
                    slotProps={{
                      input: { readOnly: true },
                      inputLabel: { shrink: true },
                    }}
                    helperText={isEdit || isView ? 'Trip number cannot be changed' : 'Auto-generated on save'}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    {...register('start_date')}
                    label="Trip Date"
                    type="date"
                    fullWidth
                    slotProps={{ inputLabel: { shrink: true } }}
                    error={!!errors.start_date}
                    helperText={errors.start_date?.message}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    {...register('customer_id')}
                    label="Party Name (Customer)"
                    select
                    fullWidth
                    value={watched.customer_id ?? ''}
                    error={!!errors.customer_id}
                    helperText={errors.customer_id?.message}
                    onChange={(e) => {
                      const customerId = Number(e.target.value) || 0;
                      setValue('customer_id', customerId, { shouldValidate: true });
                      const customer = customers.find((c) => c.id === customerId);
                      const rate = Number(customer?.rate) || 0;
                      if (rate > 0) {
                        setValue('freight', rate, { shouldDirty: true });
                      }
                    }}
                  >
                    {customers.map((c) => (
                      <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    {...register('truck_id')}
                    label="Truck"
                    select
                    fullWidth
                    value={watched.truck_id ?? ''}
                    error={!!errors.truck_id}
                    helperText={errors.truck_id?.message}
                  >
                    {trucks.map((t) => (
                      <MenuItem key={t.id} value={t.id}>{t.truck_number}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    {...register('driver_id')}
                    label="Driver"
                    select
                    fullWidth
                    value={watched.driver_id ?? ''}
                    error={!!errors.driver_id}
                    helperText={errors.driver_id?.message}
                  >
                    {drivers.map((d) => (
                      <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField {...register('hitachi_id')} label="Hitachi (Optional)" select fullWidth value={watched.hitachi_id ?? ''}>
                    <MenuItem value="">None</MenuItem>
                    {machines.map((m) => (
                      <MenuItem key={m.id} value={m.id}>{m.machine_number}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField {...register('material')} label="Material" fullWidth />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControlLabel
                    control={<Switch disabled={isView} checked={!!watched.compressor} onChange={(e) => setValue('compressor', e.target.checked)} />}
                    label="Compressor"
                    sx={{ mt: 2 }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ mb: 2.5 }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>
                Diesel
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    {...register('diesel_qty')}
                    label="Diesel Qty (Liters)"
                    type="number"
                    fullWidth
                    disabled={dieselFromStock}
                    helperText={
                      dieselFromStock
                        ? 'Synced from diesel stock issues for this trip'
                        : defaultDieselRate
                          ? `Price: ₹${defaultDieselRate} per liter. Link a Diesel issue to keep stock in sync.`
                          : 'Link a Diesel issue to keep stock in sync'
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    {...register('diesel_rate')}
                    label="Diesel Rate"
                    type="number"
                    fullWidth
                    disabled={dieselFromStock}
                    slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="Diesel Amount"
                    value={calculations.diesel_amount.toFixed(2)}
                    fullWidth
                    helperText={defaultDieselRate ? `Auto-calculated: Diesel Qty × ₹${defaultDieselRate}` : 'Auto-calculated: Diesel Qty × Rate'}
                    slotProps={{ input: { readOnly: true, startAdornment: <InputAdornment position="start">₹</InputAdornment> } }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>
                Expenses & Revenue
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField {...register('toll')} label="Toll" type="number" fullWidth slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }} />
                  </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField {...register('maintenance')} label="Maintenance" type="number" fullWidth slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }} />
                  </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField {...register('other_expense')} label="Other Expense" type="number" fullWidth slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }} />
                  </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField {...register('driver_salary')} label="Driver Salary" type="number" fullWidth slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }} />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    {...register('freight')}
                    label="Freight (₹/Ton)"
                    type="number"
                    fullWidth
                    helperText="Auto-filled from customer rate when available"
                    slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField {...register('weight')} label="Weight (Ton)" type="number" fullWidth />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="Total Freight"
                    value={calculations.total_freight.toFixed(2)}
                    fullWidth
                    helperText="Auto-calculated: Freight × Weight"
                    slotProps={{ input: { readOnly: true, startAdornment: <InputAdornment position="start">₹</InputAdornment> } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField {...register('advance_received')} label="Advance Received" type="number" fullWidth slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField {...register('remarks')} label="Remarks" fullWidth multiline rows={2} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ position: 'sticky', top: 88 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
                Forward Trip Summary
              </Typography>
              <Divider sx={{ mb: 1 }} />
              <SummaryRow label="Total Expenses" value={formatCurrency(calculations.total_expense)} />
              <SummaryRow label="Total Profit" value={formatCurrency(calculations.profit)} highlight />
              <Divider sx={{ my: 1.5 }} />
              <SummaryRow label="Total Freight" value={formatCurrency(calculations.total_freight)} />
              <SummaryRow label="Advance Received" value={formatCurrency(Number(watched.advance_received) || 0)} />
              <SummaryRow label="Balance" value={formatCurrency(calculations.balance)} />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Trip date: {watched.start_date || '—'}
              </Typography>

              {!isView && (
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={<SaveIcon />}
                  sx={{ mt: 3 }}
                  disabled={isSubmitting}
                >
                  {isEdit ? 'Update Trip' : 'Save Trip'}
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      </fieldset>
      </Box>
    </Box>
  );
}