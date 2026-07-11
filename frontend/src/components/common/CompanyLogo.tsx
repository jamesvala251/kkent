import { Box } from '@mui/material';
import logoSrc from '../../assets/logo.png';

export type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';

const sizeMap: Record<LogoSize, { height: number; maxWidth?: number }> = {
  xs: { height: 28, maxWidth: 100 },
  sm: { height: 36, maxWidth: 130 },
  md: { height: 44, maxWidth: 160 },
  lg: { height: 64, maxWidth: 220 },
  xl: { height: 88, maxWidth: 300 },
  hero: { height: 130 },
};

interface CompanyLogoProps {
  size?: LogoSize;
  alt?: string;
}

export default function CompanyLogo({ size = 'md', alt = 'KK Enterprise' }: CompanyLogoProps) {
  const dimensions = sizeMap[size];

  return (
    <Box
      component="img"
      src={logoSrc}
      alt={alt}
      sx={{
        height: dimensions.height,
        ...(dimensions.maxWidth != null ? { maxWidth: dimensions.maxWidth } : {}),
        width: 'auto',
        objectFit: 'contain',
        display: 'block',
      }}
    />
  );
}

export { logoSrc };
