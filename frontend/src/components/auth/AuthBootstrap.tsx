import { useEffect, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { loginSuccess, logout } from '../../store/slices/authSlice';
import { authService } from '../../services/authService';

export default function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const [ready, setReady] = useState(() => !localStorage.getItem('token'));

  useEffect(() => {
    if (!token) {
      setReady(true);
      return;
    }

    let cancelled = false;

    authService
      .me()
      .then((user) => {
        if (!cancelled) {
          dispatch(loginSuccess({ user, token }));
        }
      })
      .catch(() => {
        if (!cancelled) {
          dispatch(logout());
        }
      })
      .finally(() => {
        if (!cancelled) {
          setReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [dispatch, token]);

  if (!ready) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return children;
}
