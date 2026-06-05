import { motion } from 'framer-motion';

const EmptyState = ({ icon: Icon, title, description, action }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="card p-10 flex flex-col items-center text-center"
  >
    {Icon && (
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500/20 via-fuchsia-500/20 to-pink-500/20 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-brand-500" />
      </div>
    )}
    <h3 className="text-lg font-display font-semibold text-slate-900 dark:text-white">{title}</h3>
    {description && (
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">{description}</p>
    )}
    {action && <div className="mt-5">{action}</div>}
  </motion.div>
);

export default EmptyState;
