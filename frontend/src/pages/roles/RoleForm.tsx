import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Divider,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useForm, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import PageHeader from '../../components/common/PageHeader';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import api from '../../services/api';
import { createItem, fetchOne, updateItem } from '../../services/resourceService';
import type { PermissionGroup, PermissionsResponse, Role } from '../../types';

const schema = yup.object({
  name: yup.string().required('Role name is required').max(100),
});

interface RoleFormData {
  name: string;
}

export default function RoleForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id && id !== 'new');
  const [loadingData, setLoadingData] = useState(isEdit);
  const [permissionMeta, setPermissionMeta] = useState<PermissionsResponse | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RoleFormData>({
    resolver: yupResolver(schema) as Resolver<RoleFormData>,
    defaultValues: { name: '' },
  });

  useEffect(() => {
    const load = async () => {
      try {
        const { data: permissionsData } = await api.get<PermissionsResponse>('/permissions');
        setPermissionMeta(permissionsData);

        if (isEdit && id) {
          const role = await fetchOne<Role>('/roles', id);
          if (role) {
            reset({ name: role.name });
            setSelectedPermissions(role.permissions ?? []);
          }
        }
      } catch {
        toast.error('Failed to load role data');
      } finally {
        setLoadingData(false);
      }
    };
    load();
  }, [id, isEdit, reset]);

  const allPermissionNames = useMemo(() => {
    if (!permissionMeta) return [];
    return permissionMeta.groups.flatMap((group) => Object.values(group.permissions));
  }, [permissionMeta]);

  const isAllSelected = allPermissionNames.length > 0 && allPermissionNames.every((p) => selectedPermissions.includes(p));

  const togglePermission = (permissionName: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionName) ? prev.filter((p) => p !== permissionName) : [...prev, permissionName],
    );
  };

  const toggleModule = (group: PermissionGroup) => {
    const modulePermissions = Object.values(group.permissions);
    const allChecked = modulePermissions.every((p) => selectedPermissions.includes(p));

    if (allChecked) {
      setSelectedPermissions((prev) => prev.filter((p) => !modulePermissions.includes(p)));
    } else {
      setSelectedPermissions((prev) => [...new Set([...prev, ...modulePermissions])]);
    }
  };

  const toggleAction = (actionKey: string) => {
    if (!permissionMeta) return;
    const actionPermissions = permissionMeta.groups
      .map((group) => group.permissions[actionKey])
      .filter(Boolean) as string[];

    const allChecked = actionPermissions.every((p) => selectedPermissions.includes(p));

    if (allChecked) {
      setSelectedPermissions((prev) => prev.filter((p) => !actionPermissions.includes(p)));
    } else {
      setSelectedPermissions((prev) => [...new Set([...prev, ...actionPermissions])]);
    }
  };

  const toggleAll = () => {
    setSelectedPermissions(isAllSelected ? [] : allPermissionNames);
  };

  const onSubmit = async (formData: RoleFormData) => {
    try {
      const payload = { name: formData.name, permissions: selectedPermissions };
      if (isEdit && id) {
        await updateItem<Role>('/roles', id, payload);
        toast.success('Role updated');
      } else {
        await createItem<Role>('/roles', payload);
        toast.success('Role created');
      }
      navigate('/roles');
    } catch {
      toast.error(isEdit ? 'Failed to update role' : 'Failed to create role');
    }
  };

  if (loadingData) return <LoadingSkeleton variant="form" />;

  return (
    <Box>
      <PageHeader
        title={isEdit ? 'Edit Role' : 'Create Role'}
        breadcrumbs={[
          { label: 'Roles & Permissions', path: '/roles' },
          { label: isEdit ? 'Edit' : 'Create' },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Role Details
                </Typography>
                <TextField
                  label="Role Name"
                  fullWidth
                  {...register('name')}
                  error={Boolean(errors.name)}
                  helperText={errors.name?.message}
                  sx={{ mb: 2 }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Selected permissions: {selectedPermissions.length}
                </Typography>
                <FormControlLabel
                  control={<Checkbox checked={isAllSelected} onChange={toggleAll} />}
                  label="Select all permissions"
                />
                <Divider sx={{ my: 2 }} />
                <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/roles')} fullWidth sx={{ mb: 1 }}>
                  Back
                </Button>
                <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={isSubmitting} fullWidth>
                  {isEdit ? 'Update Role' : 'Create Role'}
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Module Permissions
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Grant access per module. Click a module row or action column header to toggle all in that group.
                </Typography>

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Module</TableCell>
                        {permissionMeta?.actions.map((action) => (
                          <TableCell key={action.key} align="center" sx={{ fontWeight: 600, cursor: 'pointer' }} onClick={() => toggleAction(action.key)}>
                            {action.label}
                          </TableCell>
                        ))}
                        <TableCell align="center" sx={{ fontWeight: 600 }}>All</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {permissionMeta?.groups.map((group) => {
                        const modulePermissions = Object.values(group.permissions);
                        const moduleAllChecked = modulePermissions.every((p) => selectedPermissions.includes(p));
                        const moduleSomeChecked = modulePermissions.some((p) => selectedPermissions.includes(p));

                        return (
                          <TableRow key={group.module} hover>
                            <TableCell sx={{ fontWeight: 500, cursor: 'pointer' }} onClick={() => toggleModule(group)}>
                              {group.label}
                            </TableCell>
                            {permissionMeta.actions.map((action) => {
                              const permissionName = group.permissions[action.key];
                              if (!permissionName) {
                                return <TableCell key={action.key} align="center">—</TableCell>;
                              }

                              return (
                                <TableCell key={action.key} align="center">
                                  <Checkbox
                                    size="small"
                                    checked={selectedPermissions.includes(permissionName)}
                                    onChange={() => togglePermission(permissionName)}
                                  />
                                </TableCell>
                              );
                            })}
                            <TableCell align="center">
                              <Checkbox
                                size="small"
                                checked={moduleAllChecked}
                                indeterminate={moduleSomeChecked && !moduleAllChecked}
                                onChange={() => toggleModule(group)}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
}
