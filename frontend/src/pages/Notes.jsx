import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineDocumentText,
  HiOutlineUpload,
  HiOutlineDownload,
  HiOutlinePaperClip,
  HiOutlineStar,
} from 'react-icons/hi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Input, Textarea } from '../components/ui/Input';
import { SkeletonCard } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { noteService } from '../services/noteService';
import { filesBaseURL } from '../services/api';
import { useToast } from '../context/ToastContext';
import { fmtDate, colorPalette, cn } from '../utils/helpers';

const blank = {
  title: '',
  content: '',
  subject: 'General',
  tags: '',
  color: 'indigo',
  pinned: false,
  file: null,
};

const Notes = () => {
  const toast = useToast();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeSubject, setActiveSubject] = useState('All');
  const [openModal, setOpenModal] = useState(false);
  const [openViewer, setOpenViewer] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);

  const load = async () => {
    setLoading(true);
    try {
      const data = await noteService.list();
      setNotes(data.notes || []);
    } catch {
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const subjects = useMemo(
    () => ['All', ...Array.from(new Set(notes.map((n) => n.subject))).sort()],
    [notes]
  );

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return notes.filter((n) => {
      if (activeSubject !== 'All' && n.subject !== activeSubject) return false;
      if (
        s &&
        !`${n.title} ${n.content} ${n.subject} ${(n.tags || []).join(' ')}`
          .toLowerCase()
          .includes(s)
      )
        return false;
      return true;
    });
  }, [notes, search, activeSubject]);

  const openCreate = () => {
    setEditing(null);
    setForm(blank);
    setOpenModal(true);
  };
  const openEdit = (n) => {
    setEditing(n);
    setForm({
      title: n.title,
      content: n.content || '',
      subject: n.subject || 'General',
      tags: (n.tags || []).join(', '),
      color: n.color || 'indigo',
      pinned: !!n.pinned,
      file: null,
    });
    setOpenViewer(null);
    setOpenModal(true);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (!payload.file) delete payload.file;
      if (editing) {
        const { note } = await noteService.update(editing._id, payload);
        setNotes((cur) => cur.map((x) => (x._id === note._id ? note : x)));
        toast.success('Note updated');
      } else {
        const { note } = await noteService.create(payload);
        setNotes((cur) => [note, ...cur]);
        toast.success('Note created');
      }
      setOpenModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save note');
    }
  };

  const onDelete = async (n) => {
    if (!confirm(`Delete "${n.title}"?`)) return;
    try {
      await noteService.remove(n._id);
      setNotes((cur) => cur.filter((x) => x._id !== n._id));
      toast.success('Note deleted');
      setOpenViewer(null);
    } catch {
      toast.error('Delete failed');
    }
  };

  const togglePin = async (n) => {
    try {
      const { note } = await noteService.update(n._id, { pinned: !n.pinned });
      setNotes((cur) => cur.map((x) => (x._id === note._id ? note : x)));
    } catch {
      toast.error('Failed');
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Notes"
        title="Notes Manager"
        description="Capture, organize, and revisit your study notes."
        actions={
          <Button icon={HiOutlinePlus} onClick={openCreate}>
            New Note
          </Button>
        }
      />

      <div className="card p-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes, tags, content…"
            className="w-full pl-9 pr-3 py-2 bg-slate-100/70 dark:bg-slate-800/60 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {subjects.map((s) => (
            <button
              key={s}
              onClick={() => setActiveSubject(s)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-semibold transition',
                activeSubject === s
                  ? 'bg-gradient-to-r from-brand-500 to-fuchsia-500 text-white shadow'
                  : 'bg-slate-100/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={HiOutlineDocumentText}
          title="No notes yet"
          description="Capture your first note. Markdown is supported."
          action={
            <Button icon={HiOutlinePlus} onClick={openCreate}>
              Create note
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((n, i) => (
            <motion.div
              key={n._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setOpenViewer(n)}
              className="card p-4 cursor-pointer hover:-translate-y-0.5 hover:shadow-glow transition group relative overflow-hidden"
            >
              <div
                className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
                  colorPalette[n.color] || colorPalette.indigo
                }`}
              />
              <div className="flex items-start justify-between gap-2 mt-1">
                <h3 className="font-display font-semibold text-base line-clamp-1">{n.title}</h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePin(n);
                  }}
                  className={`p-1 rounded-lg ${
                    n.pinned ? 'text-amber-400' : 'text-slate-300 hover:text-amber-400'
                  }`}
                >
                  <HiOutlineStar className={`w-4 h-4 ${n.pinned ? 'fill-current' : ''}`} />
                </button>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {n.subject} · {fmtDate(n.updatedAt)}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300 mt-2 line-clamp-4">
                {n.content?.replace(/[#*`_>-]/g, '').slice(0, 220) || (
                  <span className="italic text-slate-400">No content</span>
                )}
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(n.tags || []).slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="chip bg-slate-500/10 text-slate-500 dark:text-slate-300 text-[10px]"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
                {n.file && (
                  <span className="chip bg-brand-500/10 text-brand-500 text-[10px]">
                    <HiOutlinePaperClip className="w-3 h-3" /> Attachment
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Viewer */}
      <Modal
        open={!!openViewer}
        onClose={() => setOpenViewer(null)}
        title={openViewer?.title}
        subtitle={openViewer && `${openViewer.subject} · Updated ${fmtDate(openViewer.updatedAt)}`}
        size="lg"
        footer={
          openViewer && (
            <>
              <Button variant="ghost" onClick={() => onDelete(openViewer)} icon={HiOutlineTrash}>
                Delete
              </Button>
              <Button variant="secondary" onClick={() => openEdit(openViewer)} icon={HiOutlinePencil}>
                Edit
              </Button>
              <Button onClick={() => setOpenViewer(null)}>Close</Button>
            </>
          )
        }
      >
        {openViewer && (
          <div>
            {openViewer.file && (
              <a
                href={`${filesBaseURL}${openViewer.file.url}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700/70 mb-4 hover:bg-slate-100/40 dark:hover:bg-slate-800/40 transition"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-500 to-fuchsia-500 text-white flex items-center justify-center">
                  <HiOutlinePaperClip className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{openViewer.file.originalName}</div>
                  <div className="text-xs text-slate-400">
                    {(openViewer.file.size / 1024).toFixed(1)} KB · {openViewer.file.mimetype}
                  </div>
                </div>
                <HiOutlineDownload className="w-4 h-4 text-slate-400" />
              </a>
            )}
            <div className="prose-chat">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {openViewer.content || '*No content*'}
              </ReactMarkdown>
            </div>
            {(openViewer.tags || []).length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap mt-4">
                {openViewer.tags.map((t) => (
                  <span key={t} className="chip bg-slate-500/10 text-slate-500 dark:text-slate-300">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Editor */}
      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title={editing ? 'Edit Note' : 'New Note'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpenModal(false)}>
              Cancel
            </Button>
            <Button onClick={onSubmit}>{editing ? 'Save changes' : 'Create note'}</Button>
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
              label="Tags (comma separated)"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
            />
          </div>
          <div>
            <div className="mb-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Color
            </div>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(colorPalette).map(([key, grad]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm({ ...form, color: key })}
                  className={`w-8 h-8 rounded-xl bg-gradient-to-br ${grad} ${
                    form.color === key ? 'ring-2 ring-brand-500 ring-offset-2 ring-offset-transparent' : ''
                  }`}
                />
              ))}
            </div>
          </div>
          <Textarea
            label="Content (Markdown supported)"
            rows={8}
            placeholder="## Heading&#10;- Bullet&#10;- **Bold**"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
          <div>
            <div className="mb-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Attachment {editing?.file && '(replace)'}
            </div>
            <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 cursor-pointer transition text-sm">
              <HiOutlineUpload className="w-4 h-4 text-slate-400" />
              <span className="text-slate-500 dark:text-slate-300">
                {form.file?.name || 'Choose PDF, image, or doc (max 15MB)'}
              </span>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.txt,.doc,.docx,.ppt,.pptx"
                onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })}
                className="hidden"
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.pinned}
              onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
              className="rounded"
            />
            Pin this note
          </label>
        </form>
      </Modal>
    </div>
  );
};

export default Notes;
