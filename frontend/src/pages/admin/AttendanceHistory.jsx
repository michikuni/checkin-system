import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function AttendanceHistory() {
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ startDate: todayStr(), endDate: todayStr() });
  const limit = 50;

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ ...filters, page, limit });
      const res = await api.get(`/attendance/history?${params}`);
      setRecords(res.data.records);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchHistory();
  };

  const pages = Math.ceil(total / limit);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Lịch sử điểm danh</h2>

        <form onSubmit={handleSearch} className="card flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
            <input
              type="date"
              className="input"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
            <input
              type="date"
              className="input"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
          <button type="submit" className="btn-primary">Tìm kiếm</button>
          <p className="text-sm text-gray-500 self-center">Tổng: {total} bản ghi</p>
        </form>

        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Nhân viên', 'Mã NV', 'Cấp bậc', 'Ngày', 'Giờ checkin', 'IP', 'Thiết bị'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">Không có dữ liệu</td>
                  </tr>
                ) : records.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{r.employeeId?.fullName || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{r.employeeId?.employeeCode || '—'}</td>
                    <td className="px-4 py-3">
                      {r.employeeId?.level ? (
                        <span className="badge bg-blue-100 text-blue-700">{r.employeeId.level}</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.date}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono">
                      {new Date(r.firstCheckinAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{r.ipAddress || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs max-w-xs truncate" title={r.deviceInfo}>{r.deviceInfo?.slice(0, 40) || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">Trang {page} / {pages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-xs px-3 py-1.5">← Trước</button>
                <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className="btn-secondary text-xs px-3 py-1.5">Sau →</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
