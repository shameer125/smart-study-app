import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineMail, HiOutlineSparkles, HiOutlineArrowRight } from 'react-icons/hi';
import Button from '../components/ui/Button';
import CodeInput from '../components/ui/CodeInput';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const VerifyEmail = () => {
  const { user, updateUser, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const stateEmail = location.state?.email;
  const email = stateEmail || user?.email || '';
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!email) navigate('/login', { replace: true });
  }, [email, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  if (user?.isVerified) return <Navigate to="/" replace />;

  const onSubmit = async (e) => {
    e?.preventDefault?.();
    if (code.length !== 6) return toast.error('Enter the 6-digit code');
    setLoading(true);
    try {
      const data = await authService.verifyEmail({ email, code });
      if (data.token) {
        localStorage.setItem('ss_token', data.token);
        localStorage.setItem('ss_user', JSON.stringify(data.user));
      }
      updateUser(data.user);
      toast.success('Email verified! Welcome aboard 🎉');
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    setResending(true);
    try {
      await authService.resendCode(email);
      toast.success('A new code is on its way');
      setCooldown(60);
    } catch (err) {
      const m = err.response?.data?.message || 'Could not resend code';
      toast.error(m);
      const match = m.match(/(\d+)s/);
      if (match) setCooldown(Number(match[1]));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-20 left-10 w-72 h-72 bg-brand-500/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-fuchsia-500/20 rounded-full blur-3xl animate-float" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md glass-strong rounded-3xl p-8"
      >
        <div className="flex items-center justify-center mb-5">
          <div className="w-16 h-16 rounded-3xl bg-gradient-aurora bg-[length:200%_200%] animate-gradient-x 
          flex items-center justify-center shadow-glow">
            <HiOutlineMail className="w-7 h-7 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-display font-bold text-center text-balance">
          Verify your email
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center">
          We sent a 6-digit code to
          <br />
          <span className="font-semibold text-slate-900 dark:text-white">{email}</span>
        </p>

        <form onSubmit={onSubmit} className="mt-7 space-y-5">
          <CodeInput value={code} onChange={setCode} disabled={loading} />
          <Button
            type="submit"
            loading={loading}
            iconRight={HiOutlineArrowRight}
            className="w-full"
          >
            Verify email
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Didn't get the code?{' '}
          <button
            onClick={onResend}
            disabled={resending || cooldown > 0}
            className="text-brand-500 font-semibold hover:underline disabled:opacity-50 disabled:no-underline"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? 'Sending…' : 'Resend code'}
          </button>
        </div>

        <div className="mt-4 text-center text-xs text-slate-400">
          Wrong email?{' '}
          <Link to="/login" className="hover:underline">
            Sign in with a different account
          </Link>
        </div>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-wider 
        text-slate-400">
          <HiOutlineSparkles className="w-3 h-3" /> Secured by Smart Study
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
