import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineClipboardList,
  HiOutlineDotsHorizontal,
  HiOutlineCheckCircle,
} from 'react-icons/hi';
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Input, Textarea, Select } from '../components/ui/Input';
import { SkeletonCard } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { taskService } from '../services/taskService';
import { useToast } from '../context/ToastContext';
import {
  fmtDate,
  fmtRelative,
  priorityStyles,
  subjectColors,
  statusStyles,
} from '../utils/helpers';

const COLUMNS = [
  { key: 'pending', label: 'To Do', accent: 'from-slate-400 to-slate-500' },
  { key: 'in-progress', label: 'In Progress', accent: 'from-brand-500 to-fuchsia-500' },
  { key: 'completed', label: 'Completed', accent: 'from-emerald-500 to-teal-500' },
];

const blankTask = {
  title: '',
  description: '',
  subject: 'General',
  priority: 'medium',
  status: 'pending',
  deadline: '',
};

const Tasks = () => {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(params.get('search') || '');
  const [filter, setFilter] = useState({ status: 'all', priority: 'all', subject: '' });
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankTask);
  const [view, setView] = useState('board'); // 'board' | 'list'

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const load = async () => {
    setLoading(true);
    try {
      const data = await taskService.list();
      setTasks(data.tasks || []);
    } catch (e) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return tasks
      .filter((t) => {
        const s = search.toLowerCase();
        if (s && !(`${t.title} ${t.description} ${t.subject}`.toLowerCase().includes(s))) return false;
        if (filter.status !== 'all' && t.status !== filter.status) return false;
        if (filter.priority !== 'all' && t.priority !== filter.priority) return false;
        if (filter.subject && t.subject !== filter.subject) return false;
        return true;
      })
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [tasks, search, filter]);

  const grouped = useMemo(() => {
    const g = { pending: [], 'in-progress': [], completed: [] };
    filtered.forEach((t) => g[t.status].push(t));
    return g;
  }, [filtered]);

  const subjects = useMemo(
    () => Array.from(new Set(tasks.map((t) => t.subject).filter(Boolean))),
    [tasks]
  );

  const openCreate = () => {
    setEditing(null);
    setForm(blankTask);
    setOpenModal(true);
  };

  const openEdit = (task) => {
    setEditing(task);
    setForm({
      title: task.title,
      description: task.description || '',
      subject: task.subject || 'General',
      priority: task.priority,
      status: task.status,
      deadline: task.deadline ? task.deadline.slice(0, 10) : '',
    });
    setOpenModal(true);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (!payload.deadline) delete payload.deadline;
      if (editing) {
        const { task } = await taskService.update(editing._id, payload);
        setTasks((cur) => cur.map((t) => (t._id === task._id ? task : t)));
        toast.success('Task updated');
      } else {
        const { task } = await taskService.create(payload);
        setTasks((cur) => [task, ...cur]);
        toast.success('Task created');
      }
      setOpenModal(false);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not save task');
    }
  };

  const onDelete = async (task) => {
    if (!confirm(`Delete "${task.title}"?`)) return;
    try {
      await taskService.remove(task._id);
      setTasks((cur) => cur.filter((t) => t._id !== task._id));
      toast.success('Task deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  const quickStatus = async (task, status) => {
    const optimistic = { ...task, status, completedAt: status === 'completed' ? new Date().toISOString() : null };
    setTasks((cur) => cur.map((t) => (t._id === task._id ? optimistic : t)));
    try {
      await taskService.update(task._id, { status });
    } catch {
      toast.error('Could not update');
      load();
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;
    const activeTask = tasks.find((t) => t._id === active.id);
    if (!activeTask) return;

    const overId = over.id;
    const overTask = tasks.find((t) => t._id === overId);
    const newStatus = overTask ? overTask.status : overId; // dropped on column

    const next = tasks.map((t) => ({ ...t }));
    const idx = next.findIndex((t) => t._id === active.id);
    if (idx === -1) return;
    next[idx].status = newStatus;
    if (newStatus === 'completed') next[idx].completedAt = new Date().toISOString();

    // Reorder within the new status column
    const inColumn = next.filter((t) => t.status === newStatus);
    const outOfColumn = next.filter((t) => t.status !== newStatus);
    const fromIdx = inColumn.findIndex((t) => t._id === active.id);
    const toIdx = overTask ? inColumn.findIndex((t) => t._id === overTask._id) : inColumn.length - 1;
    const reordered = arrayMove(inColumn, fromIdx, toIdx).map((t, i) => ({ ...t, order: i }));
    setTasks([...outOfColumn, ...reordered]);

    try {
      await Promise.all([
        taskService.update(active.id, { status: newStatus }),
        taskService.reorder(reordered.map((t, i) => ({ id: t._id, order: i, status: newStatus }))),
      ]);
    } catch {
      toast.error('Sync failed, reloading');
      load();
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Tasks"
        title="Task Manager"
        description="Plan, prioritize, and conquer your study tasks."
        actions={
          <Button icon={HiOutlinePlus} onClick={openCreate}>
            New Task
          </Button>
        }
      />

      {/* Filters bar */}
      <div className="card p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 
          text-slate-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setParams(e.target.value ? { search: e.target.value } : {});
            }}
            placeholder="Search tasks…"
            className="w-full pl-9 pr-3 py-2 bg-slate-100/70 dark:bg-slate-800/60 rounded-xl 
            text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          />
        </div>
        <Pill
          icon={HiOutlineFilter}
          label="Priority"
          value={filter.priority}
          onChange={(v) => setFilter({ ...filter, priority: v })}
          options={[
            { value: 'all', label: 'All' },
            { value: 'high', label: 'High' },
            { value: 'medium', label: 'Medium' },
            { value: 'low', label: 'Low' },
          ]}
        />
        <Pill
          icon={HiOutlineFilter}
          label="Status"
          value={filter.status}
          onChange={(v) => setFilter({ ...filter, status: v })}
          options={[
            { value: 'all', label: 'All' },
            { value: 'pending', label: 'Pending' },
            { value: 'in-progress', label: 'In progress' },
            { value: 'completed', label: 'Completed' },
          ]}
        />
        {subjects.length > 0 && (
          <Pill
            icon={HiOutlineFilter}
            label="Subject"
            value={filter.subject}
            onChange={(v) => setFilter({ ...filter, subject: v })}
            options={[{ value: '', label: 'All' }, ...subjects.map((s) => ({ value: s, label: s }))]}
          />
        )}
        <div className="ml-auto flex items-center gap-1 p-1 rounded-xl bg-slate-100/70 dark:bg-slate-800/60">
          <button
            onClick={() => setView('board')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${
              view === 'board' ? 'bg-white dark:bg-slate-700 shadow' : 'text-slate-500'
            }`}
          >
            Board
          </button>
          <button
            onClick={() => setView('list')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${
              view === 'list' ? 'bg-white dark:bg-slate-700 shadow' : 'text-slate-500'
            }`}
          >
            List
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={HiOutlineClipboardList}
          title="No tasks yet"
          description="Start by adding your first task. You can drag & drop between columns."
          action={
            <Button icon={HiOutlinePlus} onClick={openCreate}>
              Create your first task
            </Button>
          }
        />
      ) : view === 'board' ? (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {COLUMNS.map((col) => (
              <Column key={col.key} col={col} tasks={grouped[col.key]}>
                <SortableContext
                  items={grouped[col.key].map((t) => t._id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2 min-h-[80px]">
                    {grouped[col.key].map((t) => (
                      <SortableTaskCard
                        key={t._id}
                        task={t}
                        onEdit={() => openEdit(t)}
                        onDelete={() => onDelete(t)}
                        onStatus={(s) => quickStatus(t, s)}
                      />
                    ))}
                    {grouped[col.key].length === 0 && (
                      <div className="text-xs text-slate-400 italic py-4 text-center">
                        Drop tasks here
                      </div>
                    )}
                  </div>
                </SortableContext>
              </Column>
            ))}
          </div>
        </DndContext>
      ) : (
        <div className="card divide-y divide-slate-200/70 dark:divide-slate-700/60 overflow-hidden">
          {filtered.map((t) => (
            <TaskRow
              key={t._id}
              task={t}
              onEdit={() => openEdit(t)}
              onDelete={() => onDelete(t)}
              onStatus={(s) => quickStatus(t, s)}
            />
          ))}
        </div>
      )}

      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title={editing ? 'Edit Task' : 'Create Task'}
        subtitle={editing ? 'Update your task details' : 'Add a new study task'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpenModal(false)}>
              Cancel
            </Button>
            <Button onClick={onSubmit} icon={HiOutlineCheckCircle}>
              {editing ? 'Save changes' : 'Create task'}
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input
            label="Title"
            placeholder="e.g. Read Chapter 5 of OS"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <Textarea
            label="Description"
            placeholder="Optional details"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Subject"
              placeholder="CS, Math, History…"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
            <Input
              label="Deadline"
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Priority"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="pending">Pending</option>
              <option value="in-progress">In progress</option>
              <option value="completed">Completed</option>
            </Select>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const Pill = ({ icon: Icon, label, value, options, onChange }) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="appearance-none pl-8 pr-7 py-2 bg-slate-100/70 dark:bg-slate-800/60 
      rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/40 
      cursor-pointer"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {label}: {o.label}
        </option>
      ))}
    </select>
    {Icon && (
      <Icon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 
      pointer-events-none" />
    )}
  </div>
);

