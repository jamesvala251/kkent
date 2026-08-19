import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chip, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Button from '@mui/material/Button';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { type Column } from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import { deleteItem, fetchList } from '../../services/resourceService';
import { useAppSelector } from '../../hooks/redux';
import type { AppUser } from '../../types';
import { toast } from 'react-toastify';

export default function UserList() {
  const navigate = useNavigate();
  const currentUser = useAppSelector((state) => state.auth.user);
  const [rows, setRows] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await fetchList<AppUser>('/users');
    setRows(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteItem('/users', deleteId);
      toast.success('User deleted');
      setDeleteId(null);
      load();
    } catch {
      toast.error('Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<AppUser>[] = [
    { id: 'name', label: 'Name', minWidth: 180 },
    { id: 'email', label: 'Email', minWidth: 200 },
    { id: 'phone', label: 'Phone' },
    {
      id: 'roles',
      label: 'Role',
      format: (row) => (row.roles ?? []).join(', ') || '—',
    },
    {
      id: 'status',
      label: 'Status',
      format: (row) => (
        <Chip
          label={row.status === 'active' ? 'Active' : 'Inactive'}
          size="small"
          color={row.status === 'active' ? 'success' : 'default'}
        />
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      format: (row) => (
        <>
          <IconButton size="small" onClick={() => navigate(`/users/${row.id}/edit`)}>
            <EditIcon fontSize="small" />
          </IconButton>
          {row.id !== currentUser?.id && (
            <IconButton size="small" color="error" onClick={() => setDeleteId(row.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </>
      ),
    },
  ];

  if (loading && rows.length === 0) return <LoadingSkeleton variant="table" />;

  return (
    <>
      <PageHeader
        title="Users"
        subtitle="Create login accounts and assign a role"
        breadcrumbs={[{ label: 'Users' }]}
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/users/new')}>
            Add User
          </Button>
        }
      />
      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        searchKeys={['name', 'email', 'phone']}
        searchPlaceholder="Search users..."
        emptyMessage="No users found"
      />
      <ConfirmDialog
        open={deleteId !== null}
        title="Delete User"
        message="Are you sure you want to delete this user? They will no longer be able to sign in."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </>
  );
}
