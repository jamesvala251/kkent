import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Link,
  MenuItem,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useForm, useWatch, type FieldErrors, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import PageHeader from '../../components/common/PageHeader';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import {
  createItem,
  createWithFile,
  fetchList,
  fetchOne,
  getStorageUrl,
  updateItem,
  updateWithFile,
} from '../../services/resourceService';
import api from '../../services/api';
import type { Driver, Expense, ExpenseCategory, HitachiMachine, HitachiRental, Trip, Truck } from '../../types';

const toNumber = (value: unknown, fallback?: number) => {
  if (value === '' || value === null || value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const optionalId = () =>
  yup
    .number()
    .transform((_value, originalValue) => toNumber(originalValue))
    .optional()
    .nullable();

const schema = yup.object({
  expense_date: yup.string().required('Expense date is required'),
  category_id: yup
    .number()
    .transform((_value, originalValue) => toNumber(originalValue))
    .required('Category is required'),
  amount: yup
    .number()
    .transform((_value, originalValue) => toNumber(originalValue))
    .moreThan(0, 'Amount must be greater than 0')
    .required('Amount is required'),
  description: yup.string(),
  truck_id: optionalId(),
  driver_id: optionalId(),
  trip_id: optionalId(),
  hitachi_id: optionalId(),
  hitachi_rental_id: optionalId(),
});

interface ExpenseFormData {
  expense_date: string;
  category_id: number;
  amount: number;
  description?: string;
  truck_id?: number | null;
  driver_id?: number | null;
  trip_id?: number | null;
  hitachi_id?: number | null;
  hitachi_rental_id?: number | null;
}

type ExpenseKind = 'truck' | 'hitachi' | 'other';

function inferKind(data: Partial<Expense>): ExpenseKind {
  if (data.hitachi_id || data.hitachi_rental_id || data.hitachi || data.hitachi_rental) return 'hitachi';
  if (data.truck_id || data.trip_id || data.driver_id) return 'truck';
  return 'other';
}

export default function ExpenseForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id && id !== 'new');
  const requestedKind = searchParams.get('kind');
  const [kind, setKind] = useState<ExpenseKind>(
    requestedKind === 'hitachi' || requestedKind === 'other' || requestedKind === 'truck' ? requestedKind : 'truck',
  );
  const [loadingData, setLoadingData] = useState(true);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [hitachiMachines, setHitachiMachines] = useState<HitachiMachine[]>([]);
  const [rentals, setRentals] = useState<HitachiRental[]>([]);
  const [billFile, setBillFile] = useState<File | null>(null);
  const [existingBillPath, setExistingBillPath] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormData>({
    resolver: yupResolver(schema) as Resolver<ExpenseFormData>,
    defaultValues: {
      expense_date: dayjs().format('YYYY-MM-DD'),
      description: '',
    },
  });

  const watched = useWatch({ control });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const [categoriesRes, t, d, tripList, machineList, rentalList] = await Promise.all([
        api.get<ExpenseCategory[]>('/expense-categories'),
        fetchList<Truck>('/trucks', { per_page: 500 }),
        fetchList<Driver>('/drivers', { per_page: 500 }),
        fetchList<Trip>('/trips', { per_page: 500 }),
        fetchList<HitachiMachine>('/hitachi-machines', { per_page: 500 }),
        fetchList<HitachiRental>('/hitachi/rentals', { per_page: 500 }),
      ]);
      if (cancelled) return;

      setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : []);
      setTrucks(t);
      setDrivers(d);
      setTrips(tripList);
      setHitachiMachines(Array.isArray(machineList) ? machineList : []);
      setRentals(Array.isArray(rentalList) ? rentalList : []);

      if (isEdit && id) {
        const data = await fetchOne<Expense>('/expenses', id);
        if (cancelled) return;
        if (data) {
          const hitachiId = data.hitachi_id ?? data.hitachi_rental?.hitachi_id ?? data.hitachi_rental?.hitachi?.id;
          reset({
            expense_date: data.expense_date?.split('T')[0] ?? '',
            category_id: data.category_id,
            amount: Number(data.amount),
            description: data.description ?? '',
            truck_id: data.truck_id ?? undefined,
            driver_id: data.driver_id ?? undefined,
            trip_id: data.trip_id ?? undefined,
            hitachi_id: hitachiId ?? undefined,
            hitachi_rental_id: data.hitachi_rental_id ?? undefined,
          });
          setExistingBillPath(data.bill_path ?? null);
          setKind(inferKind(data));
        } else {
          toast.error('Failed to load expense');
        }
      }

      if (!isEdit) {
        const truckId = Number(searchParams.get('truck_id')) || 0;
        const hitachiId = Number(searchParams.get('hitachi_id')) || 0;
        const tripId = Number(searchParams.get('trip_id')) || 0;
        if (truckId) setValue('truck_id', truckId);
        if (hitachiId) setValue('hitachi_id', hitachiId);
        if (tripId) setValue('trip_id', tripId);
      }

      if (!cancelled) setLoadingData(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit, reset, searchParams, setValue]);

  const onInvalid = (formErrors: FieldErrors<ExpenseFormData>) => {
    const firstError = Object.values(formErrors).find((error) => error?.message);
    toast.error(firstError?.message ? String(firstError.message) : 'Please fill all required fields');
  };

  const applyKind = (next: ExpenseKind) => {
    setKind(next);
    if (next === 'hitachi') {
      setValue('truck_id', null);
      setValue('driver_id', null);
      setValue('trip_id', null);
    } else if (next === 'truck') {
      setValue('hitachi_id', null);
      setValue('hitachi_rental_id', null);
    } else {
      setValue('truck_id', null);
      setValue('driver_id', null);
      setValue('trip_id', null);
      setValue('hitachi_id', null);
      setValue('hitachi_rental_id', null);
    }
  };

  const buildPayload = (data: ExpenseFormData): Partial<Expense> => {
    const base = {
      expense_date: data.expense_date,
      category_id: data.category_id,
      amount: data.amount,
      description: data.description || undefined,
    };
    if (kind === 'hitachi') {
      return {
        ...base,
        truck_id: null,
        driver_id: null,
        trip_id: null,
        hitachi_id: data.hitachi_id ?? null,
        hitachi_rental_id: data.hitachi_rental_id ?? null,
      };
    }
    if (kind === 'truck') {
      return {
        ...base,
        truck_id: data.truck_id ?? null,
        driver_id: data.driver_id ?? null,
        trip_id: data.trip_id ?? null,
        hitachi_id: null,
        hitachi_rental_id: null,
      };
    }
    return {
      ...base,
      truck_id: null,
      driver_id: null,
      trip_id: null,
      hitachi_id: null,
      hitachi_rental_id: null,
    };
  };

  const buildFormData = (data: ExpenseFormData) => {
    const formData = new FormData();
    const payload = buildPayload(data);
    Object.entries(payload).forEach(([key, value]) => {
      formData.append(key, value === null || value === undefined ? '' : String(value));
    });
    if (billFile) {
      formData.append('bill', billFile);
    }
    return formData;
  };

  const onSubmit = async (data: ExpenseFormData) => {
    if (kind === 'hitachi' && !data.hitachi_id) {
      toast.error('Select a Hitachi machine');
      return;
    }
    try {
      if (billFile) {
        const formData = buildFormData(data);
        if (isEdit && id) {
          await updateWithFile<Expense>('/expenses', id, formData);
          toast.success('Expense updated');
        } else {
          await createWithFile<Expense>('/expenses', formData);
          toast.success('Expense created');
        }
      } else if (isEdit && id) {
        await updateItem<Expense>('/expenses', id, buildPayload(data));
        toast.success('Expense updated');
      } else {
        await createItem<Expense>('/expenses', buildPayload(data));
        toast.success('Expense created');
      }
      navigate(`/expenses?tab=${kind}`);
    } catch {
      // API errors are surfaced by the axios interceptor
    }
  };

  const existingBillUrl = getStorageUrl(existingBillPath);
  const machineRentals = rentals.filter((rental) => Number(rental.hitachi_id) === Number(watched.hitachi_id));

  if (loadingData) return <LoadingSkeleton variant="form" rows={8} />;

  return (
    <Box>
      <PageHeader
        title={isEdit ? 'Edit Expense' : 'Add Expense'}
        subtitle="Record a truck, Hitachi, or general expense"
        breadcrumbs={[{ label: 'Expenses', to: '/expenses' }, { label: isEdit ? 'Edit' : 'New' }]}
        action={
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/expenses')}>
            Back
          </Button>
        }
      />

      <Card>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Expense type</Typography>
                <ToggleButtonGroup
                  exclusive
                  color="primary"
                  value={kind}
                  onChange={(_, value: ExpenseKind | null) => {
                    if (value) applyKind(value);
                  }}
                >
                  <ToggleButton value="truck">Truck / trip</ToggleButton>
                  <ToggleButton value="hitachi">Hitachi</ToggleButton>
                  <ToggleButton value="other">Other / general</ToggleButton>
                </ToggleButtonGroup>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  {...register('expense_date')}
                  label="Expense Date"
                  type="date"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  error={!!errors.expense_date}
                  helperText={errors.expense_date?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  {...register('category_id')}
                  label="Category"
                  select
                  fullWidth
                  value={watched.category_id ?? ''}
                  error={!!errors.category_id}
                  helperText={errors.category_id?.message}
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  {...register('amount')}
                  label="Amount"
                  type="number"
                  fullWidth
                  error={!!errors.amount}
                  helperText={errors.amount?.message}
                />
              </Grid>
              {kind === 'truck' && (
                <>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField {...register('truck_id')} label="Truck (Optional)" select fullWidth value={watched.truck_id ?? ''}>
                  <MenuItem value="">None</MenuItem>
                  {trucks.map((truck) => (
                    <MenuItem key={truck.id} value={truck.id}>
                      {truck.truck_number}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField {...register('driver_id')} label="Driver (Optional)" select fullWidth value={watched.driver_id ?? ''}>
                  <MenuItem value="">None</MenuItem>
                  {drivers.map((driver) => (
                    <MenuItem key={driver.id} value={driver.id}>
                      {driver.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField {...register('trip_id')} label="Trip (Optional)" select fullWidth value={watched.trip_id ?? ''}>
                  <MenuItem value="">None</MenuItem>
                  {trips.map((trip) => (
                    <MenuItem key={trip.id} value={trip.id}>
                      {trip.trip_number}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
                </>
              )}
              {kind === 'hitachi' && (
                <>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  {...register('hitachi_id', {
                    onChange: (e) => {
                      const nextId = Number(e.target.value) || 0;
                      const linked = rentals.find((rental) => rental.id === Number(watched.hitachi_rental_id));
                      if (linked && Number(linked.hitachi_id) !== nextId) {
                        setValue('hitachi_rental_id', null);
                      }
                    },
                  })}
                  label="Hitachi machine"
                  select
                  fullWidth
                  value={watched.hitachi_id ?? ''}
                >
                  <MenuItem value="">None</MenuItem>
                  {hitachiMachines.map((machine) => (
                    <MenuItem key={machine.id} value={machine.id}>
                      {machine.machine_number}
                      {machine.registration_number ? ` · ${machine.registration_number}` : ''}
                      {machine.model ? ` · ${machine.model}` : ''}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  label="Hitachi rental (Optional)"
                  value={watched.hitachi_rental_id ?? ''}
                  disabled={!watched.hitachi_id}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!value) {
                      setValue('hitachi_rental_id', null);
                      return;
                    }
                    const rental = rentals.find((item) => item.id === Number(value));
                    setValue('hitachi_rental_id', rental?.id ?? null);
                    if (rental?.hitachi_id) setValue('hitachi_id', rental.hitachi_id);
                  }}
                  helperText={!watched.hitachi_id ? 'Select a Hitachi machine first' : 'Attach this cost to a rental'}
                >
                  <MenuItem value="">None</MenuItem>
                  {machineRentals.map((rental) => (
                    <MenuItem key={rental.id} value={rental.id}>
                      {rental.rental_number}
                      {rental.site_location ? ` · ${rental.site_location}` : ''}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
                </>
              )}
              {kind === 'other' && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body2" color="text.secondary">
                    Other expenses are not linked to a truck, trip, or Hitachi machine — office, diesel stock, insurance, EMI, and similar costs.
                  </Typography>
                </Grid>
              )}
              <Grid size={{ xs: 12 }}>
                <TextField
                  {...register('description')}
                  label="Description"
                  fullWidth
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.75 }}>
                  Bill / Receipt (optional)
                </Typography>
                <Button variant="outlined" component="label">
                  {billFile ? billFile.name : 'Attach bill'}
                  <input
                    hidden
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(event) => {
                      setBillFile(event.target.files?.[0] ?? null);
                      event.target.value = '';
                    }}
                  />
                </Button>
                {billFile && (
                  <Button sx={{ ml: 1 }} onClick={() => setBillFile(null)}>
                    Remove
                  </Button>
                )}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                  You can save this expense without a receipt.
                </Typography>
                {existingBillUrl && !billFile && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Current bill:{' '}
                    <Link href={existingBillUrl} target="_blank" rel="noopener noreferrer">
                      View uploaded bill
                    </Link>
                  </Typography>
                )}
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={isSubmitting}
                >
                  {isEdit ? 'Update Expense' : 'Save Expense'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
