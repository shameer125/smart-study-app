import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiOutlineClipboardCheck,
  HiOutlineClock,
  HiOutlineFire,
  HiOutlineDocumentText,
  HiOutlineArrowRight,
  HiOutlineSparkles,
  HiOutlineCalendar,
} from "react-icons/hi";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import PageHeader from "../components/ui/PageHeader";
import { SkeletonCard, Skeleton } from "../components/ui/Skeleton";
import { statsService } from "../services/statsService";
import { taskService } from "../services/taskService";
import { scheduleService } from "../services/scheduleService";
import { useAuth } from "../context/AuthContext";
import { fmtRelative, priorityStyles, subjectColors } from "../utils/helpers";

const PIE_COLORS = [
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#64748b",
];

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [series, setSeries] = useState([]);
  const [subjects, setSubjects] = useState({
    tasksBySubject: [],
    sessionsBySubject: [],
  });
  const [upcoming, setUpcoming] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [ov, sub, tasksRes, schedRes] = await Promise.all([
          statsService.overview(),
          statsService.subjects(),
          taskService.list({ status: "pending", sort: "deadline" }),
          scheduleService.list(),
        ]);
        setStats(ov.stats);
        setSeries(ov.series);
        setSubjects(sub);
        setUpcoming((tasksRes.tasks || []).slice(0, 5));
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tom = new Date(today);
        tom.setDate(tom.getDate() + 1);
        setTodaySchedule(
          (schedRes.schedules || []).filter((s) => {
            const d = new Date(s.date);
            return d >= today && d < tom;
          }),
        );
      } catch (e) {
        // best-effort
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={greeting}
        title={
          <>
            Hey{" "}
            <span className="gradient-text">{user?.name?.split(" ")[0]}</span>{" "}
            👋
          </>
        }
        description="Here's your snapshot for today — let's make it a productive one."
        actions={
          <Link to="/ai" className="btn-primary">
            <HiOutlineSparkles className="w-4 h-4" /> Ask Aria
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          loading={loading}
          icon={HiOutlineClipboardCheck}
          label="Tasks Completed"
          value={stats?.completedTasks ?? 0}
          sub={`${stats?.totalTasks ?? 0} total`}
          gradient="from-emerald-500 to-teal-500"
        />
        <StatCard
          loading={loading}
          icon={HiOutlineClock}
          label="Focus Hours Today"
          value={`${stats?.focusTodayHours ?? 0}h`}
          sub={`${stats?.focusTodayMinutes ?? 0} minutes`}
          gradient="from-brand-500 to-fuchsia-500"
        />
        <StatCard
          loading={loading}
          icon={HiOutlineFire}
          label="Current Streak"
          value={`${stats?.streak?.current ?? 0} days`}
          sub={`Best: ${stats?.streak?.best ?? 0} days`}
          gradient="from-amber-500 to-pink-500"
        />
        <StatCard
          loading={loading}
          icon={HiOutlineDocumentText}
          label="Notes"
          value={stats?.notesCount ?? 0}
          sub={`${stats?.schedulesThisWeek ?? 0} sessions this week`}
          gradient="from-violet-500 to-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Chart: focus this week */}
        <div className="xl:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="font-display font-semibold">Weekly Focus</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hours of deep work in the last 7 days
              </p>
            </div>
            <div className="text-xs px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-500 font-semibold">
              {series.reduce((a, b) => a + (b.hours || 0), 0).toFixed(1)}h total
            </div>
          </div>
          <div className="h-64 mt-3">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series}>
                  <defs>
                    <linearGradient id="focus" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    stroke="rgb(148 163 184 / 0.15)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12 }}
                    stroke="#94a3b8"
                  />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15,23,42,0.9)",
                      border: "1px solid rgba(99,102,241,0.4)",
                      borderRadius: 12,
                      color: "#fff",
                    }}
                    formatter={(v) => [`${v} h`, "Focus"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="hours"
                    stroke="#6366f1"
                    strokeWidth={3}
                    fill="url(#focus)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pie: subjects */}
        <div className="card p-5">
          <h3 className="font-display font-semibold">Subjects</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tasks distribution
          </p>
          <div className="h-52 mt-2">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : subjects.tasksBySubject?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subjects.tasksBySubject}
                    dataKey="count"
                    nameKey="_id"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {subjects.tasksBySubject.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15,23,42,0.9)",
                      border: "1px solid rgba(99,102,241,0.4)",
                      borderRadius: 12,
                      color: "#fff",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">
                No data yet — add tasks
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {subjects.tasksBySubject?.slice(0, 6).map((s, i) => (
              <div key={s._id} className="flex items-center gap-1.5 text-xs">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                />
                <span>{s._id}</span>
                <span className="text-slate-400">({s.count})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Upcoming tasks */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-display font-semibold">Upcoming Tasks</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Stay ahead of deadlines
              </p>
            </div>
            <Link
              to="/tasks"
              className="text-xs text-brand-500 font-semibold flex items-center 
            gap-1 hover:underline"
            >
              View all <HiOutlineArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {loading ? (
              <>
                <SkeletonCard lines={2} />
                <SkeletonCard lines={2} />
              </>
            ) : upcoming.length === 0 ? (
              <div className="text-sm text-slate-400 py-6 text-center">
                No pending tasks. Nice work!
              </div>
            ) : (
              upcoming.map((t, i) => {
                const c = subjectColors[t.subject] || subjectColors.General;
                return (
                  <motion.div
                    key={t._id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100/60 
                    dark:hover:bg-slate-800/60 transition border border-transparent hover:border-slate-200/70 
                    dark:hover:border-slate-700/70"
                  >
                    <div className={`w-2 self-stretch rounded-full ${c.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {t.title}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <span className={`chip ${c.bg} ${c.text}`}>
                          {t.subject}
                        </span>
                        {t.deadline && <span>{fmtRelative(t.deadline)}</span>}
                      </div>
                    </div>
                    <span className={`chip ${priorityStyles[t.priority]}`}>
                      {t.priority}
                    </span>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Today's schedule */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-display font-semibold">Today's Schedule</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <Link
              to="/calendar"
              className="text-xs text-brand-500 font-semibold flex items-center gap-1 hover:underline"
            >
              Open calendar <HiOutlineArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {loading ? (
              <>
                <SkeletonCard lines={1} />
                <SkeletonCard lines={1} />
              </>
            ) : todaySchedule.length === 0 ? (
              <div className="text-sm text-slate-400 py-6 text-center flex flex-col items-center gap-2">
                <HiOutlineCalendar className="w-8 h-8 text-slate-300" />
                Nothing scheduled today.
              </div>
            ) : (
              todaySchedule.map((s, i) => {
                const c = subjectColors[s.subject] || subjectColors.General;
                return (
                  <motion.div
                    key={s._id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/70 
                    dark:border-slate-700/70"
                  >
                    <div className="text-right shrink-0 w-16">
                      <div className="text-sm font-semibold">{s.startTime}</div>
                      <div className="text-[10px] text-slate-400 uppercase">
                        to {s.endTime}
                      </div>
                    </div>
                    <div className={`w-1 self-stretch rounded-full ${c.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {s.title}
                      </div>
                      <div className={`text-xs ${c.text}`}>{s.subject}</div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ loading, icon: Icon, label, value, sub, gradient }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="stat-card"
  >
    <div className="flex items-center justify-between">
      <div className="text-xs font-semibold tracking-wider uppercase text-slate-500 
      dark:text-slate-400">
        {label}
      </div>
      <div
        className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center shadow-lg`}
      >
        <Icon className="w-5 h-5" />
      </div>
    </div>
    {loading ? (
      <Skeleton className="h-8 w-24 mt-3" />
    ) : (
      <div className="mt-3 text-3xl font-display font-bold">{value}</div>
    )}
    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{sub}</div>
  </motion.div>
);

export default Dashboard;
