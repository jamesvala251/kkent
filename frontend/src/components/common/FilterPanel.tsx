import { Box, Button, Card, CardContent } from '@mui/material';
import Grid from '@mui/material/Grid2';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';

interface FilterPanelProps {
  children: React.ReactNode;
  onApply: () => void;
  onClear: () => void;
  loading?: boolean;
}

export function FilterField({ children, size = { xs: 12, sm: 6, md: 3 } }: { children: React.ReactNode; size?: { xs?: number; sm?: number; md?: number; lg?: number } }) {
  return <Grid size={size}>{children}</Grid>;
}

export default function FilterPanel({ children, onApply, onClear, loading }: FilterPanelProps) {
  return (
    <Card sx={{ mb: 2.5 }}>
      <CardContent sx={{ pb: '16px !important' }}>
        <Grid container spacing={2} alignItems="center">
          {children}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button variant="contained" size="small" startIcon={<FilterListIcon />} onClick={onApply} disabled={loading}>
                Apply
              </Button>
              <Button variant="outlined" size="small" startIcon={<ClearIcon />} onClick={onClear} disabled={loading}>
                Clear
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
