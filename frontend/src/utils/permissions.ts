export function hasPermission(
  user: { roles?: Array<string | { name?: string }>; permissions?: Array<string | { name?: string }> } | null | undefined,
  permission: string,
): boolean {
  if (!user) return false;
  const names = (values?: Array<string | { name?: string }>) =>
    (values ?? []).map((value) => (typeof value === 'string' ? value : value?.name)).filter(Boolean) as string[];
  const roles = names(user.roles);
  if (roles.some((role) => role === 'Super Admin' || role === 'Admin')) return true;
  return names(user.permissions).includes(permission);
}

const HOME_PATHS: Array<{ path: string; permission?: string }> = [
  { path: '/dashboard', permission: 'dashboard.view' },
  { path: '/customers', permission: 'customers.view' },
  { path: '/drivers', permission: 'drivers.view' },
  { path: '/trucks', permission: 'trucks.view' },
  { path: '/hitachi', permission: 'hitachi.view' },
  { path: '/trips', permission: 'trips.view' },
  { path: '/diesel', permission: 'diesel.view' },
  { path: '/expenses', permission: 'expenses.view' },
  { path: '/salary', permission: 'salaries.view' },
  { path: '/invoices', permission: 'invoices.view' },
  { path: '/challan', permission: 'challans.view' },
  { path: '/reports', permission: 'reports.view' },
  { path: '/users', permission: 'users.view' },
  { path: '/roles', permission: 'roles.view' },
  { path: '/settings', permission: 'settings.view' },
];

export function getHomePath(
  user: { roles?: Array<string | { name?: string }>; permissions?: Array<string | { name?: string }> } | null | undefined,
): string {
  const match = HOME_PATHS.find((item) => !item.permission || hasPermission(user, item.permission));
  return match?.path ?? '/profile';
}
