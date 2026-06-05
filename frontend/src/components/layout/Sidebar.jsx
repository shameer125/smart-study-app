import { NavLink, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineHome,
  HiOutlineClipboardList,
  HiOutlineCalendar,
  HiOutlineDocumentText,
  HiOutlineSparkles,
  HiOutlineClock,
  HiOutlineCog,
  HiOutlineUser,
  HiOutlineLogout,
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import { initials } from '../../utils/helpers';

const nav = [
  { to: '/', label: 'Dashboard', icon: HiOutlineHome, end: true },
  { to: '/tasks', label: 'Tasks', icon: HiOutlineClipboardList },
  { to: '/calendar', label: 'Calendar', icon: HiOutlineCalendar },
  { to: '/notes', label: 'Notes', icon: HiOutlineDocumentText },
  { to: '/ai', label: 'AI Assistant', icon: HiOutlineSparkles, glow: true },
  { to: '/focus', label: 'Focus Mode', icon: HiOutlineClock },
];

const bottom = [
  { to: '/profile', label: 'Profile', icon: HiOutlineUser },
  { to: '/settings', label: 'Settings', icon: HiOutlineCog },
];

const Sidebar = ({ open, onClose }) => {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-30"
          onClick={onClose}
        />
      )}
      <motion.aside
        initial={false}
        className={`fixed lg:sticky top-0 left-0 h-screen z-40 w-72 shrink-0 transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-full m-3 lg:ml-3 lg:mr-0 lg:my-3 glass-strong rounded-3xl flex flex-col overflow-hidden">
          <Link
            to="/"
            className="flex items-center gap-2.5 px-5 pt-6 pb-5"
            onClick={onClose}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-aurora bg-[length:200%_200%] animate-gradient-x flex items-center justify-center shadow-glow">
              <HiOutlineSparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-display font-bold text-lg leading-tight">
                Smart<span className="gradient-text">Study</span>
              </div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                Plan · Focus · Learn
              </div>
            </div>
          </Link>

          <nav className="px-3 flex-1 space-y-1 overflow-y-auto no-scrollbar">
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400 px-3 mt-1 mb-2">
              Workspace
            </div>
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
                {item.glow && (
                  <span className="ml-auto text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-gradient-to-r from-brand-500 to-fuchsia-500 text-white">
                    AI
                  </span>
                )}
              </NavLink>
            ))}

            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400 px-3 mt-6 mb-2">
              Account
            </div>
            {bottom.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Pro card */}
          <div className="px-3 pb-3">
            <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-brand-600 via-fuchsia-600 to-pink-600 text-white shadow-glow">
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
              <div className="text-xs uppercase tracking-wider opacity-80">Streak</div>
              <div className="text-2xl font-display font-bold mt-1">
                {user?.streak?.current ?? 0} days
              </div>
              <div className="text-xs opacity-80 mt-0.5">
                Best: {user?.streak?.best ?? 0} · keep going!
              </div>
            </div>
          </div>

          {/* User */}
          <div className="m-3 mt-0 px-3 py-3 rounded-2xl border border-white/30 dark:border-white/5 bg-white/40 dark:bg-slate-900/40 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-fuchsia-500 text-white font-semibold flex items-center justify-center">
              {initials(user?.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{user?.name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {user?.email}
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-2 rounded-lg text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition"
            >
              <HiOutlineLogout className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
