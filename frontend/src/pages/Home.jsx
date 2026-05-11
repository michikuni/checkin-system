import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import api from '../services/api';

const LEVEL_COLOR = {
  Intern: 'bg-gray-100 text-gray-600',
  Junior: 'bg-green-100 text-green-700',
  Middle: 'bg-blue-100 text-blue-700',
  Senior: 'bg-purple-100 text-purple-700',
  Lead: 'bg-orange-100 text-orange-700',
  Manager: 'bg-red-100 text-red-700',
  Director: 'bg-yellow-100 text-yellow-800',
};

function EmployeeCard({ employee }) {
  const [qrData, setQrData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchQR = useCallback(async () => {
    if (!employee.hasPasskey) return;
    setRefreshing(true);
    try {
      const res = await api.get(`/employees/${employee._id}/checkin-qr`);
      setQrData(res.data);
    } catch {
      /* silently ignore */
    } finally {
      setRefreshing(false);
    }
  }, [employee._id, employee.hasPasskey]);

  useEffect(() => {
    fetchQR();
  }, [fetchQR]);

  // Auto-refresh before expiry (every 4 minutes)
  useEffect(() => {
    if (!employee.hasPasskey) return;
    const id = setInterval(fetchQR, 4 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchQR, employee.hasPasskey]);

  return (
    <div className="card flex flex-col items-center gap-4 hover:shadow-md transition-shadow">
      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
        {employee.fullName.charAt(0).toUpperCase()}
      </div>
      <div className="text-center">
        <p className="font-semibold text-gray-900">{employee.fullName}</p>
        <p className="text-xs text-gray-500 mt-0.5">{employee.employeeCode}</p>
        {employee.level && (
          <span className={`badge mt-1 ${LEVEL_COLOR[employee.level] || 'bg-gray-100 text-gray-600'}`}>
            {employee.level}
          </span>
        )}
      </div>

      <div className="w-full border-t border-gray-100 pt-4 flex flex-col items-center gap-2">
        {employee.hasPasskey && qrData ? (
          <>
            <QRCodeSVG value={qrData.url} size={160} level="M" />
            <p className="text-xs text-gray-400">Scan để checkin</p>
            <button
              onClick={fetchQR}
              disabled={refreshing}
              className="text-xs text-blue-600 hover:underline disabled:opacity-50"
            >
              {refreshing ? 'Đang tải...' : 'Làm mới QR'}
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 py-4">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="text-xs text-gray-400 text-center">Chưa đăng ký passkey</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/employees')
      .then((res) => setEmployees(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = employees.filter(
    (e) =>
      e.fullName.toLowerCase().includes(search.toLowerCase()) ||
      e.employeeCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Office Checkin</h1>
            <p className="text-xs text-gray-500">Scan QR để điểm danh</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Tìm nhân viên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input max-w-xs"
            />
            <Link to="/admin/login" className="btn-secondary text-sm whitespace-nowrap">
              Admin
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <p className="text-lg">Không tìm thấy nhân viên</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filtered.map((emp) => (
              <EmployeeCard key={emp._id} employee={emp} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
