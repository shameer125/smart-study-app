import { cn } from '../../utils/helpers';

export const Input = ({ label, error, className, icon: Icon, ...rest }) => (
  <label className="block">
    {label && (
      <div className="mb-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
        {label}
      </div>
    )}

    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      )}
      <input
        {...rest}
        className={cn('input', Icon && 'pl-9', error && 'border-rose-500/60 focus:ring-rose-500/40', className)}
      />
    </div>
    {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
  </label>
);

export const Textarea = ({ label, error, className, rows = 4, ...rest }) => (
  <label className="block">
    {label && (
      <div className="mb-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
        {label}
      </div>
    )}
    <textarea
      rows={rows}
      {...rest}
      className={cn('textarea', error && 'border-rose-500/60 focus:ring-rose-500/40', className)}
    />
    {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
  </label>

);

export const Select = ({ label, children, className, ...rest }) => (
  <label className="block">
    {label && (
      <div className="mb-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
        {label}
      </div>
    )}
    <select {...rest} className={cn('select', className)}>
      {children}
    </select>
  </label>
  
);

export default Input;
