import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HiOutlineMail, HiOutlineX, HiOutlineArrowRight } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { useToast } from '../../context/ToastContext';

const VerifyBanner = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);

  if (!user || user.isVerified || dismissed) return null;

  const resend = async () => {
    setSending(true);
    try {
      await authService.resendCode(user.email);
      toast.success('Verification code sent — check your inbox');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not resend');
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="mx-3 mt-3 mb-1 rounded-2xl overflow-hidden relative bg-gradient-to-r from-amber-500/15
        via-orange-500/15 to-rose-500/15 border border-amber-500/30 backdrop-blur"
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 
          text-white flex items-center justify-center shadow">
            <HiOutlineMail className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-900 dark:text-white">
              Verify your email to unlock all features
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 truncate">
              We sent a 6-digit code to <span className="font-medium">{user.email}</span>
            </div>
          </div>
          <button
            onClick={resend}
            disabled={sending}
            className="hidden sm:inline-flex text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/70 
            dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-800 transition"
          >
            {sending ? 'Sending…' : 'Resend code'}
          </button>
          <Link
            to="/verify-email"
            state={{ email: user.email }}
            className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gradient-to-r 
            from-brand-500 to-fuchsia-500 text-white hover:shadow-glow transition"
          >
            Verify <HiOutlineArrowRight className="w-3 h-3" />
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <HiOutlineX className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VerifyBanner;
