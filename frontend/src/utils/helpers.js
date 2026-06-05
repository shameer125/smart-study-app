import clsx from 'clsx';
export { clsx };

export const cn = (...args) => clsx(...args);

export const subjectColors = {
  CS: { ring: 'ring-indigo-500/40', dot: 'bg-indigo-500', text: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  Math: { ring: 'ring-emerald-500/40', dot: 'bg-emerald-500', text: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  History: { ring: 'ring-rose-500/40', dot: 'bg-rose-500', text: 'text-rose-500', bg: 'bg-rose-500/10' },
  Languages: { ring: 'ring-amber-500/40', dot: 'bg-amber-500', text: 'text-amber-500', bg: 'bg-amber-500/10' },
  Business: { ring: 'ring-cyan-500/40', dot: 'bg-cyan-500', text: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  Research: { ring: 'ring-violet-500/40', dot: 'bg-violet-500', text: 'text-violet-500', bg: 'bg-violet-500/10' },
  General: { ring: 'ring-slate-500/40', dot: 'bg-slate-500', text: 'text-slate-500', bg: 'bg-slate-500/10' },
};

export const colorPalette = {
  indigo: 'from-indigo-500 to-blue-500',
  emerald: 'from-emerald-500 to-teal-500',
  rose: 'from-rose-500 to-pink-500',
  amber: 'from-amber-500 to-orange-500',
  cyan: 'from-cyan-500 to-sky-500',
  violet: 'from-violet-500 to-purple-500',
  slate: 'from-slate-500 to-slate-600',
};

export const priorityStyles = {
  high: 'bg-rose-500/15 text-rose-500 ring-1 ring-rose-500/30',
  medium: 'bg-amber-500/15 text-amber-500 ring-1 ring-amber-500/30',
  low: 'bg-emerald-500/15 text-emerald-500 ring-1 ring-emerald-500/30',
};

export const statusStyles = {
  pending: 'bg-slate-500/15 text-slate-500 ring-1 ring-slate-500/30',
  'in-progress': 'bg-brand-500/15 text-brand-500 ring-1 ring-brand-500/30',
  completed: 'bg-emerald-500/15 text-emerald-500 ring-1 ring-emerald-500/30',
};

export const fmtDate = (d) => {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const fmtRelative = (d) => {
  if (!d) return '';
  const date = new Date(d);
  const diff = date - Date.now();
  const days = Math.round(diff / 86400000);
  const abs = Math.abs(days);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  if (days > 0) return `In ${abs} days`;
  return `${abs} days ago`;
};

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() || '')
    .join('') || '?';
