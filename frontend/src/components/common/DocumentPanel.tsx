import { useCallback, useEffect, useState } from 'react';
import { Box, Button, IconButton, Link, MenuItem, TextField, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { getStorageUrl } from '../../services/resourceService';

interface Doc {
  id: number;
  title: string;
  type: string;
  file_path: string;
  expiry_date?: string | null;
}

export default function DocumentPanel({
  type,
  entityId,
}: {
  type: 'truck' | 'driver' | 'hitachi' | 'customer';
  entityId?: number;
}) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState('other');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!entityId) return;
    const { data } = await api.get<Doc[] | { data: Doc[] }>(`/documents/${type}/${entityId}`);
    setDocs(Array.isArray(data) ? data : data?.data ?? []);
  }, [entityId, type]);

  useEffect(() => {
    load();
  }, [load]);

  if (!entityId) {
    return (
      <Typography variant="body2" color="text.secondary">
        Save the record first to attach documents.
      </Typography>
    );
  }

  const upload = async () => {
    if (!file || !title) {
      toast.error('Title and file are required');
      return;
    }
    setSaving(true);
    try {
      const form = new FormData();
      form.append('documentable_type', type);
      form.append('documentable_id', String(entityId));
      form.append('type', docType);
      form.append('title', title);
      form.append('file', file);
      await api.post('/documents', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Document uploaded');
      setTitle('');
      setFile(null);
      load();
    } catch {
      // interceptor
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    await api.delete(`/documents/${id}`);
    toast.success('Document deleted');
    load();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        <TextField size="small" label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <TextField
          size="small"
          select
          label="Type"
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          sx={{ minWidth: 140 }}
        >
          {['rc', 'insurance', 'fitness', 'permit', 'puc', 'license', 'aadhaar', 'other'].map((type) => (
            <MenuItem key={type} value={type}>{type}</MenuItem>
          ))}
        </TextField>
        <Button component="label" variant="outlined" size="small">
          {file ? file.name : 'Choose file'}
          <input hidden type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </Button>
        <Button variant="contained" size="small" onClick={upload} disabled={saving}>
          Upload
        </Button>
      </Box>
      {docs.map((doc) => {
        const url = getStorageUrl(doc.file_path);
        return (
          <Box key={doc.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            {url ? (
              <Link href={url} target="_blank" rel="noopener noreferrer">
                {doc.title}
              </Link>
            ) : (
              <Typography variant="body2">{doc.title}</Typography>
            )}
            <Typography variant="caption" color="text.secondary">
              {doc.type}
            </Typography>
            <IconButton size="small" color="error" onClick={() => remove(doc.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        );
      })}
      {docs.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No documents attached.
        </Typography>
      )}
    </Box>
  );
}
