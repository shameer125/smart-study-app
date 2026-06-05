import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineMail, HiOutlineArrowRight, HiOutlineLockOpen } from 'react-icons/hi';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { authService } from '../services/authService';
import { useToast } from '../context/ToastContext';

const ForgotPassword = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      toast.success('Check your email for a reset code');
      navigate('/reset-password', { state: { email } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-20 left-10 w-72 h-72 bg-fuchsia-500/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-brand-500/20 rounded-full blur-3xl animate-float" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md glass-strong rounded-3xl p-8"
      >
        <div className="flex items-center justify-center mb-5">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-fuchsia-500 to-pink-500 flex items-center justify-center shadow-glow">
            <HiOutlineLockOpen className="w-7 h-7 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-display font-bold text-center text-balance">
          Forgot your password?
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center">
          Enter your email and we'll send you a 6-digit reset code.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Input
            label="Email"
            type="email"
            icon={HiOutlineMail}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button
            type="submit"
            loading={loading}
            iconRight={HiOutlineArrowRight}
            className="w-full"
          >
            Send reset code
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Remembered it?{' '}
          <Link to="/login" className="text-brand-500 font-semibold hover:underline">
            Back to sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
