import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Box,
  Breadcrumbs,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import ConstructionIcon from '@mui/icons-material/Construction';
import RouteIcon from '@mui/icons-material/Route';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PaymentsIcon from '@mui/icons-material/Payments';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SettingsIcon from '@mui/icons-material/Settings';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import CompanyLogo from '../components/common/CompanyLogo';
import { logout } from '../store/slices/authSlice';
import { setSidebarOpen, toggleDarkMode, toggleSidebarCollapsed } from '../store/slices/uiSlice';
import { headerHeight, sidebarCollapsedWidth, sidebarWidth } from '../theme/theme';

const menuItems = [
  { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
  { label: 'Customers', path: '/customers', icon: <PeopleIcon /> },
  { label: 'Drivers', path: '/drivers', icon: <LocalShippingIcon /> },
  { label: 'Trucks', path: '/trucks', icon: <DirectionsCarIcon /> },
  { label: 'Hitachi', path: '/hitachi', icon: <ConstructionIcon /> },
  { label: 'Trips', path: '/trips', icon: <RouteIcon /> },
  { label: 'Diesel', path: '/diesel', icon: <LocalGasStationIcon /> },
  { label: 'Expenses', path: '/expenses', icon: <ReceiptLongIcon /> },
  { label: 'Salary', path: '/salary', icon: <PaymentsIcon /> },
  { label: 'Invoices', path: '/invoices', icon: <RequestQuoteIcon /> },
  { label: 'Reports', path: '/reports', icon: <AssessmentIcon /> },
  { label: 'Roles & Permissions', path: '/roles', icon: <AdminPanelSettingsIcon /> },
  { label: 'Settings', path: '/settings', icon: <SettingsIcon /> },
];

export default function DashboardLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { sidebarOpen, sidebarCollapsed, darkMode } = useAppSelector((state) => state.ui);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const isCollapsed = !isMobile && sidebarCollapsed;
  const drawerWidth = isMobile ? sidebarWidth : (isCollapsed ? sidebarCollapsedWidth : sidebarWidth);

  const drawerTransition = theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  });

  useEffect(() => {
    if (isMobile) {
      dispatch(setSidebarOpen(false));
    }
  }, [isMobile, dispatch]);

  const breadcrumbs = useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    return segments.map((seg, index) => ({
      label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
      path: '/' + segments.slice(0, index + 1).join('/'),
    }));
  }, [location.pathname]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/auth/login');
  };

  const handleSidebarToggle = () => {
    if (isMobile) {
      dispatch(setSidebarOpen(!sidebarOpen));
      return;
    }
    dispatch(toggleSidebarCollapsed());
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          px: isCollapsed ? 1 : 2.5,
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
        }}
      >
        <Box
          sx={{
            px: isCollapsed ? 0.75 : 1.5,
            py: 1.5,
            mx: isCollapsed ? 0.5 : 0,
            borderRadius: 2,
            bgcolor: 'rgba(255,255,255,0.96)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: 1.25,
          }}
        >
          <CompanyLogo size={isCollapsed ? 'xs' : 'sm'} />
          {!isCollapsed && (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main', lineHeight: 1.2 }}>
                KK Enterprise
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Transport ERP
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
      <List sx={{ flex: 1, py: 1.5, overflow: 'auto' }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          const listItem = (
            <ListItemButton
              selected={isActive}
              onClick={() => {
                navigate(item.path);
                if (isMobile) dispatch(setSidebarOpen(false));
              }}
              sx={{
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                px: isCollapsed ? 1 : 2,
              }}
            >
              <ListItemIcon
                sx={{
                  color: 'inherit',
                  minWidth: isCollapsed ? 0 : 40,
                  justifyContent: 'center',
                }}
              >
                {item.icon}
              </ListItemIcon>
              {!isCollapsed && (
                <ListItemText
                  primary={item.label}
                  slotProps={{ primary: { sx: { fontSize: 14, fontWeight: isActive ? 600 : 400 } } }}
                />
              )}
            </ListItemButton>
          );

          return isCollapsed ? (
            <Tooltip key={item.path} title={item.label} placement="right">
              {listItem}
            </Tooltip>
          ) : (
            <Box key={item.path} component="span" sx={{ display: 'contents' }}>
              {listItem}
            </Box>
          );
        })}
      </List>
      {!isCollapsed && (
        <>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
          <Box sx={{ p: 2 }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
              © 2026 KK Enterprise
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? sidebarOpen : true}
        onClose={() => dispatch(setSidebarOpen(false))}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: isMobile ? 0 : drawerWidth,
          flexShrink: 0,
          transition: isMobile ? undefined : drawerTransition,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            overflowX: 'hidden',
            transition: isMobile ? undefined : drawerTransition,
            // Permanent sidebar stays in-flow; temporary (mobile) must be fixed overlay
            ...(isMobile
              ? {
                  position: 'fixed',
                  height: '100%',
                  zIndex: (t) => t.zIndex.drawer + 2,
                }
              : {
                  position: 'relative',
                  height: '100vh',
                }),
          },
        }}
      >
        {drawerContent}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          transition: drawerTransition,
        }}
      >
        <AppBar
          position="sticky"
          elevation={0}
          color="inherit"
          sx={{
            height: headerHeight,
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Toolbar sx={{ gap: 1 }}>
            <IconButton edge="start" onClick={handleSidebarToggle}>
              {isMobile ? (
                <MenuIcon />
              ) : isCollapsed ? (
                <ChevronRightIcon />
              ) : (
                <ChevronLeftIcon />
              )}
            </IconButton>

            <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ flex: 1, display: { xs: 'none', sm: 'flex' } }}>
              <Typography variant="body2" color="text.secondary">
                Home
              </Typography>
              {breadcrumbs.map((crumb, i) => (
                <Typography
                  key={crumb.path}
                  variant="body2"
                  color={i === breadcrumbs.length - 1 ? 'text.primary' : 'text.secondary'}
                  sx={{ fontWeight: i === breadcrumbs.length - 1 ? 600 : 400 }}
                >
                  {crumb.label}
                </Typography>
              ))}
            </Breadcrumbs>

            <Box sx={{ flex: 1, display: { sm: 'none' } }} />

            <Tooltip title={darkMode ? 'Light mode' : 'Dark mode'}>
              <IconButton onClick={() => dispatch(toggleDarkMode())}>
                {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>

            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
              <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14 }}>
                {user?.name?.charAt(0) || 'U'}
              </Avatar>
            </IconButton>

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
              <MenuItem
                onClick={() => {
                  setAnchorEl(null);
                  navigate('/profile');
                }}
              >
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                Profile
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1600, mx: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
