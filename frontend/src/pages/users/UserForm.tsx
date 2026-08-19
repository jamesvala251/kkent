import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Button, Card, CardContent, MenuItem, TextField, Typography } from '@mui/material';
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
import { useAppSelector } from '../../hooks/redux';
import type { AppUser, Role } from '../../types';

interface UserFormData {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  password_confirmation?: string;
  role: string;
  status: string;
}

export default function UserForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id && id !== 'new');
  const currentUser = useAppSelector((state) => state.auth.user);
  const isSuperAdmin = (currentUser?.roles ?? []).includes('Super Admin');
  const [loadingData, setLoadingData] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);

  const schema = yup.object({
    name: yup.string().required('Name is required').max(255),
    email: yup.string().required('Email is required').email('Invalid email'),
    phone: yup.string(),
    password: isEdit
      ? yup
          .string()
          .transform((value) => (value === '' ? undefined : value))
          .optional()
          .min(8, 'At least 8 characters')
      : yup.string().required('Password is required').min(8, 'At least 8 characters'),
    password_confirmation: yup.string().when('password', {
      is: (value: string | undefined) => Boolean(value),
      then: (inner) => inner.required('Confirm the password').oneOf([yup.ref('password')], 'Passwords must match'),
      otherwise: (inner) => inner,
    }),
    role: yup.string().required('Role is required'),
    status: yup.string().required(),
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: yupResolver(schema) as Resolver<UserFormData>,
    defaultValues: { status: 'active', role: '', password: '', password_confirmation: '' },
  });

  const selectedRole = watch('role');
  const selectedStatus = watch('status');

  useEffect(() => {
    const load = async () => {
      const roleList = await fetchList<Role>('/roles');
      setRoles(roleList.filter((role) => isSuperAdmin || role.name !== 'Super Admin'));

      if (isEdit && id) {
        const user = await fetchOne<AppUser>('/users', id);
        if (user) {
          reset({
            name: user.name ?? '',
            email: user.email ?? '',
            phone: user.phone ?? '',
            role: user.roles?.[0] ?? '',
            status: user.status ?? 'active',
            password: '',
            password_confirmation: '',
          });
        } else {
          toast.error('Failed to load user');
        }
      }

      setLoadingData(false);
    };

    load();
  }, [id, isEdit, isSuperAdmin, reset]);

  const onSubmit = async (formData: UserFormData) => {
    try {
      const payload: Record<string, unknown> = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        role: formData.role,
        status: formData.status,
      };

      if (formData.password) {
        payload.password = formData.password;
        payload.password_confirmation = formData.password_confirmation;
      }

      if (isEdit && id) {
        await updateItem<AppUser>('/users', id, payload as Partial<AppUser>);
        toast.success('User updated');
      } else {
        await createItem<AppUser>('/users', payload as Partial<AppUser>);
        toast.success('User created');
      }
      navigate('/users');
    } catch {
      toast.error(isEdit ? 'Failed to update user' : 'Failed to create user');
    }
  };

  if (loadingData) return <LoadingSkeleton variant="form" />;

  return (
    <Box>
      <PageHeader
        title={isEdit ? 'Edit User' : 'Create User'}
        breadcrumbs={[
          { label: 'Users', to: '/users' },
          { label: isEdit ? 'Edit' : 'Create' },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Login details
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Assign a role so this person only sees the modules you granted on Roles & Permissions.
            </Typography>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Name"
                  fullWidth
                  {...register('name')}
                  error={Boolean(errors.name)}
                  helperText={errors.name?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  {...register('email')}
                  error={Boolean(errors.email)}
                  helperText={errors.email?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Phone" fullWidth {...register('phone')} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  label="Role"
                  fullWidth
                  value={selectedRole}
                  {...register('role')}
                  error={Boolean(errors.role)}
                  helperText={errors.role?.message || 'Permissions come from this role'}
                >
                  <MenuItem value="" disabled>
                    Select role
                  </MenuItem>
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.name}>
                      {role.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  label="Status"
                  fullWidth
                  value={selectedStatus}
                  {...register('status')}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label={isEdit ? 'New password' : 'Password'}
                  type="password"
                  fullWidth
                  autoComplete="new-password"
                  {...register('password')}
                  error={Boolean(errors.password)}
                  helperText={errors.password?.message || (isEdit ? 'Leave blank to keep the current password' : 'Minimum 8 characters')}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Confirm password"
                  type="password"
                  fullWidth
                  autoComplete="new-password"
                  {...register('password_confirmation')}
                  error={Boolean(errors.password_confirmation)}
                  helperText={errors.password_confirmation?.message}
                />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', gap: 1.5, mt: 3 }}>
              <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/users')}>
                Back
              </Button>
              <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={isSubmitting}>
                {isEdit ? 'Update User' : 'Create User'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </form>
    </Box>
  );
}
