import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';

const LEVELS = ['', 'Intern', 'Junior', 'Middle', 'Senior', 'Lead', 'Manager', 'Director'];

const EMPTY_FORM = { fullName: '', employeeCode: '', department: '', role: '', level: '' };

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function QRModal({ qrData, onClose }) {
  return (
    <Modal title="QR Đăng ký Passkey" onClose={onClose}>
      <div className="text-center space-y-4">
        <img src={qrData.qrDataURL} alt="QR Register" className="mx-auto w-48 h-48" />
        <p className="text-sm text-gray-500">
          Nhân viên scan QR này để đăng ký passkey.<br />
          Hết hạn sau {Math.floor(qrData.expiresIn / 60)} phút.
        </p>
        <p className="text-xs text-gray-400 break-all">{qrData.url}</p>
        <button onClick={onClose} className="btn-secondary w-full">Đóng</button>
      </div>
    </Modal>
  );
}

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [qrModal, setQrModal] = useState(null);
  const [search, setSearch] = useState('');

  const fetchEmployees = () => {
    setLoading(true);
    api.get('/employees')
      .then((res) => setEmployees(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEmployees(); }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setError('');
  };

  const openEdit = (emp) => {
    setEditTarget(emp);
    setForm({ fullName: emp.fullName, employeeCode: emp.employeeCode, department: emp.department || '', role: emp.role || '', level: emp.level || '' });
    setError('');
  };

  const closeForm = () => { setEditTarget(undefined); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editTarget) {
        await api.put(`/employees/${editTarget._id}`, form);
      } else {
        await api.post('/employees', form);
      }
      fetchEmployees();
      setEditTarget(undefined);
    } catch (err) {
      setError(err?.response?.data?.error || 'Lỗi lưu dữ liệu');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (emp) => {
    if (!window.confirm(`Xóa nhân viên "${emp.fullName}"?`)) return;
    try {
      await api.delete(`/employees/${emp._id}`);
      fetchEmployees();
    } catch (err) {
      alert(err?.response?.data?.error || 'Lỗi xóa nhân viên');
    }
  };

  const handleDeletePasskey = async (emp) => {
    if (!window.confirm(`Xóa passkey của "${emp.fullName}"?`)) return;
    try {
      await api.delete(`/employees/${emp._id}/passkey`);
      fetchEmployees();
    } catch (err) {
      alert(err?.response?.data?.error || 'Lỗi xóa passkey');
    }
  };

  const handleGenerateRegisterQR = async (emp) => {
    try {
      const res = await api.post(`/employees/${emp._id}/generate-register-qr`);
      setQrModal(res.data);
    } catch (err) {
      alert(err?.response?.data?.error || 'Lỗi tạo QR');
    }
  };

  const showForm = editTarget !== undefined;
  const filtered = employees.filter(
    (e) => e.fullName.toLowerCase().includes(search.toLowerCase()) || e.employeeCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-gray-900">Quản lý nhân viên</h2>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input max-w-xs"
            />
            <button onClick={openCreate} className="btn-primary whitespace-nowrap">
              + Thêm nhân viên
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Nhân viên', 'Mã NV', 'Phòng ban', 'Chức vụ', 'Cấp bậc', 'Passkey', 'Thao tác'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((emp) => (
                    <tr key={emp._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{emp.fullName}</td>
                      <td className="px-4 py-3 text-gray-600">{emp.employeeCode}</td>
                      <td className="px-4 py-3 text-gray-600">{emp.department || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{emp.role || '—'}</td>
                      <td className="px-4 py-3">
                        {emp.level ? (
                          <span className="badge bg-blue-100 text-blue-700">{emp.level}</span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {emp.hasPasskey ? (
                          <span className="badge bg-green-100 text-green-700">Đã đăng ký</span>
                        ) : (
                          <span className="badge bg-gray-100 text-gray-500">Chưa có</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button onClick={() => openEdit(emp)} className="text-blue-600 hover:underline text-xs">Sửa</button>
                          <button onClick={() => handleGenerateRegisterQR(emp)} className="text-purple-600 hover:underline text-xs">
                            {emp.hasPasskey ? 'Đổi passkey' : 'Tạo QR đăng ký'}
                          </button>
                          {emp.hasPasskey && (
                            <button onClick={() => handleDeletePasskey(emp)} className="text-orange-600 hover:underline text-xs">Xóa passkey</button>
                          )}
                          <button onClick={() => handleDelete(emp)} className="text-red-600 hover:underline text-xs">Xóa</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-400">Không có nhân viên nào</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <Modal title={editTarget ? 'Sửa nhân viên' : 'Thêm nhân viên'} onClose={closeForm}>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên *</label>
              <input className="input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã nhân viên *</label>
              <input className="input" value={form.employeeCode} onChange={(e) => setForm({ ...form, employeeCode: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phòng ban</label>
              <input className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chức vụ</label>
              <input className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cấp bậc</label>
              <select className="input" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                {LEVELS.map((l) => <option key={l} value={l}>{l || '— Chọn cấp bậc —'}</option>)}
              </select>
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
              <button type="button" onClick={closeForm} className="btn-secondary flex-1">Hủy</button>
            </div>
          </form>
        </Modal>
      )}

      {qrModal && <QRModal qrData={qrModal} onClose={() => setQrModal(null)} />}
    </AdminLayout>
  );
}
