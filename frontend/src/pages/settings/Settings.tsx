import { useEffect, useState } from 'react';
import { Box, Button, Card, CardContent, Divider, InputAdornment, Switch, TextField, Typography, FormControlLabel } from '@mui/material';
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
  diesel_default_price: number | string;
}

const defaultSettings: CompanySettings = {
  company_name: 'KK Enterprise',
  gst_number: '',
  address: '',
  phone: '',
  email: '',
  invoice_prefix: 'INV',
  trip_prefix: 'TRP',
  diesel_default_price: 97,
};

export default function Settings() {
  const dispatch = useAppDispatch();
  const { darkMode } = useAppSelector((state) => state.ui);
  const [settings, setSettings] = useState<CompanySettings>(defaultSettings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<CompanySettings>('/settings').then(({ data }) => {
      setSettings({
        ...defaultSettings,
        ...data,
        diesel_default_price: data.diesel_default_price != null ? Number(data.diesel_default_price) : 97,
      });
    }).catch(() => setSettings(defaultSettings));
  }, []);

  const handleChange = (field: keyof CompanySettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...settings,
        diesel_default_price: Number(settings.diesel_default_price) || 0,
      };
      const { data } = await api.put<CompanySettings>('/settings', payload);
      setSettings({
        ...defaultSettings,
        ...data,
        diesel_default_price: data.diesel_default_price != null ? Number(data.diesel_default_price) : payload.diesel_default_price,
      });
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
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

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" sx={{ fontWeight: 600 }} gutterBottom>
                Diesel Defaults
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Used as the default rate on new trips and diesel issue/purchase forms.
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Default Diesel Price (₹/L)"
                    type="number"
                    fullWidth
                    value={settings.diesel_default_price}
                    onChange={(e) => handleChange('diesel_default_price', e.target.value)}
                    inputProps={{ min: 0, step: 0.01 }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                    helperText="Example: 97"
                  />
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
