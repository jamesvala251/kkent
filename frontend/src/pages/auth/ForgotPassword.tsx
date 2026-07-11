import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, InputAdornment, Link, TextField } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import AuthLayout from '../../layouts/AuthLayout';
import { authService } from '../../services/authService';

const schema = yup.object({
  email: yup.string().email('Enter a valid email').required('Email is required'),
});

type ForgotForm = yup.InferType<typeof schema>;

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({ resolver: yupResolver(schema) });

  const onSubmit = async (data: ForgotForm) => {
    try {
      await authService.forgotPassword(data);
      setSent(true);
      toast.success('Reset link sent to your email');
    } catch {
      setSent(true);
      toast.info('If the email exists, a reset link has been sent');
    }
  };

  return (
    <AuthLayout title="Forgot Password" subtitle="We'll send you a reset link">
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        {sent && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Check your email for password reset instructions.
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

        <Button type="submit" variant="contained" fullWidth size="large" disabled={isSubmitting} sx={{ mt: 3, py: 1.25 }}>
          {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Link'}
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
