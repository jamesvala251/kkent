bool hasPermission(
  List<String> roles,
  List<String> permissions,
  String permission,
) {
  if (roles.contains('Super Admin') || roles.contains('Admin')) return true;
  return permissions.contains(permission);
}
