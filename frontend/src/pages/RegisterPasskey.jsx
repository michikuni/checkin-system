import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { usePasskeyRegister } from '../hooks/useWebAuthn';

export default function RegisterPasskey() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const { register, status, message } = usePasskeyRegister();
  const [started, setStarted] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card max-w-sm w-full text-center">
          <p className="text-red-600 font-medium">Link không hợp lệ</p>
          <p className="text-sm text-gray-500 mt-2">Yêu cầu admin tạo lại QR đăng ký.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50 p-4">
      <div className="card max-w-sm w-full text-center space-y-6">
        <div>
          <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Đăng ký Passkey</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sử dụng FaceID hoặc Fingerprint của thiết bị này
          </p>
        </div>

        {status === 'idle' && !started && (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-xl p-4 text-left space-y-2 text-sm text-gray-600">
              <p className="font-medium text-gray-800">Hướng dẫn:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Nhấn nút bên dưới để bắt đầu</li>
                <li>Thiết bị sẽ yêu cầu FaceID / Fingerprint</li>
                <li>Xác nhận để hoàn tất đăng ký</li>
              </ul>
            </div>
            <button
              onClick={() => { setStarted(true); register(token); }}
              className="btn-primary w-full text-base py-3"
            >
              Đăng ký Passkey
            </button>
          </div>
        )}

        {status === 'loading' && (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto" />
            <p className="text-gray-600">Đang chờ xác nhận FaceID / Fingerprint...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-green-600 font-semibold text-lg">Đăng ký thành công!</p>
              <p className="text-sm text-gray-500 mt-1">{message}</p>
            </div>
            <p className="text-sm text-gray-500">
              Bạn có thể đóng trang này. Khi cần checkin, scan QR trên trang chủ.
            </p>
            <Link to="/" className="btn-primary w-full">Về trang chủ</Link>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-red-600 font-medium">{message}</p>
            <button
              onClick={() => register(token)}
              className="btn-primary w-full"
            >
              Thử lại
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
