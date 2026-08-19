import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Autocomplete,
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import api from '../../services/api';

interface SearchHit {
  group: string;
  id: number;
  label: string;
  hint?: string;
  path: string;
}

interface SearchPayload {
  customers?: Array<{ id: number; name?: string; company_name?: string; mobile?: string }>;
  drivers?: Array<{ id: number; name?: string; mobile?: string }>;
  trucks?: Array<{ id: number; truck_number?: string }>;
  trips?: Array<{ id: number; trip_number?: string }>;
  invoices?: Array<{ id: number; invoice_number?: string }>;
  hitachi?: Array<{ id: number; machine_number?: string }>;
}

function toHits(payload: SearchPayload): SearchHit[] {
  const hits: SearchHit[] = [];
  (payload.customers ?? []).forEach((row) =>
    hits.push({
      group: 'Customers',
      id: row.id,
      label: row.name ?? '',
      hint: [row.company_name, row.mobile].filter(Boolean).join(' · '),
      path: `/customers/${row.id}/ledger`,
    }),
  );
  (payload.drivers ?? []).forEach((row) =>
    hits.push({
      group: 'Drivers',
      id: row.id,
      label: row.name ?? '',
      hint: row.mobile,
      path: `/drivers/${row.id}/edit`,
    }),
  );
  (payload.trucks ?? []).forEach((row) =>
    hits.push({
      group: 'Trucks',
      id: row.id,
      label: row.truck_number ?? '',
      path: `/trucks/${row.id}/edit`,
    }),
  );
  (payload.hitachi ?? []).forEach((row) =>
    hits.push({
      group: 'Hitachi',
      id: row.id,
      label: row.machine_number ?? '',
      path: `/hitachi/${row.id}/edit`,
    }),
  );
  (payload.trips ?? []).forEach((row) =>
    hits.push({
      group: 'Trips',
      id: row.id,
      label: row.trip_number ?? '',
      path: `/trips/${row.id}/edit`,
    }),
  );
  (payload.invoices ?? []).forEach((row) =>
    hits.push({
      group: 'Invoices',
      id: row.id,
      label: row.invoice_number ?? '',
      path: `/invoices/${row.id}/edit`,
    }),
  );
  return hits;
}

function SearchField({
  autoFocus,
  fullWidth,
  onPicked,
}: {
  autoFocus?: boolean;
  fullWidth?: boolean;
  onPicked?: () => void;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setOptions([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const handle = window.setTimeout(async () => {
      try {
        const { data } = await api.get<SearchPayload | SearchHit[]>('/search', { params: { q: term } });
        if (cancelled) return;
        const payload = (data && !Array.isArray(data) ? data : {}) as SearchPayload;
        setOptions(toHits(payload));
      } catch {
        if (!cancelled) setOptions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [query]);

  const noOptionsText = useMemo(() => {
    if (query.trim().length < 2) return 'Type at least 2 characters';
    if (loading) return 'Searching…';
    return 'No matches';
  }, [query, loading]);

  return (
    <Autocomplete
      fullWidth={fullWidth}
      sx={fullWidth ? undefined : { minWidth: { xs: 180, sm: 260, md: 340 }, maxWidth: 420, flex: 1 }}
      options={options}
      loading={loading}
      inputValue={query}
      filterOptions={(x) => x}
      autoHighlight
      clearOnBlur={false}
      groupBy={(option) => option.group}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(a, b) => a.group === b.group && a.id === b.id}
      noOptionsText={noOptionsText}
      onInputChange={(_, value, reason) => {
        if (reason !== 'reset') setQuery(value);
      }}
      onChange={(_, value) => {
        if (!value) return;
        navigate(value.path);
        setQuery('');
        setOptions([]);
        onPicked?.();
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          autoFocus={autoFocus}
          placeholder="Search customers, trips, invoices…"
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={16} sx={{ mr: 1 }} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, option) => {
        const { key, ...rest } = props as typeof props & { key?: string };
        return (
          <Box component="li" key={key ?? `${option.group}-${option.id}`} {...rest}>
            <Box>
              <Typography variant="body2">{option.label}</Typography>
              {option.hint && (
                <Typography variant="caption" color="text.secondary">
                  {option.hint}
                </Typography>
              )}
            </Box>
          </Box>
        );
      }}
    />
  );
}

export default function GlobalSearch() {
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down('sm'));
  const [open, setOpen] = useState(false);

  if (isCompact) {
    return (
      <>
        <IconButton aria-label="Search" onClick={() => setOpen(true)}>
          <SearchIcon />
        </IconButton>
        <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
          <DialogContent sx={{ pt: 2 }}>
            <SearchField autoFocus fullWidth onPicked={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return <SearchField />;
}
