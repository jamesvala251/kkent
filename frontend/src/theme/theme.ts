import { createTheme, type ThemeOptions } from '@mui/material/styles';

const primaryDarkBlue = '#1a237e';
const primaryLight = '#3949ab';
const sidebarBg = '#0d1642';

const getDesignTokens = (mode: 'light' | 'dark'): ThemeOptions => ({
  palette: {
    mode,
    primary: {
      main: primaryDarkBlue,
      light: primaryLight,
      dark: '#0d1452',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ffffff',
      contrastText: primaryDarkBlue,
    },
    background: {
      default: mode === 'light' ? '#f4f6fb' : '#0f1117',
      paper: mode === 'light' ? '#ffffff' : '#1a1d26',
    },
    text: {
      primary: mode === 'light' ? '#1a1a2e' : '#e8eaf6',
      secondary: mode === 'light' ? '#5c6b8a' : '#9aa5c4',
    },
    divider: mode === 'light' ? '#e3e8f0' : '#2a2f3d',
    success: { main: '#2e7d32' },
    warning: { main: '#ed6c02' },
    error: { main: '#d32f2f' },
    info: { main: '#0288d1' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: mode === 'light' ? '#c5cae9 transparent' : '#3949ab transparent',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow:
            mode === 'light'
              ? '0 1px 3px rgba(26, 35, 126, 0.08), 0 4px 16px rgba(26, 35, 126, 0.06)'
              : '0 4px 20px rgba(0, 0, 0, 0.35)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 10, padding: '8px 20px' },
        contained: { boxShadow: 'none', '&:hover': { boxShadow: '0 4px 12px rgba(26, 35, 126, 0.25)' } },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: { borderRadius: 16 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 600, backgroundColor: mode === 'light' ? '#f8f9fd' : '#1e2230' },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: sidebarBg,
          color: '#ffffff',
          borderRight: 'none',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: '2px 12px',
          '&.Mui-selected': {
            backgroundColor: 'rgba(255, 255, 255, 0.14)',
            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.18)' },
          },
          '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.08)' },
        },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
    },
  },
});

export const createAppTheme = (mode: 'light' | 'dark') => createTheme(getDesignTokens(mode));

export const sidebarWidth = 260;
export const sidebarCollapsedWidth = 72;
export const headerHeight = 64;
