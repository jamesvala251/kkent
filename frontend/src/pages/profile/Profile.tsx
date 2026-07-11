import { useState } from 'react';
import { Avatar, Box, Button, Card, CardContent, Divider, TextField } from '@mui/material';
import Grid from '@mui/material/Grid2';
import SaveIcon from '@mui/icons-material/Save';
import LockIcon from '@mui/icons-material/Lock';
import PageHeader from '../../components/common/PageHeader';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { updateUser } from '../../store/slices/authSlice';
import { authService } from '../../services/authService';
import { toast } from 'react-toastify';

export default function Profile() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updated = await authService.updateProfile({ name, email, phone });
      dispatch(updateUser(updated));
      toast.success('Profile updated');
    } catch {
      dispatch(updateUser({ name, email, phone }));
      toast.info('Profile updated locally (API pending)');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      await authService.changePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      toast.success('Password changed');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      toast.error('Failed to change password');
    }
  };

  return (
    <Box>
      <PageHeader title="Profile" subtitle="Manage your account settings" breadcrumbs={[{ label: 'Profile' }]} />

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ mb: 2.5 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ width: 72, height: 72, bgcolor: 'primary.main', fontSize: 28 }}>
                  {name?.charAt(0) || 'U'}
                </Avatar>
                <Box>
                  <PageHeader title={name || 'User'} subtitle={user?.role || 'Administrator'} />
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField label="Full Name" fullWidth value={name} onChange={(e) => setName(e.target.value)} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField label="Email" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField label="Phone" fullWidth value={phone} onChange={(e) => setPhone(e.target.value)} />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveProfile} disabled={saving}>
                  Save Profile
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <PageHeader title="Change Password" subtitle="Update your login credentials" />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <TextField label="Current Password" type="password" fullWidth value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField label="New Password" type="password" fullWidth value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField label="Confirm Password" type="password" fullWidth value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </Grid>
              </Grid>
              <Divider sx={{ my: 2 }} />
              <Button variant="outlined" startIcon={<LockIcon />} onClick={handleChangePassword}>
                Update Password
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
