import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, InputAdornment, Link, TextField } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import AuthLayout from '../../layouts/AuthLayout';
import { authService } from '../../services/authService';

const schema = yup.object({
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup.string().min(8, 'Minimum 8 characters').required('Password is required'),
  password_confirmation: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirm your password'),
});

type ResetForm = yup.InferType<typeof schema>;

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({
    resolver: yupResolver(schema),
    defaultValues: { email: searchParams.get('email') || '' },
  });

  const onSubmit = async (data: ResetForm) => {
    try {
      await authService.resetPassword({ ...data, token });
      toast.success('Password reset successfully');
      navigate('/auth/login');
    } catch {
      toast.error('Failed to reset password. The link may have expired.');
    }
  };

  return (
    <AuthLayout title="Reset Password" subtitle="Create a new password for your account">
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        {!token && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Reset token is missing. Please use the link from your email.
          </Alert>
        )}

        <TextField
          {...register('email')}
          label="Email Address"
          type="email"
          fullWidth
          margin="normal"
          error={!!errors.email}
          helperText={errors.email?.message}
        />

        <TextField
          {...register('password')}
          label="New Password"
          type="password"
          fullWidth
          margin="normal"
          error={!!errors.password}
          helperText={errors.password?.message}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon color="action" fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />

        <TextField
          {...register('password_confirmation')}
          label="Confirm Password"
          type="password"
          fullWidth
          margin="normal"
          error={!!errors.password_confirmation}
          helperText={errors.password_confirmation?.message}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon color="action" fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />

        <Button type="submit" variant="contained" fullWidth size="large" disabled={isSubmitting || !token} sx={{ mt: 3, py: 1.25 }}>
          {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Reset Password'}
        </Button>

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Link component={RouterLink} to="/auth/login" variant="body2" underline="hover" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
            <ArrowBackIcon fontSize="small" /> Back to Sign In
          </Link>
        </Box>
      </Box>
    </AuthLayout>
  );
}