const Column = ({ col, tasks, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id: col.key });
  return (
    <div
      ref={setNodeRef}
      className={`card p-3 transition ${isOver ? 'ring-2 ring-brand-500/40' : ''}`}
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${col.accent}`} />
          <h3 className="font-semibold text-sm">{col.label}</h3>
        </div>
        <span className="text-xs text-slate-400 font-semibold">{tasks.length}</span>
      </div>
      {children}
    </div>
  );
};

const SortableTaskCard = ({ task, onEdit, onDelete, onStatus }) => {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: task._id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} onEdit={onEdit} onDelete={onDelete} onStatus={onStatus} />
    </div>
  );
};

const TaskCard = ({ task, onEdit, onDelete, onStatus }) => {
  const c = subjectColors[task.subject] || subjectColors.General;
  return (
    <motion.div
      layout
      className="group p-3 rounded-xl bg-white/70 dark:bg-slate-900/60 border 
      border-slate-200/70 dark:border-slate-700/70 hover:shadow-soft hover:-translate-y-0.5 
      transition cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold leading-snug">{task.title}</div>
          {task.description && (
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              {task.description}
            </div>
          )}
        </div>
        <div className="flex opacity-0 group-hover:opacity-100 transition gap-0.5">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1.5 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-700/70"
          >
            <HiOutlinePencil className="w-3.5 h-3.5" />
          </button>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 rounded-lg hover:bg-rose-500/10 hover:text-rose-500"
          >
            <HiOutlineTrash className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <span className={`chip ${c.bg} ${c.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
          {task.subject}
        </span>
        <span className={`chip ${priorityStyles[task.priority]}`}>{task.priority}</span>
        {task.deadline && (
          <span className="chip bg-slate-500/10 text-slate-500 dark:text-slate-300">
            {fmtRelative(task.deadline)}
          </span>
        )}
      </div>
    </motion.div>
  );
};

