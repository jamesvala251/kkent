import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Button, Card, CardContent, MenuItem, TextField } from '@mui/material';
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
import type { Customer } from '../../types';

const schema = yup.object({
  name: yup.string().required('Name is required'),
  company_name: yup.string(),
  gst_number: yup.string(),
  contact_person: yup.string(),
  mobile: yup.string().required('Mobile is required'),
  alternate_mobile: yup.string(),
  email: yup.string().email('Invalid email'),
  address: yup.string(),
  city: yup.string(),
  state: yup.string(),
  pincode: yup.string(),
  credit_limit: yup.number().transform((v) => (Number.isNaN(v) ? undefined : v)).optional(),
  payment_terms: yup.string(),
  status: yup.string().required(),
});

interface CustomerFormData {
  name: string;
  company_name?: string;
  gst_number?: string;
  contact_person?: string;
  mobile: string;
  alternate_mobile?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  credit_limit?: number;
  payment_terms?: string;
  status: string;
}

export default function CustomerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id && id !== 'new');
  const [loadingData, setLoadingData] = useState(isEdit);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormData>({
    resolver: yupResolver(schema) as Resolver<CustomerFormData>,
    defaultValues: { status: 'active', credit_limit: 0 },
  });

  useEffect(() => {
    if (isEdit && id) {
      setLoadingData(true);
      fetchOne<Customer>('/customers', id).then((data) => {
        if (data) {
          reset({
            name: data.name ?? '',
            company_name: data.company_name ?? '',
            gst_number: data.gst_number ?? '',
            contact_person: data.contact_person ?? '',
            mobile: data.mobile ?? '',
            alternate_mobile: data.alternate_mobile ?? '',
            email: data.email ?? '',
            address: data.address ?? '',
            city: data.city ?? '',
            state: data.state ?? '',
            pincode: data.pincode ?? '',
            credit_limit: data.credit_limit != null ? Number(data.credit_limit) : 0,
            payment_terms: data.payment_terms ?? '',
            status: data.status ?? 'active',
          });
        }
        setLoadingData(false);
      });
    }
  }, [id, isEdit, reset]);

  const onSubmit = async (data: CustomerFormData) => {
    try {
      if (isEdit && id) {
        await updateItem<Customer>('/customers', id, data);
        toast.success('Customer updated');
      } else {
        await createItem<Customer>('/customers', data);
        toast.success('Customer created');
      }
      navigate('/customers');
    } catch {
      toast.error('Failed to save customer');
    }
  };

  if (loadingData) return <LoadingSkeleton variant="form" rows={8} />;

  return (
    <Box>
      <PageHeader
        title={isEdit ? 'Edit Customer' : 'New Customer'}
        breadcrumbs={[{ label: 'Customers', to: '/customers' }, { label: isEdit ? 'Edit' : 'New' }]}
        action={
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/customers')}>
            Back
          </Button>
        }
      />

      <Card>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField {...register('name')} label="Customer Name" fullWidth margin="normal" error={!!errors.name} helperText={errors.name?.message} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField {...register('company_name')} label="Company Name" fullWidth margin="normal" />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField {...register('gst_number')} label="GST Number" fullWidth margin="normal" />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField {...register('contact_person')} label="Contact Person" fullWidth margin="normal" />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField {...register('mobile')} label="Mobile" fullWidth margin="normal" error={!!errors.mobile} helperText={errors.mobile?.message} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField {...register('alternate_mobile')} label="Alternate Mobile" fullWidth margin="normal" />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField {...register('email')} label="Email" fullWidth margin="normal" error={!!errors.email} helperText={errors.email?.message} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField {...register('credit_limit')} label="Credit Limit" type="number" fullWidth margin="normal" />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField {...register('address')} label="Address" fullWidth margin="normal" multiline rows={2} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField {...register('city')} label="City" fullWidth margin="normal" />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField {...register('state')} label="State" fullWidth margin="normal" />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField {...register('pincode')} label="Pincode" fullWidth margin="normal" />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField {...register('payment_terms')} label="Payment Terms" fullWidth margin="normal" />
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
                </TextField>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={isSubmitting}>
                {isEdit ? 'Update Customer' : 'Create Customer'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
