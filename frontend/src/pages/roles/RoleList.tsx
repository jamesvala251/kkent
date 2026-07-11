import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Chip, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { type Column } from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import { deleteItem, fetchList } from '../../services/resourceService';
import type { Role } from '../../types';
import { toast } from 'react-toastify';

const PROTECTED_ROLES = ['Super Admin'];

export default function RoleList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await fetchList<Role>('/roles');
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
      await deleteItem('/roles', deleteId);
      toast.success('Role deleted');
      setDeleteId(null);
      load();
    } catch {
      toast.error('Failed to delete role');
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Role>[] = [
    { id: 'name', label: 'Role Name', minWidth: 180 },
    {
      id: 'permissions_count',
      label: 'Permissions',
      format: (row) => (
        <Chip label={row.permissions_count ?? row.permissions?.length ?? 0} size="small" color="primary" variant="outlined" />
      ),
    },
    {
      id: 'users_count',
      label: 'Users',
      format: (row) => <Chip label={row.users_count ?? 0} size="small" />,
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      format: (row) => (
        <>
          <IconButton size="small" onClick={() => navigate(`/roles/${row.id}/edit`)}>
            <EditIcon fontSize="small" />
          </IconButton>
          {!PROTECTED_ROLES.includes(row.name) && (
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
        title="Roles & Permissions"
        subtitle="Create roles and assign module permissions"
        breadcrumbs={[{ label: 'Roles & Permissions' }]}
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/roles/new')}>
            Add Role
          </Button>
        }
      />
      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        searchKeys={['name']}
        searchPlaceholder="Search roles..."
        emptyMessage="No roles found"
      />
      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Role"
        message="Are you sure you want to delete this role? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </>
  );
}
