import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlinePlus,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineCalendar,
} from 'react-icons/hi';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addDays,
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from 'date-fns';

import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Input, Textarea, Select } from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import { scheduleService } from '../services/scheduleService';
import { useToast } from '../context/ToastContext';
import { subjectColors, colorPalette } from '../utils/helpers';

const blank = {
  title: '',
  subject: 'General',
  date: format(new Date(), 'yyyy-MM-dd'),
  startTime: '09:00',
  endTime: '10:00',
  color: 'indigo',
  notes: '',
};

const Calendar = () => {
  const toast = useToast();
  const [month, setMonth] = useState(new Date());
  const [view, setView] = useState('month'); // 'month' | 'week'
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [selectedDay, setSelectedDay] = useState(new Date());

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await scheduleService.list();
        setSessions(data.schedules || []);
      } catch {
        toast.error('Failed to load schedule');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const days = useMemo(() => {
    if (view === 'week') {
      const start = startOfWeek(selectedDay, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end: addDays(start, 6) });
    }
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month, view, selectedDay]);

  const dayEvents = (d) =>
    sessions
      .filter((s) => isSameDay(parseISO(s.date), d))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const openCreate = (date) => {
    const d = date || selectedDay;
    setEditing(null);
    setForm({ ...blank, date: format(d, 'yyyy-MM-dd') });
    setOpenModal(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({
      title: s.title,
      subject: s.subject || 'General',
      date: format(parseISO(s.date), 'yyyy-MM-dd'),
      startTime: s.startTime,
      endTime: s.endTime,
      color: s.color || 'indigo',
      notes: s.notes || '',
    });
    setOpenModal(true);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        const { schedule } = await scheduleService.update(editing._id, form);
        setSessions((s) => s.map((x) => (x._id === schedule._id ? schedule : x)));
        toast.success('Session updated');
      } else {
        const { schedule } = await scheduleService.create(form);
        setSessions((s) => [...s, schedule]);
        toast.success('Session added');
      }
      setOpenModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    }
  };

  const onDelete = async (s) => {
    if (!confirm(`Delete "${s.title}"?`)) return;
    try {
      await scheduleService.remove(s._id);
      setSessions((cur) => cur.filter((x) => x._id !== s._id));
      toast.success('Session removed');
    } catch {
      toast.error('Delete failed');
    }
  };

  const selectedDayEvents = dayEvents(selectedDay);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Study Planner"
        title="Calendar"
        description="Plan your study sessions across the week or month."
        actions={
          <>
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100/70 dark:bg-slate-800/60">
              <button
                onClick={() => setView('month')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${
                  view === 'month' ? 'bg-white dark:bg-slate-700 shadow' : 'text-slate-500'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setView('week')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${
                  view === 'week' ? 'bg-white dark:bg-slate-700 shadow' : 'text-slate-500'
                }`}
              >
                Week
              </button>
            </div>
            <Button icon={HiOutlinePlus} onClick={() => openCreate(selectedDay)}>
              Add Session
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Calendar grid */}
        <div className="card p-4 xl:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMonth(subMonths(month, 1))}
                className="p-2 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800/60"
              >
                <HiOutlineChevronLeft className="w-4 h-4" />
              </button>
              <div className="font-display font-semibold text-lg">
                {format(view === 'week' ? selectedDay : month, 'MMMM yyyy')}
              </div>
              <button
                onClick={() => setMonth(addMonths(month, 1))}
                className="p-2 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800/60"
              >
                <HiOutlineChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => {
                setMonth(new Date());
                setSelectedDay(new Date());
              }}
              className="text-xs font-semibold text-brand-500 hover:underline"
            >
              Today
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <div
                key={d}
                className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 py-1.5"
              >
                {d}
              </div>
            ))}
            {days.map((d) => {
              const events = dayEvents(d);
              const isOtherMonth = view === 'month' && !isSameMonth(d, month);
              const isSel = isSameDay(d, selectedDay);
              return (
                <motion.button
                  key={d.toISOString()}
                  onClick={() => setSelectedDay(d)}
                  whileTap={{ scale: 0.97 }}
                  className={`relative min-h-[80px] p-1.5 rounded-xl text-left transition group ${
                    isSel
                      ? 'bg-brand-500/10 ring-2 ring-brand-500/40'
                      : 'hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
                  } ${isOtherMonth ? 'opacity-40' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold ${
                        isToday(d)
                          ? 'bg-gradient-to-br from-brand-500 to-fuchsia-500 text-white w-6 h-6 rounded-full flex items-center justify-center'
                          : ''
                      }`}
                    >
                      {format(d, 'd')}
                    </span>
                    {events.length > 0 && (
                      <span className="text-[10px] font-bold text-brand-500">
                        {events.length}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {events.slice(0, 2).map((e) => {
                      const c = subjectColors[e.subject] || subjectColors.General;
                      return (
                        <div
                          key={e._id}
                          className={`text-[10px] truncate px-1.5 py-0.5 rounded-md font-medium ${c.bg} ${c.text}`}
                        >
                          {e.startTime} · {e.title}
                        </div>
                      );
                    })}
                    {events.length > 2 && (
                      <div className="text-[10px] text-slate-400 px-1">
                        +{events.length - 2} more
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Day detail panel */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Selected day</div>
              <h3 className="font-display font-semibold text-lg">
                {format(selectedDay, 'EEEE, MMM d')}
              </h3>
            </div>
            <Button icon={HiOutlinePlus} variant="secondary" onClick={() => openCreate(selectedDay)}>
              Add
            </Button>
          </div>

          {selectedDayEvents.length === 0 ? (
            <EmptyState
              icon={HiOutlineCalendar}
              title="Nothing planned"
              description="Schedule a focused session for this day."
              action={
                <Button icon={HiOutlinePlus} onClick={() => openCreate(selectedDay)}>
                  Add session
                </Button>
              }
            />
          ) : (
            <div className="space-y-2">
              {selectedDayEvents.map((e) => {
                const c = subjectColors[e.subject] || subjectColors.General;
                const grad = colorPalette[e.color] || colorPalette.indigo;
                return (
                  <motion.div
                    key={e._id}
                    layout
                    className="group relative overflow-hidden rounded-xl border border-slate-200/70 
                    dark:border-slate-700/70 p-3"
                  >
                    <div
                      className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${grad}`}
                    />
                    <div className="flex items-start gap-3 pl-2">
                      <div className="text-right shrink-0">
                        <div className="text-sm font-semibold">{e.startTime}</div>
                        <div className="text-[10px] text-slate-400 uppercase">{e.endTime}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">{e.title}</div>
                        <div className={`text-xs ${c.text}`}>{e.subject}</div>
                        {e.notes && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                            {e.notes}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => openEdit(e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-500 
                          hover:bg-brand-500/10"
                        >
                          <HiOutlinePencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete(e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 
                          hover:bg-rose-500/10"
                        >
                          <HiOutlineTrash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title={editing ? 'Edit Session' : 'New Study Session'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpenModal(false)}>
              Cancel
            </Button>
            <Button onClick={onSubmit}>{editing ? 'Save' : 'Create'}</Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Subject"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
            <Input
              label="Date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start"
              type="time"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              required
            />
            <Input
              label="End"
              type="time"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              required
            />
          </div>
          <div>
            <div className="mb-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 
            uppercase tracking-wider">
              Color
            </div>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(colorPalette).map(([key, grad]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm({ ...form, color: key })}
                  className={`w-8 h-8 rounded-xl bg-gradient-to-br ${grad} transition ring-offset-2 ring-offset-transparent ${
                    form.color === key ? 'ring-2 ring-brand-500' : ''
                  }`}
                />
              ))}
            </div>
          </div>
          <Textarea
            label="Notes"
            placeholder="Optional details"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </form>
      </Modal>
    </div>
  );
};

export default Calendar;
