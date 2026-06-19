import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlineFire,
  HiOutlineSparkles,
  HiOutlineClock,
  HiOutlineClipboardCheck,
} from 'react-icons/hi';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { authService } from '../services/authService';
import { statsService } from '../services/statsService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { initials, fmtDate } from '../utils/helpers';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', bio: '' });
  const [stats, setStats] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setForm({ name: user.name || '', bio: user.bio || '' });
  }, [user]);

  useEffect(() => {
    statsService
      .overview()
      .then((r) => setStats(r.stats))
      .catch(() => {});
  }, []);

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { user: updated } = await authService.updateProfile(form);
      updateUser(updated);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Account" title="Your Profile" description="Manage your personal 
      info and view progress." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 lg:col-span-1 relative overflow-hidden"
        >
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-aurora bg-[length:200%_200%] animate-gradient-x opacity-90" />
          <div className="relative pt-8 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-brand-500 to-fuchsia-500 text-white text-3xl 
            font-bold flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-xl">
              {initials(user?.name)}
            </div>
            <h2 className="mt-4 font-display font-bold text-lg">{user?.name}</h2>
            <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
              <HiOutlineMail className="w-4 h-4" /> {user?.email}
            </div>
            {user?.bio && (
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{user.bio}</p>
            )}
            <div className="mt-5 grid grid-cols-3 gap-2 w-full">
              <MiniStat icon={HiOutlineFire} value={user?.streak?.current ?? 0} label="Streak" />
              <MiniStat
                icon={HiOutlineClipboardCheck}
                value={stats?.completedTasks ?? 0}
                label="Done"
              />
              <MiniStat
                icon={HiOutlineClock}
                value={`${stats?.focusTodayHours ?? 0}h`}
                label="Today"
              />
            </div>
            <div className="mt-4 text-xs text-slate-400">
              Joined {fmtDate(user?.createdAt)}
            </div>
          </div>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          onSubmit={onSave}
          className="card p-6 lg:col-span-2 space-y-4"
        >
          <h3 className="font-display font-semibold text-lg">Edit profile</h3>
          <Input
            label="Full name"
            icon={HiOutlineUser}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input label="Email" icon={HiOutlineMail} value={user?.email || ''} disabled />
          <Textarea
            label="Bio"
            rows={3}
            placeholder="Tell us about yourself…"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
          <div className="flex justify-end">
            <Button type="submit" loading={saving} icon={HiOutlineSparkles}>
              Save changes
            </Button>
          </div>
        </motion.form>
      </div>
    </div>
  );
};

const MiniStat = ({ icon: Icon, value, label }) => (
  <div className="p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-800/60 flex flex-col items-center">
    <Icon className="w-4 h-4 text-brand-500 mb-1" />
    <div className="text-base font-bold leading-none">{value}</div>
    <div className="text-[10px] uppercase tracking-wider text-slate-400 mt-1">{label}</div>
  </div>
);

export default Profile;
