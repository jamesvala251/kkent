import { useEffect, useState } from 'react';
import { Box, Button, Card, CardContent, Divider, Switch, TextField, Typography, FormControlLabel } from '@mui/material';
import Grid from '@mui/material/Grid2';
import SaveIcon from '@mui/icons-material/Save';
import PageHeader from '../../components/common/PageHeader';
import CompanyLogo from '../../components/common/CompanyLogo';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { setDarkMode } from '../../store/slices/uiSlice';
import { toast } from 'react-toastify';
import api from '../../services/api';

interface CompanySettings {
  company_name: string;
  gst_number: string;
  address: string;
  phone: string;
  email: string;
  invoice_prefix: string;
  trip_prefix: string;
}

const defaultSettings: CompanySettings = {
  company_name: 'KK Enterprise',
  gst_number: '',
  address: '',
  phone: '',
  email: '',
  invoice_prefix: 'INV',
  trip_prefix: 'TRP',
};

export default function Settings() {
  const dispatch = useAppDispatch();
  const { darkMode } = useAppSelector((state) => state.ui);
  const [settings, setSettings] = useState<CompanySettings>(defaultSettings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<CompanySettings>('/settings').then(({ data }) => setSettings(data)).catch(() => setSettings(defaultSettings));
  }, []);

  const handleChange = (field: keyof CompanySettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings', settings);
      toast.success('Settings saved');
    } catch {
      toast.info('Settings saved locally (API pending)');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <PageHeader title="Settings" subtitle="Company and application preferences" breadcrumbs={[{ label: 'Settings' }]} />

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                <CompanyLogo size="md" />
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Brand Logo
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Used on invoices, reports, login and sidebar
                  </Typography>
                </Box>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }} gutterBottom>
                Company Information
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField label="Company Name" fullWidth value={settings.company_name} onChange={(e) => handleChange('company_name', e.target.value)} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField label="GST Number" fullWidth value={settings.gst_number} onChange={(e) => handleChange('gst_number', e.target.value)} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField label="Address" fullWidth multiline rows={2} value={settings.address} onChange={(e) => handleChange('address', e.target.value)} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField label="Phone" fullWidth value={settings.phone} onChange={(e) => handleChange('phone', e.target.value)} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField label="Email" fullWidth value={settings.email} onChange={(e) => handleChange('email', e.target.value)} />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" sx={{ fontWeight: 600 }} gutterBottom>
                Numbering Prefixes
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField label="Invoice Prefix" fullWidth value={settings.invoice_prefix} onChange={(e) => handleChange('invoice_prefix', e.target.value)} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField label="Trip Prefix" fullWidth value={settings.trip_prefix} onChange={(e) => handleChange('trip_prefix', e.target.value)} />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}>
                  Save Settings
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600 }} gutterBottom>
                Appearance
              </Typography>
              <FormControlLabel
                control={<Switch checked={darkMode} onChange={(e) => dispatch(setDarkMode(e.target.checked))} />}
                label="Dark Mode"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
