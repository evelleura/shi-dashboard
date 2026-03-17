import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export default function Layout({ children }: Props) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems =
    user?.role === 'technician'
      ? [{ to: '/report', label: 'Submit Report', icon: '📝' }]
      : [
          { to: '/dashboard', label: 'Dashboard', icon: '📊' },
          { to: '/projects', label: 'Projects', icon: '📁' },
        ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-6">
              <span className="font-bold text-blue-600 text-base">SHI Dashboard</span>
              <div className="hidden sm:flex gap-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                        isActive ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`
                    }
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 hidden sm:block">
                {user?.name} ({user?.role})
              </span>
              <button
                onClick={handleLogout}
                className="text-xs text-gray-500 hover:text-red-600 transition-colors px-2 py-1 rounded"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
