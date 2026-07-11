import { Box, Container, Paper, Typography } from '@mui/material';
import CompanyLogo from '../components/common/CompanyLogo';

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background: 'linear-gradient(135deg, #0d1642 0%, #1a237e 50%, #283593 100%)',
      }}
    >
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          p: 6,
        }}
      >
        <Box sx={{ mb: 3 }}>
          <CompanyLogo size="xl" />
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          KK Enterprise
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.85, maxWidth: 400, textAlign: 'center', fontWeight: 400 }}>
          Complete transport & logistics ERP for fleet, trips, billing and operations management.
        </Typography>
      </Box>

      <Box
        sx={{
          flex: { xs: 1, md: 0.55 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 2, sm: 4 },
        }}
      >
        <Container maxWidth="sm">
          <Paper elevation={8} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 4 }}>
            {title && (
              <Box sx={{ mb: 3, textAlign: 'center' }}>
                <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'center', mb: 2 }}>
                  <CompanyLogo size="md" />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700 }} color="primary">
                  {title}
                </Typography>
                {subtitle && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {subtitle}
                  </Typography>
                )}
              </Box>
            )}
            {children}
          </Paper>
        </Container>
      </Box>
    </Box>
  );
}
