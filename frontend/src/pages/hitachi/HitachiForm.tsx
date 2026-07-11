import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Button, Card, CardContent, Divider, MenuItem, TextField, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useForm, type FieldErrors, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import PageHeader from '../../components/common/PageHeader';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import { createItem, fetchOne, updateItem } from '../../services/resourceService';
import type { HitachiMachine } from '../../types';

const toNumber = (value: unknown, fallback?: number) => {
  if (value === '' || value === null || value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const schema = yup.object({
  machine_number: yup.string().required('Machine number is required'),
  registration_number: yup.string(),
  model: yup.string(),
  owner: yup.string(),
  engine_number: yup.string(),
  chassis_number: yup.string(),
  purchase_date: yup.string(),
  current_hours: yup.number().transform((_v, o) => toNumber(o, 0)).optional(),
  current_km: yup.number().transform((_v, o) => toNumber(o, 0)).optional(),
  fuel_type: yup.string().required(),
  bucket_capacity: yup.string(),
  hourly_rate: yup.number().transform((_v, o) => toNumber(o, 0)).optional(),
  daily_rate: yup.number().transform((_v, o) => toNumber(o, 0)).optional(),
  monthly_rate: yup.number().transform((_v, o) => toNumber(o, 0)).optional(),
  status: yup.string().required(),
});

interface HitachiFormData {
  machine_number: string;
  registration_number?: string;
  model?: string;
  owner?: string;
  engine_number?: string;
  chassis_number?: string;
  purchase_date?: string;
  current_hours?: number;
  current_km?: number;
  fuel_type: string;
  bucket_capacity?: string;
  hourly_rate?: number;
  daily_rate?: number;
  monthly_rate?: number;
  status: string;
}

const toDateInput = (value?: string) => (value ? value.split('T')[0] : '');

export default function HitachiForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id && id !== 'new');
  const [loadingData, setLoadingData] = useState(isEdit);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<HitachiFormData>({
    resolver: yupResolver(schema) as Resolver<HitachiFormData>,
    defaultValues: {
      status: 'active',
      fuel_type: 'diesel',
      current_hours: 0,
      current_km: 0,
      hourly_rate: 0,
      daily_rate: 0,
      monthly_rate: 0,
    },
  });

  useEffect(() => {
    if (!isEdit || !id) return;
    setLoadingData(true);
    fetchOne<HitachiMachine>('/hitachi-machines', id).then((data) => {
      if (data) {
        reset({
          machine_number: data.machine_number ?? '',
          registration_number: data.registration_number ?? '',
          model: data.model ?? '',
          owner: data.owner ?? '',
          engine_number: data.engine_number ?? '',
          chassis_number: data.chassis_number ?? '',
          purchase_date: toDateInput(data.purchase_date),
          current_hours: data.current_hours != null ? Number(data.current_hours) : 0,
          current_km: data.current_km != null ? Number(data.current_km) : 0,
          fuel_type: data.fuel_type ?? 'diesel',
          bucket_capacity: data.bucket_capacity ?? '',
          hourly_rate: data.hourly_rate != null ? Number(data.hourly_rate) : 0,
          daily_rate: data.daily_rate != null ? Number(data.daily_rate) : 0,
          monthly_rate: data.monthly_rate != null ? Number(data.monthly_rate) : 0,
          status: data.status ?? 'active',
        });
      }
      setLoadingData(false);
    });
  }, [id, isEdit, reset]);

  const onInvalid = (formErrors: FieldErrors<HitachiFormData>) => {
    const firstError = Object.values(formErrors).find((e) => e?.message);
    toast.error(firstError?.message ? String(firstError.message) : 'Please fill required fields');
  };

  const onSubmit = async (data: HitachiFormData) => {
    try {
      if (isEdit && id) {
        await updateItem<HitachiMachine>('/hitachi-machines', id, data);
        toast.success('Hitachi machine updated');
      } else {
        await createItem<HitachiMachine>('/hitachi-machines', data);
        toast.success('Hitachi machine created');
      }
      navigate('/hitachi');
    } catch {
      // interceptor handles errors
    }
  };

  if (loadingData) return <LoadingSkeleton variant="form" rows={10} />;

  return (
    <Box>
      <PageHeader
        title={isEdit ? 'Edit Hitachi Machine' : 'Add Hitachi Machine'}
        subtitle="Configure hourly, daily and monthly rental rates"
        breadcrumbs={[{ label: 'Hitachi', to: '/hitachi' }, { label: isEdit ? 'Edit' : 'New' }]}
        action={
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/hitachi')}>
            Back
          </Button>
        }
      />

      <Card>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>
              Machine Details
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField {...register('machine_number')} label="Machine Number" fullWidth error={!!errors.machine_number} helperText={errors.machine_number?.message} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField {...register('registration_number')} label="Registration Number" fullWidth />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField {...register('model')} label="Model" fullWidth />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField {...register('owner')} label="Owner" fullWidth />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField {...register('bucket_capacity')} label="Bucket Capacity" fullWidth />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField {...register('status')} label="Status" select fullWidth>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                  <MenuItem value="breakdown">Breakdown</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField {...register('purchase_date')} label="Purchase Date" type="date" fullWidth slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField {...register('current_hours')} label="Current Hours" type="number" fullWidth />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField {...register('current_km')} label="Current KM" type="number" fullWidth />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField {...register('fuel_type')} label="Fuel Type" select fullWidth>
                  <MenuItem value="diesel">Diesel</MenuItem>
                  <MenuItem value="petrol">Petrol</MenuItem>
                  <MenuItem value="cng">CNG</MenuItem>
                  <MenuItem value="electric">Electric</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>
              Rental Rates
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField {...register('hourly_rate')} label="Hourly Rate (₹)" type="number" fullWidth />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField {...register('daily_rate')} label="Daily Rate (₹)" type="number" fullWidth />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField {...register('monthly_rate')} label="Monthly Rate (₹)" type="number" fullWidth />
              </Grid>
            </Grid>

            <Button type="submit" variant="contained" startIcon={<SaveIcon />} sx={{ mt: 3 }} disabled={isSubmitting}>
              {isEdit ? 'Update Machine' : 'Save Machine'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
