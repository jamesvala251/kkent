import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../l10n/app_localizations.dart';
import '../state/auth_state.dart';
import '../theme/app_theme.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  late final TextEditingController _name;
  late final TextEditingController _email;
  late final TextEditingController _phone;
  final _current = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  bool _savingProfile = false;
  bool _savingPassword = false;

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthState>().user;
    _name = TextEditingController(text: user?.name ?? '');
    _email = TextEditingController(text: user?.email ?? '');
    _phone = TextEditingController(text: user?.phone ?? '');
  }

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _phone.dispose();
    _current.dispose();
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _saveProfile() async {
    setState(() => _savingProfile = true);
    try {
      final auth = context.read<AuthState>();
      await auth.api.updateProfile(
        name: _name.text.trim(),
        email: _email.text.trim(),
        phone: _phone.text.trim(),
      );
      await auth.applyUser(await auth.api.me());
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(AppLocalizations.of(context).profileUpdated)),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      if (mounted) setState(() => _savingProfile = false);
    }
  }

  Future<void> _savePassword() async {
    if (_password.text != _confirm.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(AppLocalizations.of(context).passwordsDoNotMatch),
        ),
      );
      return;
    }
    setState(() => _savingPassword = true);
    try {
      await context.read<AuthState>().api.changePassword(
        currentPassword: _current.text,
        password: _password.text,
      );
      if (!mounted) return;
      _current.clear();
      _password.clear();
      _confirm.clear();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(AppLocalizations.of(context).passwordChanged)),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      if (mounted) setState(() => _savingPassword = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    final l = AppLocalizations.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(l.profile)),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
        children: [
          Center(
            child: CircleAvatar(
              radius: 36,
              backgroundColor: AppColors.navy,
              child: Text(
                (auth.user?.name.isNotEmpty == true ? auth.user!.name[0] : 'A')
                    .toUpperCase(),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ),
          const SizedBox(height: 8),
          Center(
            child: Text(
              (auth.user?.roles.isNotEmpty == true)
                  ? auth.user!.roles.first
                  : l.user,
              style: const TextStyle(color: AppColors.muted),
            ),
          ),
          const SizedBox(height: 20),
          Text(
            l.account,
            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _name,
            decoration: InputDecoration(labelText: l.name),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _email,
            keyboardType: TextInputType.emailAddress,
            decoration: InputDecoration(labelText: l.email),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _phone,
            keyboardType: TextInputType.phone,
            decoration: InputDecoration(labelText: l.phone),
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _savingProfile ? null : _saveProfile,
            child: Text(_savingProfile ? l.saving : l.saveProfile),
          ),
          const SizedBox(height: 28),
          Text(
            l.changePassword,
            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _current,
            obscureText: true,
            decoration: InputDecoration(labelText: l.currentPassword),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _password,
            obscureText: true,
            decoration: InputDecoration(labelText: l.newPasswordHint),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _confirm,
            obscureText: true,
            decoration: InputDecoration(labelText: l.confirmPassword),
          ),
          const SizedBox(height: 16),
          OutlinedButton(
            onPressed: _savingPassword ? null : _savePassword,
            child: Text(_savingPassword ? l.saving : l.updatePassword),
          ),
        ],
      ),
    );
  }
}
