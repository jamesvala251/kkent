import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Button, Card, CardContent, Divider, MenuItem, TextField, Typography } from '@mui/material';
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
import { createItem, fetchList, fetchOne, formatCurrency, updateItem } from '../../services/resourceService';
import type { Driver, Salary } from '../../types';

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const toNumber = (value: unknown, fallback?: number) => {
  if (value === '' || value === null || value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const requiredId = (label: string) =>
  yup.number().transform((_v, o) => toNumber(o)).required(`${label} is required`);

const optionalNumber = () => yup.number().transform((_v, o) => toNumber(o, 0)).optional();

const schema = yup.object({
  driver_id: requiredId('Driver'),
  month: yup.number().transform((_v, o) => toNumber(o)).min(1).max(12).required('Month is required'),
  year: yup.number().transform((_v, o) => toNumber(o)).min(2000).required('Year is required'),
  salary_type: yup.string().required('Salary type is required'),
  base_amount: optionalNumber(),
  bonus: optionalNumber(),
  penalty: optionalNumber(),
  overtime: optionalNumber(),
  advance_deduction: optionalNumber(),
  payment_status: yup.string().required(),
  paid_date: yup.string(),
  remarks: yup.string(),
});

interface SalaryFormData {
  driver_id: number;
  month: number;
  year: number;
  salary_type: string;
  base_amount?: number;
  bonus?: number;
  penalty?: number;
  overtime?: number;
  advance_deduction?: number;
  payment_status: string;
  paid_date?: string;
  remarks?: string;
}

const calcNet = (data: Partial<SalaryFormData>) =>
  (Number(data.base_amount) || 0)
  + (Number(data.bonus) || 0)
  + (Number(data.overtime) || 0)
  - (Number(data.penalty) || 0)
  - (Number(data.advance_deduction) || 0);

export default function SalaryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id && id !== 'new');
  const [loadingData, setLoadingData] = useState(isEdit);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SalaryFormData>({
    resolver: yupResolver(schema) as Resolver<SalaryFormData>,
    defaultValues: {
      month: dayjs().month() + 1,
      year: dayjs().year(),
      salary_type: 'monthly',
      base_amount: 0,
      bonus: 0,
      penalty: 0,
      overtime: 0,
      advance_deduction: 0,
      payment_status: 'pending',
    },
  });

  const watched = useWatch({ control });
  const netAmount = useMemo(() => calcNet(watched), [watched]);

  useEffect(() => {
    fetchList<Driver>('/drivers').then(setDrivers);
  }, []);

  useEffect(() => {
    if (!isEdit || !id) return;
    setLoadingData(true);
    fetchOne<Salary>('/salaries', id).then((data) => {
      if (data) {
        reset({
          driver_id: data.driver_id,
          month: Number(data.month),
          year: Number(data.year),
          salary_type: data.salary_type,
          base_amount: Number(data.base_amount),
          bonus: Number(data.bonus ?? 0),
          penalty: Number(data.penalty ?? 0),
          overtime: Number(data.overtime ?? 0),
          advance_deduction: Number(data.advance_deduction ?? 0),
          payment_status: data.payment_status,
          paid_date: data.paid_date?.split('T')[0] ?? '',
          remarks: data.remarks ?? '',
        });
      }
      setLoadingData(false);
    });
  }, [id, isEdit, reset]);

  const onDriverChange = (driverId: number) => {
    const driver = drivers.find((d) => d.id === driverId);
    if (driver?.monthly_salary && watched.salary_type === 'monthly') {
      setValue('base_amount', Number(driver.monthly_salary));
    }
  };

  const onInvalid = (formErrors: FieldErrors<SalaryFormData>) => {
    const firstError = Object.values(formErrors).find((e) => e?.message);
    toast.error(firstError?.message ? String(firstError.message) : 'Please fill required fields');
  };

  const onSubmit = async (data: SalaryFormData) => {
    const payload: Partial<Salary> = {
      ...data,
      salary_type: data.salary_type as Salary['salary_type'],
      payment_status: data.payment_status as Salary['payment_status'],
      paid_date: data.paid_date || null,
      remarks: data.remarks || undefined,
    };
    try {
      if (isEdit && id) {
        await updateItem<Salary>('/salaries', id, payload);
        toast.success('Salary updated');
      } else {
        await createItem<Salary>('/salaries', payload);
        toast.success('Salary created');
      }
      navigate('/salary');
    } catch {
      // interceptor
    }
  };

  if (loadingData) return <LoadingSkeleton variant="form" rows={8} />;

  return (
    <Box>
      <PageHeader
        title={isEdit ? 'Edit Salary' : 'Process Salary'}
        subtitle="Driver salary with bonus, overtime, penalties and advance deductions"
        breadcrumbs={[{ label: 'Salary', to: '/salary' }, { label: isEdit ? 'Edit' : 'New' }]}
        action={
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/salary')}>
            Back
          </Button>
        }
      />

      <Card>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  {...register('driver_id')}
                  label="Driver"
                  select
                  fullWidth
                  error={!!errors.driver_id}
                  helperText={errors.driver_id?.message}
                  onChange={(e) => {
                    register('driver_id').onChange(e);
                    onDriverChange(Number(e.target.value));
                  }}
                >
                  {drivers.map((d) => (
                    <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField {...register('month')} label="Month" select fullWidth error={!!errors.month}>
                  {MONTHS.map((m) => (
                    <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField {...register('year')} label="Year" type="number" fullWidth error={!!errors.year} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField {...register('salary_type')} label="Salary Type" select fullWidth>
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="trip">Trip</MenuItem>
                  <MenuItem value="advance">Advance</MenuItem>
                  <MenuItem value="bonus">Bonus</MenuItem>
                  <MenuItem value="penalty">Penalty</MenuItem>
                  <MenuItem value="overtime">Overtime</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField {...register('payment_status')} label="Payment Status" select fullWidth>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="partial">Partial</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>
              Amounts
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField {...register('base_amount')} label="Base Amount (₹)" type="number" fullWidth />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField {...register('bonus')} label="Bonus (₹)" type="number" fullWidth />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField {...register('overtime')} label="Overtime (₹)" type="number" fullWidth />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField {...register('penalty')} label="Penalty (₹)" type="number" fullWidth />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField {...register('advance_deduction')} label="Advance Deduction (₹)" type="number" fullWidth />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField label="Net Salary" value={formatCurrency(netAmount)} fullWidth slotProps={{ input: { readOnly: true } }} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField {...register('paid_date')} label="Paid Date" type="date" fullWidth slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField {...register('remarks')} label="Remarks" fullWidth multiline rows={2} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={isSubmitting}>
                  {isEdit ? 'Update Salary' : 'Save Salary'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
