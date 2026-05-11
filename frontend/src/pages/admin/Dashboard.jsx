import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';

function StatCard({ label, value, color }) {
  return (
    <div className={`card border-l-4 ${color}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const [todayRecords, setTodayRecords] = useState([]);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  useEffect(() => {
    Promise.all([
      api.get('/attendance/today'),
      api.get('/employees'),
    ])
      .then(([attRes, empRes]) => {
        setTodayRecords(attRes.data);
        setEmployeeCount(empRes.data.length);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const passkeyRegistered = todayRecords.filter(r => r.employeeId).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-500 text-sm mt-1">{today}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard label="Tổng nhân viên" value={employeeCount} color="border-blue-500" />
              <StatCard label="Đã checkin hôm nay" value={todayRecords.length} color="border-green-500" />
              <StatCard label="Chưa checkin" value={Math.max(0, employeeCount - todayRecords.length)} color="border-amber-500" />
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Checkin hôm nay</h3>
                <Link to="/admin/attendance" className="text-sm text-blue-600 hover:underline">
                  Xem đầy đủ →
                </Link>
              </div>
              {todayRecords.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Chưa có ai checkin hôm nay</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {todayRecords.map((r) => (
                    <div key={r._id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{r.employeeId?.fullName || '—'}</p>
                        <p className="text-xs text-gray-500">{r.employeeId?.employeeCode} · {r.employeeId?.level}</p>
                      </div>
                      <p className="text-sm text-gray-600">
                        {new Date(r.firstCheckinAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
