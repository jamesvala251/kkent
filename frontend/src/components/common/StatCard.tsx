import { Avatar, Box, Card, CardContent, Typography, alpha, useTheme } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  color?: string;
}

export default function StatCard({ title, value, icon, trend, trendLabel, color }: StatCardProps) {
  const theme = useTheme();
  const accent = color || theme.palette.primary.main;
  const isPositive = trend !== undefined && trend >= 0;

  return (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
      <Box
        sx={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 100,
          height: 100,
          borderRadius: '50%',
          bgcolor: alpha(accent, 0.08),
        }}
      />
      <CardContent sx={{ position: 'relative' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>
              {value}
            </Typography>
          </Box>
          {icon && (
            <Avatar sx={{ bgcolor: alpha(accent, 0.12), color: accent, width: 48, height: 48 }}>
              {icon}
            </Avatar>
          )}
        </Box>
        {trend !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {isPositive ? (
              <TrendingUpIcon sx={{ fontSize: 18, color: 'success.main' }} />
            ) : (
              <TrendingDownIcon sx={{ fontSize: 18, color: 'error.main' }} />
            )}
            <Typography variant="caption" color={isPositive ? 'success.main' : 'error.main'} sx={{ fontWeight: 600 }}>
              {isPositive ? '+' : ''}
              {trend}%
            </Typography>
            {trendLabel && (
              <Typography variant="caption" color="text.secondary">
                {trendLabel}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
