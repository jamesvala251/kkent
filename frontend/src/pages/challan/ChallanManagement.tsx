import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Menu,
  MenuItem,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import PageHeader from '../../components/common/PageHeader';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../services/resourceService';
import { INDIAN_CITIES, withCustomCity } from '../../data/indianCities';
import { downloadBiltyPdf, downloadChallanPdf, exportChallanExcel } from '../../utils/challanPdf';
import type { Challan, ChallanItemMaster, ChallanLineItem, ChallanParty } from '../../types';

interface CompanyInfo {
  company_name?: string;
  address?: string;
  phone?: string;
  email?: string;
  gst_number?: string;
}

type MasterType = 'consignees' | 'transporters' | 'vendors';

const emptyParty = { name: '', gst: '', address: '', contact: '' };
const emptyItem = { name: '', unit: 'MT', weight: '', rate: '' };

function PartyMasterTab({
  type,
  title,
  rows,
  onReload,
}: {
  type: MasterType;
  title: string;
  rows: ChallanParty[];
  onReload: () => void;
}) {
  const [form, setForm] = useState(emptyParty);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState(emptyParty);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!form.name.trim() || !form.gst.trim()) return;
    setSaving(true);
    try {
      await api.post(`/challan/masters/${type}`, form);
      toast.success(`${title.slice(0, -1)} added`);
      setForm(emptyParty);
      onReload();
    } catch {
      // interceptor
    }
    setSaving(false);
  };

  const startEdit = (row: ChallanParty) => {
    setEditingId(row.id);
    setEditForm({
      name: row.name,
      gst: row.gst,
      address: row.address || '',
      contact: row.contact || '',
    });
  };

  const handleSave = async () => {
    if (!editingId || !editForm.name.trim() || !editForm.gst.trim()) return;
    setSaving(true);
    try {
      await api.put(`/challan/masters/${type}/${editingId}`, editForm);
      toast.success('Saved');
      setEditingId(null);
      onReload();
    } catch {
      // interceptor
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/challan/masters/${type}/${deleteId}`);
      toast.success('Deleted');
      setDeleteId(null);
      onReload();
    } catch {
      // interceptor
    }
  };

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Add {title.slice(0, -1)}</Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField label="Name" fullWidth size="small" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField label="GST No." fullWidth size="small" value={form.gst} onChange={(e) => setForm({ ...form, gst: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField label="Address" fullWidth size="small" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <TextField label="Contact" fullWidth size="small" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, md: 1 }}>
              <Button fullWidth variant="contained" startIcon={<AddIcon />} onClick={handleAdd} disabled={saving} sx={{ height: '100%' }}>
                Add
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>GST No.</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                {editingId === row.id ? (
                  <>
                    <TableCell><TextField size="small" fullWidth value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></TableCell>
                    <TableCell><TextField size="small" fullWidth value={editForm.gst} onChange={(e) => setEditForm({ ...editForm, gst: e.target.value })} /></TableCell>
                    <TableCell><TextField size="small" fullWidth value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} /></TableCell>
                    <TableCell><TextField size="small" fullWidth value={editForm.contact} onChange={(e) => setEditForm({ ...editForm, contact: e.target.value })} /></TableCell>
                    <TableCell align="right">
                      <IconButton color="primary" onClick={handleSave}><SaveIcon /></IconButton>
                      <IconButton onClick={() => setEditingId(null)}><CancelIcon /></IconButton>
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.gst}</TableCell>
                    <TableCell>{row.address}</TableCell>
                    <TableCell>{row.contact}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => startEdit(row)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => setDeleteId(row.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={5} align="center">No records</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        title={`Delete ${title.slice(0, -1)}`}
        message="Are you sure you want to delete this record?"
        confirmText="Delete"
        severity="error"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
}

function ItemsMasterTab({ rows, onReload }: { rows: ChallanItemMaster[]; onReload: () => void }) {
  const [form, setForm] = useState(emptyItem);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState(emptyItem);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const amount = (weight: string, rate: string) => {
    const w = Number(weight) || 0;
    const r = Number(rate) || 0;
    return (w * r).toFixed(2);
  };

  const handleAdd = async () => {
    if (!form.name.trim() || !form.unit.trim() || !form.weight || !form.rate) return;
    try {
      await api.post('/challan/masters/items', {
        name: form.name,
        unit: form.unit,
        weight: Number(form.weight),
        rate: Number(form.rate),
      });
      toast.success('Item added');
      setForm(emptyItem);
      onReload();
    } catch {
      // interceptor
    }
  };

  const startEdit = (row: ChallanItemMaster) => {
    setEditingId(row.id);
    setEditForm({
      name: row.name,
      unit: row.unit,
      weight: String(row.weight),
      rate: String(row.rate),
    });
  };

  const handleSave = async () => {
    if (!editingId || !editForm.name.trim() || !editForm.unit.trim() || !editForm.weight || !editForm.rate) return;
    try {
      await api.put(`/challan/masters/items/${editingId}`, {
        name: editForm.name,
        unit: editForm.unit,
        weight: Number(editForm.weight),
        rate: Number(editForm.rate),
      });
      toast.success('Saved');
      setEditingId(null);
      onReload();
    } catch {
      // interceptor
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/challan/masters/items/${deleteId}`);
      toast.success('Deleted');
      setDeleteId(null);
      onReload();
    } catch {
      // interceptor
    }
  };

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Add Item</Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField label="Item Name" fullWidth size="small" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <TextField label="Unit" fullWidth size="small" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <TextField label="Weight (MT)" type="number" fullWidth size="small" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <TextField label="Rate (₹/MT)" type="number" fullWidth size="small" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <TextField label="Amount" fullWidth size="small" value={amount(form.weight, form.rate)} InputProps={{ readOnly: true }} sx={{ bgcolor: '#f5f5f5' }} />
            </Grid>
            <Grid size={{ xs: 12, md: 1 }}>
              <Button fullWidth variant="contained" startIcon={<AddIcon />} onClick={handleAdd} sx={{ height: '100%' }}>Add</Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Item Name</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell align="right">Weight (MT)</TableCell>
              <TableCell align="right">Rate (₹/MT)</TableCell>
              <TableCell align="right">Amount (₹)</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                {editingId === row.id ? (
                  <>
                    <TableCell><TextField size="small" fullWidth value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></TableCell>
                    <TableCell><TextField size="small" fullWidth value={editForm.unit} onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })} /></TableCell>
                    <TableCell><TextField size="small" type="number" fullWidth value={editForm.weight} onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })} /></TableCell>
                    <TableCell><TextField size="small" type="number" fullWidth value={editForm.rate} onChange={(e) => setEditForm({ ...editForm, rate: e.target.value })} /></TableCell>
                    <TableCell align="right">{amount(editForm.weight, editForm.rate)}</TableCell>
                    <TableCell align="right">
                      <IconButton color="primary" onClick={handleSave}><SaveIcon /></IconButton>
                      <IconButton onClick={() => setEditingId(null)}><CancelIcon /></IconButton>
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.unit}</TableCell>
                    <TableCell align="right">{Number(row.weight).toLocaleString('en-IN')}</TableCell>
                    <TableCell align="right">{formatCurrency(Number(row.rate))}</TableCell>
                    <TableCell align="right">{formatCurrency(Number(row.amount))}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => startEdit(row)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => setDeleteId(row.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Item"
        message="Are you sure you want to delete this item?"
        confirmText="Delete"
        severity="error"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
}

