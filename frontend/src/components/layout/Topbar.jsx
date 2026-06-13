import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineSearch,
  HiOutlineBell,
  HiOutlineMenu,
  HiOutlineMoon,
  HiOutlineSun,
  HiOutlineLogout,
  HiOutlineUser,
  HiOutlineCog,
} from 'react-icons/hi';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { initials } from '../../utils/helpers';

const Topbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(false);
  const [openNotif, setOpenNotif] = useState(false);
  const [query, setQuery] = useState('');
  const menuRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setOpenNotif(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate(`/tasks?search=${encodeURIComponent(q)}`);
  };

  const notifications = [
    { id: 1, text: 'You have 3 tasks due tomorrow', tone: 'amber' },
    { id: 2, text: 'AI summarized your latest note', tone: 'brand' },
    { id: 3, text: 'Streak milestone: 5 days unlocked!', tone: 'emerald' },
  ];

  return (
    <header className="sticky top-0 z-20 px-3 pt-3">
      <div className="glass-strong rounded-2xl px-3 sm:px-5 py-2.5 flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800/60"
        >
          <HiOutlineMenu className="w-5 h-5" />
        </button>

        <form onSubmit={onSearch} className="flex-1 max-w-xl relative">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, notes, subjects…"
            className="w-full pl-9 pr-3 py-2 bg-slate-100/70 dark:bg-slate-800/60 rounded-xl text-sm 
            placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 border border-transparent 
            focus:border-brand-500/40 transition"
          />
          <div className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 text-[10px] gap-1 text-slate-400">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700/60 font-mono">⌘</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700/60 font-mono">K</kbd>
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={toggle}
            className="p-2 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={theme}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                {theme === 'dark' ? (
                  <HiOutlineSun className="w-5 h-5 text-amber-400" />
                ) : (
                  <HiOutlineMoon className="w-5 h-5 text-slate-700" />
                )}
              </motion.div>
            </AnimatePresence>
          </button>

          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setOpenNotif((o) => !o)}
              className="relative p-2 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition"
            >
              <HiOutlineBell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white 
              dark:ring-slate-900" />
            </button>
            <AnimatePresence>
              {openNotif && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-80 glass-strong rounded-2xl p-2 z-50"
                >
                  <div className="px-3 py-2 text-xs font-semibold tracking-wider uppercase text-slate-500">
                    Notifications
                  </div>
                  <div className="space-y-1">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-100/70 dark:hover:bg-slate-800/60 
                        transition cursor-pointer"
                      >
                        <div
                          className={`mt-1 w-2 h-2 rounded-full ${
                            n.tone === 'amber'
                              ? 'bg-amber-500'
                              : n.tone === 'emerald'
                              ? 'bg-emerald-500'
                              : 'bg-brand-500'
                          }`}
                        />
                        <div className="text-sm">{n.text}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setOpenMenu((o) => !o)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-fuchsia-500 text-white text-sm font-semibold flex 
              items-center justify-center">
                {initials(user?.name)}
              </div>
              <span className="hidden sm:block text-sm font-medium">{user?.name?.split(' ')[0]}</span>
            </button>
            <AnimatePresence>
              {openMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 glass-strong rounded-2xl p-2 z-50"
                >
                  <div className="px-3 py-2 border-b border-white/30 dark:border-white/5 mb-1">
                    <div className="text-sm font-semibold">{user?.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {user?.email}
                    </div>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setOpenMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100/70 
                    dark:hover:bg-slate-800/60 text-sm"
                  >
                    <HiOutlineUser className="w-4 h-4" /> Profile
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setOpenMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100/70 
                    dark:hover:bg-slate-800/60 text-sm"
                  >
                    <HiOutlineCog className="w-4 h-4" /> Settings
                  </Link>
                  <button
                    onClick={() => {
                      setOpenMenu(false);
                      logout();
                      navigate('/login');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-rose-500/10 
                    text-sm text-rose-500"
                  >
                    <HiOutlineLogout className="w-4 h-4" /> Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
