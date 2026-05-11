import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/employees', label: 'Nhân viên' },
  { to: '/admin/attendance', label: 'Lịch sử điểm danh' },
];

export default function AdminLayout({ children }) {
  const { admin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-blue-700 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/admin/dashboard" className="font-bold text-lg tracking-tight">
            Office Checkin — Admin
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === n.to
                    ? 'bg-white/20'
                    : 'hover:bg-white/10'
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-sm opacity-80">{admin?.username}</span>
            <button onClick={handleLogout} className="text-sm px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
              Đăng xuất
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
