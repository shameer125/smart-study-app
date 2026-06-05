import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineSparkles,
  HiOutlineArrowRight,
} from "react-icons/hi";
import Button from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const Register = () => {
  const { register, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  if (user?.isVerified) return <Navigate to="/" replace />;
  if (user && !user.isVerified)
    return (
      <Navigate to="/verify-email" state={{ email: user.email }} replace />
    );

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const data = await register(form);
      if (data?.requiresVerification) {
        toast.success(
          "Account created! Check your email for a verification code.",
        );
        navigate("/verify-email", { state: { email: form.email } });
      } else {
        toast.success("Welcome aboard! 🎉");
        navigate("/", { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-20 left-10 w-72 h-72 bg-brand-500/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-fuchsia-500/20 rounded-full blur-3xl animate-float" />

      <div className="relative w-full max-w-5xl grid lg:grid-cols-2 gap-6 items-stretch">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-strong rounded-3xl p-7 sm:p-9 flex flex-col justify-center order-2 lg:order-1"
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
            Create your account
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Start studying smarter in less than a minute.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <Input
              label="Full name"
              icon={HiOutlineUser}
              placeholder="Alex Morgan"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
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
              placeholder="At least 6 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <Button
              type="submit"
              loading={loading}
              className="w-full"
              iconRight={HiOutlineArrowRight}
            >
              Create account
            </Button>
          </form>

          <p className="mt-6 text-sm text-center text-slate-500 dark:text-slate-400">
            Already a member?{" "}
            <Link
              to="/login"
              className="text-brand-500 font-semibold hover:underline"
            >
              Sign in
            </Link>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden lg:flex flex-col justify-between p-10 rounded-3xl bg-gradient-to-br from-fuchsia-600 via-pink-600 to-amber-500 text-white relative overflow-hidden shadow-glow-lg order-1 lg:order-2"
        >
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
                <HiOutlineSparkles className="w-6 h-6" />
              </div>
              <div className="font-display font-bold text-xl">SmartStudy</div>
            </div>
            <h1 className="mt-12 text-4xl font-display font-bold leading-tight">
              Join thousands of focused learners.
            </h1>
            <p className="mt-4 text-white/85 max-w-md">
              Build streaks, master subjects, and ace exams with the ultimate AI
              study workspace.
            </p>
          </div>
          <div className="relative">
            <div className="flex items-center gap-3 -space-x-2">
              {["#fda4af", "#fcd34d", "#a5b4fc", "#67e8f9"].map((c, i) => (
                <div
                  key={i}
                  className="w-9 h-9 rounded-full ring-2 ring-white/40"
                  style={{ background: c }}
                />
              ))}
              <div className="ml-2 text-sm font-medium">
                +12k students this month
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
