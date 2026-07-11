import { Box, Card, CardContent, Skeleton, Stack } from '@mui/material';

interface LoadingSkeletonProps {
  variant?: 'table' | 'cards' | 'form' | 'page';
  rows?: number;
}

export default function LoadingSkeleton({ variant = 'page', rows = 5 }: LoadingSkeletonProps) {
  if (variant === 'cards') {
    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent>
              <Skeleton variant="text" width="60%" height={28} />
              <Skeleton variant="text" width="40%" height={40} sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  }

  if (variant === 'form') {
    return (
      <Stack spacing={2}>
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={40} />
        ))}
        <Skeleton variant="rounded" height={120} />
      </Stack>
    );
  }

  if (variant === 'table') {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="rounded" height={40} sx={{ mb: 2 }} />
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} variant="text" height={48} sx={{ mb: 0.5 }} />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Stack spacing={2}>
      <Skeleton variant="text" width={240} height={40} />
      <Skeleton variant="text" width={360} height={24} />
      <LoadingSkeleton variant="cards" />
      <LoadingSkeleton variant="table" rows={rows} />
    </Stack>
  );
}
