import { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HiCheckCircle, HiXCircle, HiInformationCircle, HiX } from 'react-icons/hi';

const ToastContext = createContext({ toast: () => {} });

let idCounter = 0;

const variants = {
  success: {
    icon: HiCheckCircle,
    accent: 'from-emerald-500 to-teal-500',
    ring: 'ring-emerald-400/40',
  },
  error: {
    icon: HiXCircle,
    accent: 'from-rose-500 to-pink-600',
    ring: 'ring-rose-400/40',
  },
  info: {
    icon: HiInformationCircle,
    accent: 'from-brand-500 to-fuchsia-500',
    ring: 'ring-brand-400/40',
  },
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (message, type = 'info', duration = 3500) => {
      const id = ++idCounter;
      setToasts((t) => [...t, { id, message, type }]);
      if (duration) setTimeout(() => remove(id), duration);
      return id;
    },
    [remove]
  );

  const toast = {
    success: (m, d) => push(m, 'success', d),
    error: (m, d) => push(m, 'error', d),
    info: (m, d) => push(m, 'info', d),
  };

  return (
    <ToastContext.Provider value={{ toast, removeToast: remove }}>
      {children}
      <div className="pointer-events-none fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm">
        <AnimatePresence>
          {toasts.map((t) => {
            const v = variants[t.type] || variants.info;
            const Icon = v.icon;
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 60, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                className={`pointer-events-auto glass-strong rounded-2xl px-4 py-3 flex items-start gap-3 ring-1 ${v.ring}`}
              >
                <div
                  className={`shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br ${v.accent} flex items-center justify-center text-white shadow-lg`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 text-sm text-slate-700 dark:text-slate-200 pt-1">
                  {t.message}
                </div>
                <button
                  onClick={() => remove(t.id)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                >
                  <HiX className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext).toast;
