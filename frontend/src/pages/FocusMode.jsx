import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlinePlay,
  HiOutlinePause,
  HiOutlineRefresh,
  HiOutlineCog,
  HiOutlineFastForward,
} from 'react-icons/hi';

import PageHeader from '../components/ui/PageHeader';
import { statsService } from '../services/statsService';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const MODES = {
  focus: { label: 'Focus', color: 'from-brand-500 via-fuchsia-500 to-pink-500' },
  'short-break': { label: 'Short Break', color: 'from-emerald-500 to-teal-500' },
  'long-break': { label: 'Long Break', color: 'from-amber-500 to-orange-500' },
};

const fmt = (s) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

const FocusMode = () => {
  const toast = useToast();
  const { user, updateUser } = useAuth();

  const pref = user?.preferences?.pomodoro || { focusMinutes: 25, shortBreak: 5, longBreak: 15 };
  const [durations, setDurations] = useState({
    focus: pref.focusMinutes * 60,
    'short-break': pref.shortBreak * 60,
    'long-break': pref.longBreak * 60,
  });
  const [mode, setMode] = useState('focus');
  const [seconds, setSeconds] = useState(durations.focus);
  const [running, setRunning] = useState(false);
  const [cycles, setCycles] = useState(0);
  const [subject, setSubject] = useState('General');
  const [openSettings, setOpenSettings] = useState(false);
  const tickRef = useRef();

  // Sync seconds when mode/durations change
  useEffect(() => {
    setSeconds(durations[mode]);
  }, [mode, durations]);

  useEffect(() => {
    if (!running) {
      clearInterval(tickRef.current);
      return;
    }
    tickRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(tickRef.current);
          handleComplete();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, [running]); // eslint-disable-line

  const handleComplete = async () => {
    setRunning(false);
    if (mode === 'focus') {
      try {
        const { streak } = await statsService.logFocus({
          subject,
          durationMinutes: Math.round(durations.focus / 60),
          type: 'focus',
        });
        if (streak) updateUser({ streak });
        toast.success('Focus session logged! 🎉');
      } catch {
        // best-effort
      }
      const next = cycles + 1;
      setCycles(next);
      setMode(next % 4 === 0 ? 'long-break' : 'short-break');
    } else {
      toast.info('Break over — time to focus!');
      setMode('focus');
    }
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Smart Study', { body: `${MODES[mode].label} complete!` });
    }
  };

  const total = durations[mode];
  const progress = ((total - seconds) / total) * 100;

  const skip = () => {
    if (!confirm('Skip current session?')) return;
    setSeconds(0);
    handleComplete();
  };

  const reset = () => {
    setRunning(false);
    setSeconds(durations[mode]);
  };

  const askPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  useEffect(() => {
    askPermission();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Focus Mode"
        title="Pomodoro Timer"
        description="Deep work in 25/5 sprints. Stay in the zone."
        actions={
          <button onClick={() => setOpenSettings(true)} className="btn-secondary">
            <HiOutlineCog className="w-4 h-4" /> Settings
          </button>
        }
      />

      <div className="relative card p-8 sm:p-12 overflow-hidden">
        {/* Background glow */}
        <motion.div
          animate={{ scale: running ? [1, 1.1, 1] : 1 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute inset-0 opacity-20 blur-3xl bg-gradient-to-br ${MODES[mode].color}`}
        />

        <div className="relative flex items-center justify-center gap-2 mb-6 flex-wrap">
          {Object.entries(MODES).map(([k, v]) => (
            <button
              key={k}
              onClick={() => setMode(k)}
              className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition ${
                mode === k
                  ? `text-white bg-gradient-to-r ${v.color} shadow`
                  : 'text-slate-500 bg-slate-100/70 dark:bg-slate-800/60 hover:bg-slate-200/70'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Timer ring */}
        <div className="relative mx-auto w-72 h-72 sm:w-80 sm:h-80">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="timerGrad" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-slate-200 dark:text-slate-700"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="url(#timerGrad)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={283}
              strokeDashoffset={283 - (283 * progress) / 100}
              transition={{ duration: 0.4 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-[11px] font-bold tracking-[0.2em] uppercase text-brand-500"
              >
                {MODES[mode].label}
              </motion.div>
            </AnimatePresence>
            <div className="text-6xl sm:text-7xl font-display font-bold tabular-nums mt-1">
              {fmt(seconds)}
            </div>
            <div className="text-xs text-slate-400 mt-2">
              Cycle {cycles} · {subject}
            </div>
          </div>
        </div>

        <div className="relative flex items-center justify-center gap-3 mt-8">
          <button
            onClick={reset}
            className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 
            dark:hover:bg-slate-700 transition flex items-center justify-center text-slate-500"
            title="Reset"
          >
            <HiOutlineRefresh className="w-5 h-5" />
          </button>
          <motion.button
            onClick={() => setRunning((r) => !r)}
            whileTap={{ scale: 0.95 }}
            className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-500 via-fuchsia-500 
            to-pink-500 text-white shadow-glow-lg flex items-center justify-center"
            title={running ? 'Pause' : 'Start'}
          >
            {running ? (
              <HiOutlinePause className="w-8 h-8" />
            ) : (
              <HiOutlinePlay className="w-8 h-8 translate-x-0.5" />
            )}
          </motion.button>
          <button
            onClick={skip}
            className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 
            dark:hover:bg-slate-700 transition flex items-center justify-center text-slate-500"
            title="Skip"
          >
            <HiOutlineFastForward className="w-5 h-5" />
          </button>
        </div>

        <div className="relative mt-8 max-w-md mx-auto">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Studying
          </label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full mt-1.5 bg-transparent text-center text-lg font-semibold focus:outline-none 
            border-b border-slate-300 dark:border-slate-600 focus:border-brand-500 transition pb-1"
          />
        </div>
      </div>

      {openSettings && (
        <SettingsPanel
          durations={durations}
          onClose={() => setOpenSettings(false)}
          onSave={(d) => {
            setDurations(d);
            setOpenSettings(false);
            toast.success('Pomodoro settings updated');
          }}
        />
      )}
    </div>
  );
};

const SettingsPanel = ({ durations, onSave, onClose }) => {
  const [local, setLocal] = useState({
    focusMinutes: Math.round(durations.focus / 60),
    shortBreak: Math.round(durations['short-break'] / 60),
    longBreak: Math.round(durations['long-break'] / 60),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative glass-strong rounded-3xl p-6 w-full max-w-sm"
      >
        <h3 className="font-display font-semibold text-lg mb-4">Timer settings</h3>
        {[
          { key: 'focusMinutes', label: 'Focus (minutes)' },
          { key: 'shortBreak', label: 'Short break (minutes)' },
          { key: 'longBreak', label: 'Long break (minutes)' },
        ].map(({ key, label }) => (
          <label key={key} className="block mb-3">
            <div className="text-xs uppercase font-semibold text-slate-500 mb-1">{label}</div>
            <input
              type="number"
              min={1}
              max={180}
              value={local[key]}
              onChange={(e) => setLocal({ ...local, [key]: Number(e.target.value) })}
              className="input"
            />
          </label>
        ))}
        <div className="flex justify-end gap-2 mt-4">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={() =>
              onSave({
                focus: local.focusMinutes * 60,
                'short-break': local.shortBreak * 60,
                'long-break': local.longBreak * 60,
              })
            }
          >
            Save
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default FocusMode;
