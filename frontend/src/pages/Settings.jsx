import { useState } from 'react';
import {
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineLockClosed,
  HiOutlineColorSwatch,
  HiOutlineClock,
  HiOutlineKey,
} from 'react-icons/hi';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authService } from '../services/authService';

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [pwd, setPwd] = useState({ password: '', confirm: '' });
  const [savingPwd, setSavingPwd] = useState(false);
  const [pomodoro, setPomodoro] = useState({
    focusMinutes: user?.preferences?.pomodoro?.focusMinutes || 25,
    shortBreak: user?.preferences?.pomodoro?.shortBreak || 5,
    longBreak: user?.preferences?.pomodoro?.longBreak || 15,
  });
  const [savingPref, setSavingPref] = useState(false);

  const changePassword = async (e) => {
    e.preventDefault();
    if (pwd.password.length < 6) return toast.error('Password too short');
    if (pwd.password !== pwd.confirm) return toast.error('Passwords do not match');
    setSavingPwd(true);
    try {
      await authService.updateProfile({ password: pwd.password });
      toast.success('Password updated');
      setPwd({ password: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSavingPwd(false);
    }
  };

  const savePomodoro = async () => {
    setSavingPref(true);
    try {
      const { user: updated } = await authService.updateProfile({ preferences: { pomodoro } });
      updateUser(updated);
      toast.success('Preferences saved');
    } catch (err) {
      toast.error('Update failed');
    } finally {
      setSavingPref(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Settings" title="Preferences" description="Personalize your experience." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Appearance */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-fuchsia-500 text-white flex items-center justify-center">
              <HiOutlineColorSwatch className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-semibold">Appearance</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Switch between dark and light mode
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setTheme('light')}
              className={`p-4 rounded-2xl border-2 text-left transition ${
                theme === 'light'
                  ? 'border-brand-500 bg-brand-500/10'
                  : 'border-slate-200 dark:border-slate-700 hover:border-brand-500/40'
              }`}
            >
              <HiOutlineSun className="w-6 h-6 text-amber-400 mb-2" />
              <div className="font-semibold text-sm">Light</div>
              <div className="text-xs text-slate-500">Clean & bright</div>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-2xl border-2 text-left transition ${
                theme === 'dark'
                  ? 'border-brand-500 bg-brand-500/10'
                  : 'border-slate-200 dark:border-slate-700 hover:border-brand-500/40'
              }`}
            >
              <HiOutlineMoon className="w-6 h-6 text-indigo-400 mb-2" />
              <div className="font-semibold text-sm">Dark</div>
              <div className="text-xs text-slate-500">Easy on the eyes</div>
            </button>
          </div>
        </div>

        {/* Pomodoro */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center">
              <HiOutlineClock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-semibold">Pomodoro defaults</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Customize focus & break lengths
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Focus"
              type="number"
              min={1}
              max={180}
              value={pomodoro.focusMinutes}
              onChange={(e) => setPomodoro({ ...pomodoro, focusMinutes: Number(e.target.value) })}
            />
            <Input
              label="Short break"
              type="number"
              min={1}
              max={60}
              value={pomodoro.shortBreak}
              onChange={(e) => setPomodoro({ ...pomodoro, shortBreak: Number(e.target.value) })}
            />
            <Input
              label="Long break"
              type="number"
              min={1}
              max={120}
              value={pomodoro.longBreak}
              onChange={(e) => setPomodoro({ ...pomodoro, longBreak: Number(e.target.value) })}
            />
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={savePomodoro} loading={savingPref}>
              Save
            </Button>
          </div>
        </div>

        {/* Password */}
        <form onSubmit={changePassword} className="card p-6 lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 text-white flex items-center justify-center">
              <HiOutlineLockClosed className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-semibold">Change password</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Use at least 6 characters
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="New password"
              type="password"
              icon={HiOutlineKey}
              value={pwd.password}
              onChange={(e) => setPwd({ ...pwd, password: e.target.value })}
              required
            />
            <Input
              label="Confirm password"
              type="password"
              icon={HiOutlineKey}
              value={pwd.confirm}
              onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
              required
            />
          </div>
          <div className="flex justify-end mt-4">
            <Button type="submit" loading={savingPwd}>
              Update password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
