import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { usePasskeyAuth } from '../hooks/useWebAuthn';

function StatusIcon({ status }) {
  if (status === 'success') {
    return (
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
        <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto">
        <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    );
  }
  if (status === 'loading') {
    return (
      <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mx-auto">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }
  return (
    <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
      <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    </div>
  );
}

export default function CheckinPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const { authenticate, status, message, result } = usePasskeyAuth();
  const [autoStarted, setAutoStarted] = useState(false);

  useEffect(() => {
    if (token && !autoStarted) {
      setAutoStarted(true);
      authenticate(token);
    }
  }, [token, autoStarted, authenticate]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card max-w-sm w-full text-center">
          <p className="text-red-600 font-medium">Token không hợp lệ</p>
          <p className="text-sm text-gray-500 mt-2">Vui lòng scan lại QR code.</p>
          <Link to="/" className="btn-primary mt-4 w-full">Về trang chủ</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="card max-w-sm w-full text-center space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Điểm danh</h1>
          <p className="text-sm text-gray-500 mt-1">Office Checkin System</p>
        </div>

        <StatusIcon status={status} />

        <div>
          {status === 'idle' && (
            <p className="text-gray-600">Đang chuẩn bị xác thực...</p>
          )}
          {status === 'loading' && (
            <p className="text-gray-600 font-medium">Đang xác thực FaceID / Fingerprint...</p>
          )}
          {status === 'success' && (
            <div className="space-y-2">
              <p className="text-green-600 font-semibold text-lg">
                {result?.alreadyCheckedIn ? 'Đã điểm danh hôm nay' : 'Điểm danh thành công!'}
              </p>
              {result?.employee && (
                <div className="bg-green-50 rounded-xl p-4 space-y-1">
                  <p className="font-semibold text-gray-900">{result.employee.fullName}</p>
                  <p className="text-sm text-gray-500">{result.employee.employeeCode} · {result.employee.level}</p>
                </div>
              )}
              <p className="text-sm text-gray-500">{message}</p>
            </div>
          )}
          {status === 'error' && (
            <div className="space-y-3">
              <p className="text-red-600 font-medium">{message}</p>
              <button
                onClick={() => authenticate(token)}
                className="btn-primary w-full"
              >
                Thử lại
              </button>
            </div>
          )}
        </div>

        <Link to="/" className="text-sm text-blue-600 hover:underline block">
          ← Về trang chủ
        </Link>
      </div>
    </div>
  );
}
