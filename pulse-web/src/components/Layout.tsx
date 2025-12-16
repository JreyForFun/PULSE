import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, FilePlus, Settings, Menu, AlertTriangle, FileText, ClipboardList, LogOut, TrendingUp, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { settingsService } from '../services/settingsService';

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [barangayName, setBarangayName] = useState('Brgy. Santa Rosa');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, signOut, role } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    settingsService.getSettings().then(s => {
      if (s?.barangay_name) setBarangayName(s.barangay_name);
    });

    // Close dropdown on click outside
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
    { icon: Users, label: 'Residents', path: '/dashboard/residents' },
    { icon: TrendingUp, label: 'Risk Prioritization', path: '/dashboard/risk-prioritization' },
    { icon: ClipboardList, label: 'Visits', path: '/dashboard/visits' },
    { icon: FileText, label: 'Reports', path: '/dashboard/reports' },
    { icon: FilePlus, label: 'Register', path: '/dashboard/residents/add' },
    ...(role === 'admin' ? [{ icon: Settings, label: 'Settings', path: '/dashboard/settings' }] : []),
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">PULSE</span>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/dashboard'}
                onClick={() => setIsSidebarOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                `}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-100">
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-800 leading-tight">
                  <span className="font-bold">Disclaimer:</span> Prioritization tool only. Not for diagnosis.
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">

        {/* Top Navigation Bar */}
        <header className="bg-white border-b border-gray-200 h-16 px-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-900 leading-none">{barangayName}</span>
              <span className="text-xs text-gray-500">Health Station Dashboard</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 hover:bg-gray-50 p-1.5 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs ring-2 ring-white">
                  {user?.email?.substring(0, 2).toUpperCase() || 'BH'}
                </div>
                <div className="hidden md:block text-left mr-1">
                  <p className="text-sm font-medium text-gray-700 leading-none">{user?.email?.split('@')[0]}</p>
                  <p className="text-xs text-gray-500 uppercase">{role === 'admin' ? 'Administrator' : 'Health Worker'}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="px-4 py-2 border-b border-gray-50 md:hidden">
                    <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
                    <p className="text-xs text-gray-500 capitalize">{role}</p>
                  </div>

                  {role === 'admin' && (
                    <button
                      onClick={() => {
                        navigate('/dashboard/settings');
                        setIsProfileOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4" /> Settings
                    </button>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 w-full bg-gray-50">
          <div className="max-w-7xl mx-auto pb-safe">
            <Outlet />
          </div>
        </main>
      </div>

    </div>
  );
}
