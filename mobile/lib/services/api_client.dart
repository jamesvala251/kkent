import 'package:dio/dio.dart';

import '../config/api_config.dart';

class ApiException implements Exception {
  ApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

class ApiClient {
  ApiClient({required this.tokenProvider, required this.onUnauthorized})
    : _dio = Dio(
        BaseOptions(
          baseUrl: ApiConfig.baseUrl,
          connectTimeout: const Duration(seconds: 20),
          receiveTimeout: const Duration(seconds: 30),
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        ),
      ) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          final token = tokenProvider();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) {
          if (error.response?.statusCode == 401) {
            onUnauthorized();
          }
          handler.next(error);
        },
      ),
    );
  }

  final Dio _dio;
  final String? Function() tokenProvider;
  final void Function() onUnauthorized;

  Future<dynamic> get(String path, {Map<String, dynamic>? query}) {
    return _send(() => _dio.get(path, queryParameters: query));
  }

  Future<dynamic> post(String path, {Object? data}) {
    return _send(() => _dio.post(path, data: data));
  }

  Future<dynamic> put(String path, {Object? data}) {
    return _send(() => _dio.put(path, data: data));
  }

  Future<dynamic> delete(String path) {
    return _send(() => _dio.delete(path));
  }

  Future<dynamic> _send(Future<Response<dynamic>> Function() request) async {
    try {
      final response = await request();
      return _unwrap(response.data);
    } on DioException catch (error) {
      throw ApiException(
        _messageFor(error),
        statusCode: error.response?.statusCode,
      );
    }
  }

  dynamic _unwrap(dynamic body) {
    if (body is Map && body['success'] == true && body.containsKey('data')) {
      return body['data'];
    }
    return body;
  }

  String _messageFor(DioException error) {
    final data = error.response?.data;
    if (data is Map) {
      final errors = data['errors'];
      if (errors is Map && errors.isNotEmpty) {
        final first = errors.values.first;
        if (first is List && first.isNotEmpty) return first.first.toString();
      }
      if (data['message'] != null) return data['message'].toString();
    }
    if (error.type == DioExceptionType.connectionError ||
        error.type == DioExceptionType.connectionTimeout) {
      return 'Cannot reach API at ${ApiConfig.baseUrl}';
    }
    return error.message ?? 'Request failed';
  }
}
