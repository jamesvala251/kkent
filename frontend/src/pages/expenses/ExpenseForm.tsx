import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Link,
  MenuItem,
  TextField,
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
import type { Driver, Expense, ExpenseCategory, HitachiRental, Trip, Truck } from '../../types';

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
  hitachi_rental_id?: number | null;
}

export default function ExpenseForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id && id !== 'new');
  const [loadingData, setLoadingData] = useState(true);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [hitachiRentals, setHitachiRentals] = useState<HitachiRental[]>([]);
  const [billFile, setBillFile] = useState<File | null>(null);
  const [existingBillPath, setExistingBillPath] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
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
      const [categoriesRes, t, d, tripList, rentalList] = await Promise.all([
        api.get<ExpenseCategory[]>('/expense-categories'),
        fetchList<Truck>('/trucks', { per_page: 500 }),
        fetchList<Driver>('/drivers', { per_page: 500 }),
        fetchList<Trip>('/trips', { per_page: 500 }),
        fetchList<HitachiRental>('/hitachi/rentals', { per_page: 500 }),
      ]);
      if (cancelled) return;

      setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : []);
      setTrucks(t);
      setDrivers(d);
      setTrips(tripList);
      setHitachiRentals(rentalList);

      if (isEdit && id) {
        const data = await fetchOne<Expense>('/expenses', id);
        if (cancelled) return;
        if (data) {
          reset({
            expense_date: data.expense_date?.split('T')[0] ?? '',
            category_id: data.category_id,
            amount: Number(data.amount),
            description: data.description ?? '',
            truck_id: data.truck_id ?? undefined,
            driver_id: data.driver_id ?? undefined,
            trip_id: data.trip_id ?? undefined,
            hitachi_rental_id: data.hitachi_rental_id ?? undefined,
          });
          setExistingBillPath(data.bill_path ?? null);
        } else {
          toast.error('Failed to load expense');
        }
      }

      if (!cancelled) setLoadingData(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit, reset]);

  const onInvalid = (formErrors: FieldErrors<ExpenseFormData>) => {
    const firstError = Object.values(formErrors).find((error) => error?.message);
    toast.error(firstError?.message ? String(firstError.message) : 'Please fill all required fields');
  };

  const buildPayload = (data: ExpenseFormData): Partial<Expense> => ({
    expense_date: data.expense_date,
    category_id: data.category_id,
    amount: data.amount,
    description: data.description || undefined,
    truck_id: data.truck_id ?? undefined,
    driver_id: data.driver_id ?? undefined,
    trip_id: data.trip_id ?? undefined,
    hitachi_rental_id: data.hitachi_rental_id ?? undefined,
  });

  const buildFormData = (data: ExpenseFormData) => {
    const formData = new FormData();
    const payload = buildPayload(data);
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });
    if (billFile) {
      formData.append('bill', billFile);
    }
    return formData;
  };

  const onSubmit = async (data: ExpenseFormData) => {
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
      navigate('/expenses');
    } catch {
      // API errors are surfaced by the axios interceptor
    }
  };

  const existingBillUrl = getStorageUrl(existingBillPath);

  if (loadingData) return <LoadingSkeleton variant="form" rows={8} />;

  return (
    <Box>
      <PageHeader
        title={isEdit ? 'Edit Expense' : 'Add Expense'}
        subtitle="Record operational, trip, or Hitachi rental expenses"
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
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField {...register('hitachi_rental_id')} label="Hitachi Rental (Optional)" select fullWidth value={watched.hitachi_rental_id ?? ''}>
                  <MenuItem value="">None</MenuItem>
                  {hitachiRentals.map((rental) => (
                    <MenuItem key={rental.id} value={rental.id}>
                      {rental.rental_number}
                      {rental.hitachi?.machine_number ? ` · ${rental.hitachi.machine_number}` : ''}
                      {rental.customer?.name ? ` · ${rental.customer.name}` : ''}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
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
                <TextField
                  type="file"
                  label="Bill / Receipt"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  inputProps={{ accept: 'image/*,.pdf' }}
                  onChange={(event) => {
                    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
                    setBillFile(file);
                  }}
                />
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
