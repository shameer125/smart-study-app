import { useState } from "react";
import { Link, useNavigate, useLocation, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineSparkles,
  HiOutlineArrowRight,
} from "react-icons/hi";
import Button from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const Login = () => {
  const { login, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const from = location.state?.from || "/";

  if (user?.isVerified) return <Navigate to={from} replace />;
  if (user && !user.isVerified)
    return (
      <Navigate to="/verify-email" state={{ email: user.email }} replace />
    );

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form);
      toast.success("Welcome back!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setForm({ email: "demo@smartstudy.app", password: "password123" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <BackgroundDecor />
      <div className="relative w-full max-w-5xl grid lg:grid-cols-2 gap-6 items-stretch">
        {/* Left: brand */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden lg:flex flex-col justify-between p-10 rounded-3xl bg-gradient-to-br from-brand-600 via-fuchsia-600 to-pink-600 text-white relative overflow-hidden shadow-glow-lg"
        >
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
                <HiOutlineSparkles className="w-6 h-6" />
              </div>
              <div className="font-display font-bold text-xl">SmartStudy</div>
            </div>
            <h1 className="mt-12 text-4xl font-display font-bold leading-tight text-balance">
              Plan smart.
              <br />
              Focus deep.
              <br />
              Learn faster.
            </h1>
            <p className="mt-4 text-white/85 max-w-md text-balance">
              Your AI-powered study companion — manage tasks, take notes, run
              focus sessions, and chat with Aria to learn anything.
            </p>
          </div>
          <div className="relative space-y-3">
            {[
              "AI explanations & summaries",
              "Pomodoro focus mode",
              "Calendar & smart scheduling",
              "Beautiful analytics dashboard",
            ].map((t, i) => (
              <motion.div
                key={t}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                className="flex items-center gap-3 text-white/95"
              >
                <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center">
                  <span className="text-xs">✓</span>
                </div>
                <span className="text-sm">{t}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right: form */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass-strong rounded-3xl p-7 sm:p-9 flex flex-col justify-center"
        >
          <div className="mb-6 lg:hidden flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-aurora flex items-center justify-center">
              <HiOutlineSparkles className="w-5 h-5 text-white" />
            </div>
            <div className="font-display font-bold text-lg">
              Smart<span className="gradient-text">Study</span>
            </div>
          </div>
          <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
            Welcome back
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Sign in to continue your learning journey.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <Input
              label="Email"
              type="email"
              icon={HiOutlineMail}
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <Input
              label="Password"
              type="password"
              icon={HiOutlineLockClosed}
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <div className="flex justify-end -mt-2">
              <Link
                to="/forgot-password"
                className="text-xs text-brand-500 font-semibold hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Button
              type="submit"
              loading={loading}
              className="w-full"
              iconRight={HiOutlineArrowRight}
            >
              Sign in
            </Button>
          </form>

          <button
            onClick={fillDemo}
            className="mt-3 w-full text-xs text-brand-500 hover:underline"
          >
            Fill demo credentials
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            <span className="text-xs text-slate-400">or</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
          </div>

          <p className="text-sm text-center text-slate-500 dark:text-slate-400">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-brand-500 font-semibold hover:underline"
            >
              Create one
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

const BackgroundDecor = () => (
  <>
    <div className="absolute top-20 left-10 w-72 h-72 bg-brand-500/20 rounded-full blur-3xl animate-float" />
    <div className="absolute bottom-20 right-10 w-72 h-72 bg-fuchsia-500/20 rounded-full blur-3xl animate-float" />
  </>
);

export default Login;
