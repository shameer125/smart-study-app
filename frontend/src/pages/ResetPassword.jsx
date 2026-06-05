import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineLockClosed,
  HiOutlineMail,
  HiOutlineKey,
  HiOutlineArrowRight,
} from 'react-icons/hi';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import CodeInput from '../components/ui/CodeInput';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const ResetPassword = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { updateUser } = useAuth();
  const [form, setForm] = useState({
    email: location.state?.email || '',
    code: '',
    password: '',
    confirm: '',
  });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.code.length !== 6) return toast.error('Enter the 6-digit code');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      const data = await authService.resetPassword({
        email: form.email,
        code: form.code,
        password: form.password,
      });
      if (data.token) {
        localStorage.setItem('ss_token', data.token);
        localStorage.setItem('ss_user', JSON.stringify(data.user));
        updateUser(data.user);
      }
      toast.success('Password reset! Welcome back.');
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!form.email) return toast.error('Enter your email first');
    try {
      await authService.forgotPassword(form.email);
      toast.success('A fresh code is on its way');
    } catch {
      toast.error('Could not resend');
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
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-brand-500 via-fuchsia-500 to-pink-500 flex items-center justify-center shadow-glow">
            <HiOutlineLockClosed className="w-7 h-7 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-display font-bold text-center text-balance">
          Set a new password
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center">
          Enter the code we emailed and choose a new password.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Input
            label="Email"
            type="email"
            icon={HiOutlineMail}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <div>
            <div className="mb-2 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-center">
              6-digit code
            </div>
            <CodeInput value={form.code} onChange={(v) => setForm({ ...form, code: v })} />
          </div>
          <Input
            label="New password"
            type="password"
            icon={HiOutlineKey}
            placeholder="At least 6 characters"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <Input
            label="Confirm password"
            type="password"
            icon={HiOutlineKey}
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            required
          />
          <Button
            type="submit"
            loading={loading}
            iconRight={HiOutlineArrowRight}
            className="w-full"
          >
            Reset password
          </Button>
        </form>

        <div className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
          Didn't get it?{' '}
          <button onClick={resend} className="text-brand-500 font-semibold hover:underline">
            Resend code
          </button>
        </div>

        <p className="mt-3 text-center text-sm text-slate-500 dark:text-slate-400">
          <Link to="/login" className="text-brand-500 font-semibold hover:underline">
            Back to sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
