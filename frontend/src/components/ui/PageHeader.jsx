import { motion } from 'framer-motion';

const PageHeader = ({ eyebrow, title, description, actions }) => (
  <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {eyebrow && (
        <div className="text-xs font-semibold tracking-[0.18em] uppercase text-brand-500
        mb-1.5">
          {eyebrow}
        </div>
      )}
      <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900 
      dark:text-white">
        {title}
      </h1>
      {description && (
        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1 
        max-w-2xl">
          {description}
        </p>
      )}
    </motion.div>
    {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
  </div>
);

export default PageHeader;
