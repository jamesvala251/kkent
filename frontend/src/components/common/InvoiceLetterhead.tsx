import { Box, Typography } from '@mui/material';
import CompanyLogo from './CompanyLogo';

interface InvoiceLetterheadProps {
  companyName?: string;
  address?: string;
  phone?: string;
  email?: string;
  gstNumber?: string;
}

export default function InvoiceLetterhead({
  companyName = 'KK Enterprise',
  address,
  phone,
  email,
  gstNumber,
}: InvoiceLetterheadProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        pb: 2,
        mb: 3,
        borderBottom: 2,
        borderColor: 'primary.main',
        flexWrap: { xs: 'wrap', sm: 'nowrap' },
      }}
    >
      <CompanyLogo size="lg" />
      <Box sx={{ textAlign: { xs: 'left', sm: 'right' }, flex: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>
          {companyName}
        </Typography>
        {address && (
          <Typography variant="body2" color="text.secondary">
            {address}
          </Typography>
        )}
        {phone && (
          <Typography variant="body2" color="text.secondary">
            Phone: {phone}
          </Typography>
        )}
        {email && (
          <Typography variant="body2" color="text.secondary">
            Email: {email}
          </Typography>
        )}
        {gstNumber && (
          <Typography variant="body2" color="text.secondary">
            GST: {gstNumber}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