export default function ChallanManagement() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [consignees, setConsignees] = useState<ChallanParty[]>([]);
  const [transporters, setTransporters] = useState<ChallanParty[]>([]);
  const [vendors, setVendors] = useState<ChallanParty[]>([]);
  const [items, setItems] = useState<ChallanItemMaster[]>([]);
  const [challans, setChallans] = useState<Challan[]>([]);
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [nextNo, setNextNo] = useState('');
  const [lineItems, setLineItems] = useState<ChallanLineItem[]>([]);
  const [deleteChallanId, setDeleteChallanId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const menuChallanRef = useRef<Challan | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    consignee: '',
    consignee_gst: '',
    consignee_address: '',
    date: dayjs().format('YYYY-MM-DD'),
    transporter: '',
    vendor: '',
    dispatched_from: '',
    vehicle_no: '',
    e_way_bill_no: '',
    e_way_date: dayjs().format('YYYY-MM-DD'),
    lr_no: '',
    po_no: '',
    prepared_by: '',
    select_item_id: '',
    cgst_rate: '9',
    sgst_rate: '9',
    igst_rate: '0',
  });

  const cityOptions = useMemo(
    () => withCustomCity(INDIAN_CITIES, form.dispatched_from),
    [form.dispatched_from],
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [c, t, v, i, list, next, settings] = await Promise.all([
        api.get<ChallanParty[]>('/challan/masters/consignees'),
        api.get<ChallanParty[]>('/challan/masters/transporters'),
        api.get<ChallanParty[]>('/challan/masters/vendors'),
        api.get<ChallanItemMaster[]>('/challan/masters/items'),
        api.get<Challan[]>('/challan'),
        api.get<{ challan_no: string }>('/challan/next-number'),
        api.get<CompanyInfo>('/settings').catch(() => ({ data: null })),
      ]);
      setConsignees(Array.isArray(c.data) ? c.data : []);
      setTransporters(Array.isArray(t.data) ? t.data : []);
      setVendors(Array.isArray(v.data) ? v.data : []);
      setItems(Array.isArray(i.data) ? i.data : []);
      setChallans(Array.isArray(list.data) ? list.data : []);
      setNextNo(next.data?.challan_no || '');
      setCompany(settings.data as CompanyInfo | null);
    } catch {
      toast.error('Failed to load challan data');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const onConsigneeChange = (name: string) => {
    const found = consignees.find((c) => c.name === name);
    setForm((prev) => ({
      ...prev,
      consignee: name,
      consignee_gst: found?.gst || '',
      consignee_address: found?.address || '',
    }));
  };

  const addItemLine = (itemId: string) => {
    const item = items.find((i) => String(i.id) === itemId);
    if (!item) return;
    setLineItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: item.name,
        unit: item.unit,
        weight: Number(item.weight),
        rate: Number(item.rate),
        amount: Number(item.amount),
        hsn: item.hsn || '1234567',
      },
    ]);
    setForm((prev) => ({ ...prev, select_item_id: '' }));
  };

  const resetForm = (challanNo?: string) => {
    setForm({
      consignee: '',
      consignee_gst: '',
      consignee_address: '',
      date: dayjs().format('YYYY-MM-DD'),
      transporter: '',
      vendor: '',
      dispatched_from: '',
      vehicle_no: '',
      e_way_bill_no: '',
      e_way_date: dayjs().format('YYYY-MM-DD'),
      lr_no: '',
      po_no: '',
      prepared_by: '',
      select_item_id: '',
      cgst_rate: '9',
      sgst_rate: '9',
      igst_rate: '0',
    });
    setLineItems([]);
    setEditingId(null);
    if (challanNo) setNextNo(challanNo);
  };

  const handleSubmit = async () => {
    const requiredOk =
      form.consignee &&
      form.transporter &&
      form.vendor &&
      form.dispatched_from &&
      form.lr_no &&
      form.po_no &&
      form.prepared_by &&
      form.vehicle_no &&
      form.e_way_bill_no &&
      form.e_way_date &&
      lineItems.length > 0;

    if (!requiredOk) {
      toast.error('Please fill all required fields and add at least one item');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        date: form.date,
        consignee: form.consignee,
        consignee_gst: form.consignee_gst,
        consignee_address: form.consignee_address,
        transporter: form.transporter,
        vendor: form.vendor,
        dispatched_from: form.dispatched_from,
        lr_no: form.lr_no,
        po_no: form.po_no,
        vehicle_no: form.vehicle_no,
        e_way_bill_no: form.e_way_bill_no,
        e_way_date: form.e_way_date,
        prepared_by: form.prepared_by,
        item_table: lineItems,
        cgst_rate: Number(form.cgst_rate) || 0,
        sgst_rate: Number(form.sgst_rate) || 0,
        igst_rate: Number(form.igst_rate) || 0,
      };
      if (editingId) {
        await api.put(`/challan/${editingId}`, payload);
        toast.success('Challan updated');
      } else {
        await api.post('/challan', payload);
        toast.success('Challan added');
      }
      const next = await api.get<{ challan_no: string }>('/challan/next-number');
      resetForm(next.data?.challan_no);
      loadAll();
    } catch {
      // interceptor
    }
    setSaving(false);
  };

  const startEdit = (row: Challan) => {
    setEditingId(row.id);
    setNextNo(row.challan_no);
    setForm({
      consignee: row.consignee || '',
      consignee_gst: row.consignee_gst || '',
      consignee_address: row.consignee_address || '',
      date: row.date?.split('T')[0] || dayjs().format('YYYY-MM-DD'),
      transporter: row.transporter || '',
      vendor: row.vendor || '',
      dispatched_from: row.dispatched_from || '',
      vehicle_no: row.vehicle_no || '',
      e_way_bill_no: row.e_way_bill_no || '',
      e_way_date: row.e_way_date?.split('T')[0] || dayjs().format('YYYY-MM-DD'),
      lr_no: row.lr_no || '',
      po_no: row.po_no || '',
      prepared_by: row.prepared_by || '',
      select_item_id: '',
      cgst_rate: '9',
      sgst_rate: '9',
      igst_rate: '0',
    });
    setLineItems(Array.isArray(row.item_table) ? row.item_table : []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeRowMenu = () => {
    setMenuAnchor(null);
  };

  const handleRowMenuAction = async (action: 'challan' | 'bilty' | 'excel' | 'print') => {
    const row = menuChallanRef.current;
    setMenuAnchor(null);

    if (!row) {
      toast.error('No challan selected');
      return;
    }

    try {
      if (action === 'challan') {
        await downloadChallanPdf(row, company || undefined);
        toast.success('Challan PDF downloaded');
        return;
      }
      if (action === 'bilty') {
        await downloadBiltyPdf(row, company || undefined);
        toast.success('Bilty PDF downloaded');
        return;
      }
      if (action === 'excel') {
        exportChallanExcel(row);
        toast.success('Excel (CSV) exported');
        return;
      }
      await downloadChallanPdf(row, company || undefined, 'print');
      toast.info('Opening print view');
    } catch (error) {
      console.error(error);
      toast.error('Action failed');
    }
  };

  const handleDeleteChallan = async () => {
    if (!deleteChallanId) return;
    try {
      await api.delete(`/challan/${deleteChallanId}`);
      toast.success('Challan deleted');
      setDeleteChallanId(null);
      loadAll();
    } catch {
      // interceptor
    }
  };

  if (loading) return <LoadingSkeleton variant="table" rows={8} />;

  return (
    <Box sx={{ p: 0 }}>
      <PageHeader
        title="KKENT Challan Management"
        subtitle="Delivery challans, consignees, transporters, vendors and items"
        breadcrumbs={[{ label: 'Challan' }]}
      />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile>
          <Tab label="Challan" />
          <Tab label="Consignees" />
          <Tab label="Transporters" />
          <Tab label="Vendors" />
          <Tab label="Items" />
        </Tabs>
      </Box>

      {tab === 0 && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>{editingId ? 'Edit Delivery Challan' : 'Add Delivery Challan'}</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    select
                    label="Consignee Name *"
                    fullWidth
                    size="small"
                    value={form.consignee}
                    onChange={(e) => onConsigneeChange(e.target.value)}
                  >
                    {consignees.map((c) => (
                      <MenuItem key={c.id} value={c.name}>{c.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="Challan No."
                    fullWidth
                    size="small"
                    value={nextNo}
                    InputProps={{ readOnly: true }}
                    sx={{ bgcolor: '#f5f5f5' }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="Challan Date"
                    type="date"
                    fullWidth
                    size="small"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="Consignee GST No."
                    fullWidth
                    size="small"
                    value={form.consignee_gst}
                    InputProps={{ readOnly: true }}
                    sx={{ bgcolor: '#f5f5f5' }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Autocomplete
                    freeSolo
                    options={cityOptions}
                    value={form.dispatched_from}
                    onChange={(_, value) => setForm({ ...form, dispatched_from: typeof value === 'string' ? value : value ?? '' })}
                    onInputChange={(_, value, reason) => {
                      if (reason === 'input' || reason === 'clear') {
                        setForm((prev) => ({ ...prev, dispatched_from: value }));
                      }
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label="Dispatched From *" size="small" />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    select
                    label="Transporter Name *"
                    fullWidth
                    size="small"
                    value={form.transporter}
                    onChange={(e) => setForm({ ...form, transporter: e.target.value })}
                  >
                    {transporters.map((t) => (
                      <MenuItem key={t.id} value={t.name}>{t.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="Vehicle No. *"
                    fullWidth
                    size="small"
                    value={form.vehicle_no}
                    onChange={(e) => setForm({ ...form, vehicle_no: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="E-Way Bill No. *"
                    fullWidth
                    size="small"
                    value={form.e_way_bill_no}
                    onChange={(e) => setForm({ ...form, e_way_bill_no: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="E-Way Date *"
                    type="date"
                    fullWidth
                    size="small"
                    value={form.e_way_date}
                    onChange={(e) => setForm({ ...form, e_way_date: e.target.value })}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="LR No. *"
                    fullWidth
                    size="small"
                    value={form.lr_no}
                    onChange={(e) => setForm({ ...form, lr_no: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="PO No. *"
                    fullWidth
                    size="small"
                    value={form.po_no}
                    onChange={(e) => setForm({ ...form, po_no: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="Prepared By *"
                    fullWidth
                    size="small"
                    value={form.prepared_by}
                    onChange={(e) => setForm({ ...form, prepared_by: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    select
                    label="Vendor Name *"
                    fullWidth
                    size="small"
                    value={form.vendor}
                    onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                  >
                    {vendors.map((v) => (
                      <MenuItem key={v.id} value={v.name}>{v.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="CGST %"
                    type="number"
                    fullWidth
                    size="small"
                    value={form.cgst_rate}
                    disabled={Number(form.igst_rate) > 0}
                    onChange={(e) => {
                      const value = e.target.value;
                      setForm({ ...form, cgst_rate: value, igst_rate: Number(value) > 0 ? '0' : form.igst_rate });
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="SGST %"
                    type="number"
                    fullWidth
                    size="small"
                    value={form.sgst_rate}
                    disabled={Number(form.igst_rate) > 0}
                    onChange={(e) => {
                      const value = e.target.value;
                      setForm({ ...form, sgst_rate: value, igst_rate: Number(value) > 0 ? '0' : form.igst_rate });
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="IGST %"
                    type="number"
                    fullWidth
                    size="small"
                    value={form.igst_rate}
                    disabled={Number(form.cgst_rate) > 0 || Number(form.sgst_rate) > 0}
                    onChange={(e) => {
                      const value = e.target.value;
                      setForm({
                        ...form,
                        igst_rate: value,
                        cgst_rate: Number(value) > 0 ? '0' : form.cgst_rate,
                        sgst_rate: Number(value) > 0 ? '0' : form.sgst_rate,
                      });
                    }}
                    helperText="Use IGST instead of CGST + SGST for inter-state"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    select
                    label="Select Item"
                    fullWidth
                    size="small"
                    value={form.select_item_id}
                    onChange={(e) => addItemLine(e.target.value)}
                  >
                    {items.map((item) => (
                      <MenuItem key={item.id} value={String(item.id)}>
                        {item.name} ({item.weight} {item.unit})
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>

              {lineItems.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>Item Details</Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Sr. No.</TableCell>
                        <TableCell>Product Name</TableCell>
                        <TableCell>Unit</TableCell>
                        <TableCell align="right">Weight (MT)</TableCell>
                        <TableCell align="right">Rate (₹/MT)</TableCell>
                        <TableCell align="right">Amount (₹)</TableCell>
                        <TableCell align="right">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lineItems.map((line, idx) => (
                        <TableRow key={line.id}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell>{line.name}</TableCell>
                          <TableCell>{line.unit}</TableCell>
                          <TableCell align="right">{line.weight}</TableCell>
                          <TableCell align="right">{formatCurrency(line.rate)}</TableCell>
                          <TableCell align="right">{formatCurrency(line.amount)}</TableCell>
                          <TableCell align="right">
                            <IconButton size="small" color="error" onClick={() => setLineItems((prev) => prev.filter((l) => l.id !== line.id))}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}

              <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                <Button variant="contained" onClick={handleSubmit} disabled={saving}>
                  {editingId ? 'Update Challan' : 'Add Challan'}
                </Button>
                {editingId && (
                  <Button onClick={() => resetForm(nextNo)}>Cancel</Button>
                )}
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Challan List</Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Challan No.</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Consignee</TableCell>
                      <TableCell>Transporter</TableCell>
                      <TableCell>Vendor</TableCell>
                      <TableCell>Dispatched From</TableCell>
                      <TableCell>LR No.</TableCell>
                      <TableCell>PO No.</TableCell>
                      <TableCell>Vehicle No.</TableCell>
                      <TableCell>E-Way Bill No.</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {challans.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.challan_no}</TableCell>
                        <TableCell>{formatDate(row.date)}</TableCell>
                        <TableCell>{row.consignee}</TableCell>
                        <TableCell>{row.transporter}</TableCell>
                        <TableCell>{row.vendor}</TableCell>
                        <TableCell>{row.dispatched_from}</TableCell>
                        <TableCell>{row.lr_no}</TableCell>
                        <TableCell>{row.po_no}</TableCell>
                        <TableCell>{row.vehicle_no}</TableCell>
                        <TableCell>{row.e_way_bill_no}</TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                          <IconButton size="small" onClick={() => startEdit(row)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => setDeleteChallanId(row.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={async () => {
                              try {
                                await downloadChallanPdf(row, company || undefined);
                                toast.success('Challan PDF downloaded');
                              } catch (error) {
                                console.error(error);
                                toast.error('PDF download failed');
                              }
                            }}
                          >
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            aria-label="More actions"
                            aria-controls={menuAnchor ? 'challan-row-menu' : undefined}
                            aria-haspopup="true"
                            aria-expanded={menuAnchor ? 'true' : undefined}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              menuChallanRef.current = row;
                              setMenuAnchor(e.currentTarget);
                            }}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {challans.length === 0 && (
                      <TableRow><TableCell colSpan={11} align="center">No challans yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </Box>
            </CardContent>
          </Card>

          <Menu
            id="challan-row-menu"
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={closeRowMenu}
            keepMounted
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{
              paper: { sx: { minWidth: 180, zIndex: (theme) => theme.zIndex.modal + 1 } },
            }}
          >
            <MenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleRowMenuAction('challan');
              }}
            >
              Challan
            </MenuItem>
            <MenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleRowMenuAction('bilty');
              }}
            >
              Bilty
            </MenuItem>
            <MenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleRowMenuAction('excel');
              }}
            >
              Excel
            </MenuItem>
            <MenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleRowMenuAction('print');
              }}
            >
              Print
            </MenuItem>
          </Menu>

          <ConfirmDialog
            open={!!deleteChallanId}
            title="Delete Challan"
            message="Are you sure you want to delete this challan?"
            confirmText="Delete"
            severity="error"
            onConfirm={handleDeleteChallan}
            onCancel={() => setDeleteChallanId(null)}
          />
        </Box>
      )}

      {tab === 1 && <PartyMasterTab type="consignees" title="Consignees" rows={consignees} onReload={loadAll} />}
      {tab === 2 && <PartyMasterTab type="transporters" title="Transporters" rows={transporters} onReload={loadAll} />}
      {tab === 3 && <PartyMasterTab type="vendors" title="Vendors" rows={vendors} onReload={loadAll} />}
      {tab === 4 && <ItemsMasterTab rows={items} onReload={loadAll} />}
    </Box>
  );
}
