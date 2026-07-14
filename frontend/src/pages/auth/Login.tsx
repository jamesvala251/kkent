import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, InputAdornment, Link, TextField } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import HomeIcon from '@mui/icons-material/Home';
import LockIcon from '@mui/icons-material/Lock';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import AuthLayout from '../../layouts/AuthLayout';
import { useAppDispatch } from '../../hooks/redux';
import { loginSuccess, setLoading } from '../../store/slices/authSlice';
import { authService } from '../../services/authService';

const schema = yup.object({
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup.string().min(6, 'Minimum 6 characters').required('Password is required'),
});

type LoginForm = yup.InferType<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: yupResolver(schema) });

  const onSubmit = async (data: LoginForm) => {
    setError('');
    dispatch(setLoading(true));
    try {
      const response = await authService.login(data);
      dispatch(loginSuccess(response));
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      const message =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(message || 'Invalid credentials. Please try again.');
      dispatch(setLoading(false));
    }
  };

  return (
    <AuthLayout title="Sign In" subtitle="Access your KK Enterprise dashboard">
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
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
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon color="action" fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />

        <TextField
          {...register('password')}
          label="Password"
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

        <Box sx={{ textAlign: 'right', mt: 1 }}>
          <Link component={RouterLink} to="/auth/forgot-password" variant="body2" underline="hover">
            Forgot password?
          </Link>
        </Box>

        <Button type="submit" variant="contained" fullWidth size="large" disabled={isSubmitting} sx={{ mt: 3, py: 1.25 }}>
          {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
        </Button>

        <Button
          component={RouterLink}
          to="/"
          variant="outlined"
          fullWidth
          size="large"
          startIcon={<HomeIcon />}
          sx={{ mt: 1.5, py: 1.1 }}
        >
          Back to home page
        </Button>
      </Box>
    </AuthLayout>
  );
}