const TaskRow = ({ task, onEdit, onDelete, onStatus }) => {
  const c = subjectColors[task.subject] || subjectColors.General;
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-100/40 dark:hover:bg-slate-800/40 transition">
      <button
        onClick={() => onStatus(task.status === 'completed' ? 'pending' : 'completed')}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition shrink-0 ${
          task.status === 'completed'
            ? 'bg-emerald-500 border-emerald-500'
            : 'border-slate-400/60 hover:border-emerald-500'
        }`}
      >
        {task.status === 'completed' && (
          <HiOutlineCheckCircle className="w-3 h-3 text-white" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-slate-400' : ''}`}>
          {task.title}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap">
          <span className={`chip ${c.bg} ${c.text}`}>{task.subject}</span>
          <span className={`chip ${priorityStyles[task.priority]}`}>{task.priority}</span>
          <span className={`chip ${statusStyles[task.status]}`}>{task.status}</span>
          {task.deadline && <span>· {fmtDate(task.deadline)}</span>}
        </div>
      </div>
      <button onClick={onEdit} className="p-2 text-slate-400 hover:text-brand-500">
        <HiOutlinePencil className="w-4 h-4" />
      </button>
      <button onClick={onDelete} className="p-2 text-slate-400 hover:text-rose-500">
        <HiOutlineTrash className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Tasks;
