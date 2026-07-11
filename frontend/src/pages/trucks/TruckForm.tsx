import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Button, Card, CardContent, Divider, MenuItem, TextField, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useForm, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import PageHeader from '../../components/common/PageHeader';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import { createItem, fetchOne, updateItem } from '../../services/resourceService';
import type { Truck } from '../../types';

const schema = yup.object({
  truck_number: yup.string().required('Truck number is required'),
  rc_number: yup.string(),
  insurance_expiry: yup.string(),
  fitness_expiry: yup.string(),
  permit_expiry: yup.string(),
  puc_expiry: yup.string(),
  tax_expiry: yup.string(),
  model: yup.string(),
  brand: yup.string(),
  year: yup.number().transform((v) => (Number.isNaN(v) ? undefined : v)).optional(),
  capacity: yup.string(),
  owner: yup.string(),
  fuel_type: yup.string().required('Fuel type is required'),
  gps_number: yup.string(),
  current_km: yup.number().transform((v) => (Number.isNaN(v) ? 0 : v)).optional(),
  status: yup.string().required(),
});

interface TruckFormData {
  truck_number: string;
  rc_number?: string;
  insurance_expiry?: string;
  fitness_expiry?: string;
  permit_expiry?: string;
  puc_expiry?: string;
  tax_expiry?: string;
  model?: string;
  brand?: string;
  year?: number;
  capacity?: string;
  owner?: string;
  fuel_type: string;
  gps_number?: string;
  current_km?: number;
  status: string;
}

const toDateInput = (value?: string) => (value ? value.split('T')[0] : '');

export default function TruckForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id && id !== 'new');
  const [loadingData, setLoadingData] = useState(isEdit);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TruckFormData>({
    resolver: yupResolver(schema) as Resolver<TruckFormData>,
    defaultValues: {
      status: 'active',
      fuel_type: 'diesel',
      current_km: 0,
    },
  });

  useEffect(() => {
    if (isEdit && id) {
      setLoadingData(true);
      fetchOne<Truck>('/trucks', id).then((data) => {
        if (data) {
          reset({
            truck_number: data.truck_number ?? '',
            rc_number: data.rc_number ?? '',
            insurance_expiry: toDateInput(data.insurance_expiry),
            fitness_expiry: toDateInput(data.fitness_expiry),
            permit_expiry: toDateInput(data.permit_expiry),
            puc_expiry: toDateInput(data.puc_expiry),
            tax_expiry: toDateInput(data.tax_expiry),
            model: data.model ?? '',
            brand: data.brand ?? '',
            year: data.year != null ? Number(data.year) : undefined,
            capacity: data.capacity ?? '',
            owner: data.owner ?? '',
            fuel_type: data.fuel_type ?? 'diesel',
            gps_number: data.gps_number ?? '',
            current_km: data.current_km != null ? Number(data.current_km) : 0,
            status: data.status ?? 'active',
          });
        }
        setLoadingData(false);
      });
    }
  }, [id, isEdit, reset]);

  const onSubmit = async (data: TruckFormData) => {
    try {
      if (isEdit && id) {
        await updateItem<Truck>('/trucks', id, data);
        toast.success('Truck updated');
      } else {
        await createItem<Truck>('/trucks', data);
        toast.success('Truck created');
      }
      navigate('/trucks');
    } catch {
      toast.error('Failed to save truck');
    }
  };

  if (loadingData) return <LoadingSkeleton variant="form" rows={10} />;

  return (
    <Box>
      <PageHeader
        title={isEdit ? 'Edit Truck' : 'New Truck'}
        breadcrumbs={[{ label: 'Trucks', to: '/trucks' }, { label: isEdit ? 'Edit' : 'New' }]}
        action={
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/trucks')}>
            Back
          </Button>
        }
      />

      <Card>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Vehicle Details
            </Typography>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  {...register('truck_number')}
                  label="Truck Number"
                  fullWidth
                  margin="normal"
                  error={!!errors.truck_number}
                  helperText={errors.truck_number?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField {...register('rc_number')} label="RC Number" fullWidth margin="normal" />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField {...register('brand')} label="Brand" fullWidth margin="normal" />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField {...register('model')} label="Model" fullWidth margin="normal" />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField {...register('year')} label="Year" type="number" fullWidth margin="normal" />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField {...register('capacity')} label="Capacity" fullWidth margin="normal" />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  {...register('fuel_type')}
                  label="Fuel Type"
                  select
                  fullWidth
                  margin="normal"
                  slotProps={{ inputLabel: { shrink: true } }}
                >
                  <MenuItem value="diesel">Diesel</MenuItem>
                  <MenuItem value="petrol">Petrol</MenuItem>
                  <MenuItem value="cng">CNG</MenuItem>
                  <MenuItem value="electric">Electric</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField {...register('current_km')} label="Current KM" type="number" fullWidth margin="normal" />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField {...register('owner')} label="Owner" fullWidth margin="normal" />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField {...register('gps_number')} label="GPS Number" fullWidth margin="normal" />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  {...register('status')}
                  label="Status"
                  select
                  fullWidth
                  margin="normal"
                  slotProps={{ inputLabel: { shrink: true } }}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                  <MenuItem value="breakdown">Breakdown</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Document Expiry Dates
            </Typography>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  {...register('insurance_expiry')}
                  label="Insurance Expiry"
                  type="date"
                  fullWidth
                  margin="normal"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  {...register('fitness_expiry')}
                  label="Fitness Expiry"
                  type="date"
                  fullWidth
                  margin="normal"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  {...register('permit_expiry')}
                  label="Permit Expiry"
                  type="date"
                  fullWidth
                  margin="normal"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  {...register('puc_expiry')}
                  label="PUC Expiry"
                  type="date"
                  fullWidth
                  margin="normal"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  {...register('tax_expiry')}
                  label="Tax Expiry"
                  type="date"
                  fullWidth
                  margin="normal"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={isSubmitting}>
                {isEdit ? 'Update Truck' : 'Create Truck'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
