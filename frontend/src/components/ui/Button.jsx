import { motion } from 'framer-motion';
import { cn } from '../../utils/helpers';

const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
};

const Button = ({
  children,
  variant = 'primary',
  className,
  type = 'button',
  loading,
  icon: Icon,
  iconRight: IconRight,
  ...rest
}) => {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      type={type}
      className={cn(variants[variant] || variants.primary, className)}
      {...rest}
    >
      {loading ? (
        <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white 
        animate-spin" />
      ) : (
        Icon && <Icon className="w-4 h-4" />
      )}
      {children}
      {IconRight && <IconRight className="w-4 h-4" />}
    </motion.button>
  );
};

export default Button;
