import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:kkent_admin/app.dart';

void main() {
  testWidgets('App boots to a loading gate', (tester) async {
    await tester.pumpWidget(const KkentApp());
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });
}
