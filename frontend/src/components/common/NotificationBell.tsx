import { useCallback, useEffect, useState } from 'react';
import { Badge, Box, Divider, IconButton, Menu, MenuItem, Tooltip, Typography } from '@mui/material';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

interface AppNote {
  id: number;
  title: string;
  message?: string;
  link?: string | null;
  is_read: boolean;
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const [items, setItems] = useState<AppNote[]>([]);

  const load = useCallback(async () => {
    const { data } = await api.get<{ data?: AppNote[] } | AppNote[]>('/notifications', { params: { per_page: 20 } });
    const list = Array.isArray(data) ? data : data?.data ?? [];
    setItems(list);
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 5 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [load]);

  const unread = items.filter((item) => !item.is_read).length;

  const open = async (event: React.MouseEvent<HTMLElement>) => {
    setAnchor(event.currentTarget);
    await load();
  };

  const markAll = async () => {
    await api.post('/notifications/read-all');
    load();
  };

  const openItem = async (item: AppNote) => {
    if (!item.is_read) {
      await api.post(`/notifications/${item.id}/read`);
    }
    setAnchor(null);
    if (item.link) navigate(item.link);
    load();
  };

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton onClick={open} aria-label="Notifications">
          <Badge badgeContent={unread} color="error">
            <NotificationsNoneIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        slotProps={{ paper: { sx: { width: 360, maxHeight: 440 } } }}
      >
        <Box sx={{ px: 2, py: 1.25 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            Notifications
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Expiry reminders and overdue invoices
          </Typography>
        </Box>
        <Divider />
        {items.length === 0 && (
          <MenuItem disabled>
            <Typography variant="body2">No alerts right now</Typography>
          </MenuItem>
        )}
        {items.map((item) => (
          <MenuItem
            key={item.id}
            onClick={() => openItem(item)}
            selected={!item.is_read}
            sx={{ alignItems: 'flex-start', whiteSpace: 'normal', py: 1.25 }}
          >
            <Box>
              <Typography variant="body2" fontWeight={item.is_read ? 400 : 700}>
                {item.title}
              </Typography>
              {item.message && (
                <Typography variant="caption" color="text.secondary" display="block">
                  {item.message}
                </Typography>
              )}
            </Box>
          </MenuItem>
        ))}
        {unread > 0 && (
          <MenuItem onClick={markAll}>
            <Typography variant="body2">Mark all as read</Typography>
          </MenuItem>
        )}
      </Menu>
    </>
  );
}
