typedef JsonMap = Map<String, dynamic>;

JsonMap asMap(dynamic value) {
  if (value is Map<String, dynamic>) {
    return _unwrapRecord(value);
  }
  if (value is Map) {
    return _unwrapRecord(value.map((key, item) => MapEntry('$key', item)));
  }
  return {};
}

JsonMap _unwrapRecord(JsonMap map) {
  final nested = map['data'];
  if (map['id'] == null && nested is Map && nested['id'] != null) {
    return asMap(nested);
  }
  return map;
}

List<dynamic> asList(dynamic value) {
  if (value is List) return value;
  if (value is Map && value['data'] is List) return value['data'] as List;
  return const [];
}

num? asNum(dynamic value) {
  if (value == null || value == '') return null;
  if (value is num) return value;
  return num.tryParse(value.toString());
}

double asDouble(dynamic value, [double fallback = 0]) {
  return asNum(value)?.toDouble() ?? fallback;
}

int asInt(dynamic value, [int fallback = 0]) {
  return asNum(value)?.toInt() ?? fallback;
}

String asString(dynamic value, [String fallback = '']) {
  if (value == null) return fallback;
  return value.toString();
}

bool asBool(dynamic value, [bool fallback = false]) {
  if (value is bool) return value;
  if (value == 1 || value == '1' || value == 'true') return true;
  if (value == 0 || value == '0' || value == 'false') return false;
  return fallback;
}
