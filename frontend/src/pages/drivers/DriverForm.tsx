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
import { createItem, fetchList, fetchOne, updateItem } from '../../services/resourceService';
import type { Driver, Truck } from '../../types';

const schema = yup.object({
  name: yup.string().required('Driver name is required'),
  mobile: yup.string().required('Mobile is required'),
  address: yup.string(),
  aadhaar: yup.string(),
  license_number: yup.string(),
  license_expiry: yup.string(),
  joining_date: yup.string(),
  salary_type: yup.string().required('Salary type is required'),
  monthly_salary: yup.number().transform((v) => (Number.isNaN(v) ? 0 : v)).optional(),
  per_trip_salary: yup.number().transform((v) => (Number.isNaN(v) ? 0 : v)).optional(),
  bank_name: yup.string(),
  bank_account: yup.string(),
  bank_ifsc: yup.string(),
  emergency_contact: yup.string(),
  assigned_truck_id: yup
    .number()
    .transform((v, orig) => (orig === '' || orig === null || Number.isNaN(v) ? undefined : v))
    .optional(),
  status: yup.string().required(),
});

interface DriverFormData {
  name: string;
  mobile: string;
  address?: string;
  aadhaar?: string;
  license_number?: string;
  license_expiry?: string;
  joining_date?: string;
  salary_type: string;
  monthly_salary?: number;
  per_trip_salary?: number;
  bank_name?: string;
  bank_account?: string;
  bank_ifsc?: string;
  emergency_contact?: string;
  assigned_truck_id?: number;
  status: string;
}

const toDateInput = (value?: string) => (value ? value.split('T')[0] : '');

export default function DriverForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id && id !== 'new');
  const [loadingData, setLoadingData] = useState(isEdit);
  const [trucks, setTrucks] = useState<Truck[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DriverFormData>({
    resolver: yupResolver(schema) as Resolver<DriverFormData>,
    defaultValues: {
      status: 'active',
      salary_type: 'monthly',
      monthly_salary: 0,
      per_trip_salary: 0,
    },
  });

  const salaryType = watch('salary_type');

  useEffect(() => {
    fetchList<Truck>('/trucks').then(setTrucks);
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      setLoadingData(true);
      fetchOne<Driver>('/drivers', id).then((data) => {
        if (data) {
          reset({
            name: data.name ?? '',
            mobile: data.mobile ?? '',
            address: data.address ?? '',
            aadhaar: data.aadhaar ?? '',
            license_number: data.license_number ?? '',
            license_expiry: toDateInput(data.license_expiry),
            joining_date: toDateInput(data.joining_date),
            salary_type: data.salary_type ?? 'monthly',
            monthly_salary: data.monthly_salary != null ? Number(data.monthly_salary) : 0,
            per_trip_salary: data.per_trip_salary != null ? Number(data.per_trip_salary) : 0,
            bank_name: data.bank_name ?? '',
            bank_account: data.bank_account ?? '',
            bank_ifsc: data.bank_ifsc ?? '',
            emergency_contact: data.emergency_contact ?? '',
            assigned_truck_id: data.assigned_truck_id ?? undefined,
            status: data.status ?? 'active',
          });
        }
        setLoadingData(false);
      });
    }
  }, [id, isEdit, reset]);

  const onSubmit = async (data: DriverFormData) => {
    const payload = {
      ...data,
      assigned_truck_id: data.assigned_truck_id || null,
    };

    try {
      if (isEdit && id) {
        await updateItem<Driver>('/drivers', id, payload);
        toast.success('Driver updated');
      } else {
        await createItem<Driver>('/drivers', payload);
        toast.success('Driver created');
      }
      navigate('/drivers');
    } catch {
      toast.error('Failed to save driver');
    }
  };

  if (loadingData) return <LoadingSkeleton variant="form" rows={10} />;

  return (
    <Box>
      <PageHeader
        title={isEdit ? 'Edit Driver' : 'New Driver'}
        breadcrumbs={[{ label: 'Drivers', to: '/drivers' }, { label: isEdit ? 'Edit' : 'New' }]}
        action={
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/drivers')}>
            Back
          </Button>
        }
      />

      <Card>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Personal Details
            </Typography>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  {...register('name')}
                  label="Driver Name"
                  fullWidth
                  margin="normal"
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  {...register('mobile')}
                  label="Mobile"
                  fullWidth
                  margin="normal"
                  error={!!errors.mobile}
                  helperText={errors.mobile?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField {...register('aadhaar')} label="Aadhaar Number" fullWidth margin="normal" />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField {...register('emergency_contact')} label="Emergency Contact" fullWidth margin="normal" />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField {...register('address')} label="Address" fullWidth margin="normal" multiline rows={2} />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              License Details
            </Typography>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField {...register('license_number')} label="License Number" fullWidth margin="normal" />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  {...register('license_expiry')}
                  label="License Expiry"
                  type="date"
                  fullWidth
                  margin="normal"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  {...register('joining_date')}
                  label="Joining Date"
                  type="date"
                  fullWidth
                  margin="normal"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  {...register('assigned_truck_id', {
                    setValueAs: (v) => (v === '' || v == null ? undefined : Number(v)),
                  })}
                  label="Assigned Truck"
                  select
                  fullWidth
                  margin="normal"
                  slotProps={{ inputLabel: { shrink: true } }}
                >
                  <MenuItem value="">None</MenuItem>
                  {trucks.map((truck) => (
                    <MenuItem key={truck.id} value={truck.id}>
                      {truck.truck_number}{truck.model ? ` — ${truck.model}` : ''}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Salary Details
            </Typography>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  {...register('salary_type')}
                  label="Salary Type"
                  select
                  fullWidth
                  margin="normal"
                  slotProps={{ inputLabel: { shrink: true } }}
                >
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="per_trip">Per Trip</MenuItem>
                  <MenuItem value="both">Both</MenuItem>
                </TextField>
              </Grid>
              {(salaryType === 'monthly' || salaryType === 'both') && (
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField {...register('monthly_salary')} label="Monthly Salary" type="number" fullWidth margin="normal" />
                </Grid>
              )}
              {(salaryType === 'per_trip' || salaryType === 'both') && (
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField {...register('per_trip_salary')} label="Per Trip Salary" type="number" fullWidth margin="normal" />
                </Grid>
              )}
            </Grid>

            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Bank Details
            </Typography>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField {...register('bank_name')} label="Bank Name" fullWidth margin="normal" />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField {...register('bank_account')} label="Account Number" fullWidth margin="normal" />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField {...register('bank_ifsc')} label="IFSC Code" fullWidth margin="normal" />
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
                  <MenuItem value="on_leave">On Leave</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={isSubmitting}>
                {isEdit ? 'Update Driver' : 'Create Driver'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
