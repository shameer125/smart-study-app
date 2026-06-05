import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlinePaperAirplane,
  HiOutlineSparkles,
  HiOutlinePlus,
  HiOutlineLightBulb,
  HiOutlineDocumentText,
  HiOutlineAcademicCap,
  HiOutlineTrash,
  HiOutlineRefresh,
} from 'react-icons/hi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import PageHeader from '../components/ui/PageHeader';
import { aiService } from '../services/aiService';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { initials, cn } from '../utils/helpers';

const SUGGESTIONS = [
  {
    icon: HiOutlineLightBulb,
    title: 'Explain a concept',
    prompt: 'Explain how neural networks learn through backpropagation, with a simple analogy.',
    mode: 'explain',
  },
  {
    icon: HiOutlineDocumentText,
    title: 'Summarize notes',
    prompt: 'Summarize the key points of mitosis vs meiosis.',
    mode: 'summarize',
  },
  {
    icon: HiOutlineAcademicCap,
    title: 'Build a study plan',
    prompt: 'Create a 7-day study plan to learn the basics of calculus.',
    mode: 'chat',
  },
  {
    icon: HiOutlineSparkles,
    title: 'Quiz me',
    prompt: 'Quiz me with 5 multiple-choice questions on World War II.',
    mode: 'chat',
  },
];

const AIAssistant = () => {
  const toast = useToast();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('chat');
  const scrollRef = useRef(null);

  const loadConversations = async () => {
    try {
      const data = await aiService.conversations();
      setConversations(data.conversations || []);
    } catch (e) {
      // silent
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, loading]);

  const startNew = () => {
    setMessages([]);
    setConversationId(null);
  };

  const openConversation = async (id) => {
    try {
      const data = await aiService.conversation(id);
      setConversationId(id);
      setMessages(
        (data.messages || []).map((m) => ({
          role: m.role,
          content: m.content,
          createdAt: m.createdAt,
        }))
      );
    } catch {
      toast.error('Could not load conversation');
    }
  };

  const deleteConversation = async (id, e) => {
    e?.stopPropagation();
    if (!confirm('Delete this conversation?')) return;
    try {
      await aiService.deleteConversation(id);
      setConversations((c) => c.filter((x) => x._id !== id));
      if (conversationId === id) startNew();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const send = async (text, sendMode = mode) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    setInput('');
    const userMsg = { role: 'user', content, createdAt: new Date().toISOString() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setLoading(true);

    try {
      const history = messages.map(({ role, content }) => ({ role, content }));
      const { reply, conversationId: convId } = await aiService.chat({
        message: content,
        conversationId,
        history,
        mode: sendMode,
      });
      setConversationId(convId);
      setMessages((m) => [...m, { role: 'assistant', content: reply, createdAt: new Date().toISOString() }]);
      loadConversations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI request failed');
      setMessages((m) => m.slice(0, -1));
      setInput(content);
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="AI Assistant"
        title={
          <>
            Meet <span className="gradient-text">Aria</span>
          </>
        }
        description="Your personal study assistant — ask questions, summarize notes, build study plans."
        actions={
          <button onClick={startNew} className="btn-secondary">
            <HiOutlinePlus className="w-4 h-4" /> New chat
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        {/* Conversations sidebar */}
        <div className="card p-3 lg:max-h-[72vh] lg:overflow-y-auto">
          <div className="text-xs font-semibold tracking-wider uppercase text-slate-400 px-2 py-2">
            Recent
          </div>
          {conversations.length === 0 ? (
            <div className="text-xs text-slate-400 px-2 py-3">No chats yet</div>
          ) : (
            <div className="space-y-1">
              {conversations.map((c) => (
                <button
                  key={c._id}
                  onClick={() => openConversation(c._id)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-xl text-sm group flex items-start gap-2 transition',
                    conversationId === c._id
                      ? 'bg-brand-500/10 text-brand-600 dark:text-brand-300'
                      : 'hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
                  )}
                >
                  <HiOutlineSparkles className="w-4 h-4 mt-0.5 shrink-0 text-brand-500" />
                  <span className="flex-1 line-clamp-2 text-xs">
                    {c.lastMessage?.slice(0, 80) || 'Chat'}
                  </span>
                  <button
                    onClick={(e) => deleteConversation(c._id, e)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition"
                  >
                    <HiOutlineTrash className="w-3.5 h-3.5" />
                  </button>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chat */}
        <div className="card flex flex-col h-[72vh] overflow-hidden">
          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-20 h-20 rounded-3xl bg-gradient-aurora bg-[length:200%_200%] animate-gradient-x flex items-center justify-center shadow-glow mb-5"
                >
                  <HiOutlineSparkles className="w-9 h-9 text-white" />
                </motion.div>
                <h2 className="text-2xl font-display font-bold text-balance">
                  How can I help you today, {user?.name?.split(' ')[0]}?
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md">
                  Pick a suggestion or just type your question. I can explain, summarize, quiz, or
                  plan.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-7 w-full max-w-2xl">
                  {SUGGESTIONS.map((s, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      onClick={() => {
                        setMode(s.mode);
                        send(s.prompt, s.mode);
                      }}
                      className="text-left p-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 hover:border-brand-500/50 hover:-translate-y-0.5 hover:shadow-glow transition group"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500/20 to-fuchsia-500/20 text-brand-500 flex items-center justify-center">
                          <s.icon className="w-4 h-4" />
                        </div>
                        <div className="text-sm font-semibold">{s.title}</div>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {s.prompt}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {messages.map((m, i) => (
                  <Bubble key={i} message={m} userName={user?.name} />
                ))}
                {loading && <TypingBubble />}
              </AnimatePresence>
            )}
          </div>

          {/* Composer */}
          <div className="border-t border-slate-200/70 dark:border-slate-700/70 p-3 sm:p-4 bg-white/30 dark:bg-slate-900/30">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {[
                { key: 'chat', label: 'Chat' },
                { key: 'explain', label: 'Explain' },
                { key: 'summarize', label: 'Summarize' },
              ].map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMode(m.key)}
                  className={cn(
                    'text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full transition',
                    mode === m.key
                      ? 'bg-gradient-to-r from-brand-500 to-fuchsia-500 text-white shadow'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  )}
                >
                  {m.label}
                </button>
              ))}
              {messages.length > 0 && (
                <button
                  onClick={() => send(messages[messages.length - 2]?.content || '', mode)}
                  className="ml-auto text-xs text-slate-500 hover:text-brand-500 flex items-center gap-1"
                >
                  <HiOutlineRefresh className="w-3.5 h-3.5" /> Regenerate
                </button>
              )}
            </div>
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKey}
                rows={1}
                placeholder="Ask Aria anything…  (Shift+Enter for newline)"
                className="w-full resize-none rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/60 px-4 py-3 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 placeholder:text-slate-400 max-h-40"
                style={{ minHeight: '52px' }}
              />
              <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                className="absolute right-2 bottom-2 w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-fuchsia-500 text-white flex items-center justify-center shadow-glow hover:scale-105 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {loading ? (
                  <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                ) : (
                  <HiOutlinePaperAirplane className="w-4 h-4 -rotate-45 -translate-y-px translate-x-px" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Bubble = ({ message, userName }) => {
  const isUser = message.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={cn('flex items-start gap-3', isUser ? 'flex-row-reverse' : '')}
    >
      <div
        className={cn(
          'shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-semibold shadow',
          isUser
            ? 'bg-gradient-to-br from-slate-500 to-slate-700'
            : 'bg-gradient-aurora bg-[length:200%_200%] animate-gradient-x'
        )}
      >
        {isUser ? initials(userName) : <HiOutlineSparkles className="w-4 h-4" />}
      </div>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3 prose-chat',
          isUser
            ? 'bg-gradient-to-br from-brand-600 to-fuchsia-600 text-white rounded-tr-md'
            : 'bg-white/80 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 rounded-tl-md'
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
        )}
      </div>
    </motion.div>
  );
};

const TypingBubble = () => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-start gap-3"
  >
    <div className="shrink-0 w-9 h-9 rounded-xl bg-gradient-aurora bg-[length:200%_200%] animate-gradient-x flex items-center justify-center text-white">
      <HiOutlineSparkles className="w-4 h-4" />
    </div>
    <div className="bg-white/80 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 rounded-2xl rounded-tl-md px-4 py-3">
      <div className="flex items-center gap-1.5">
        <Dot delay={0} />
        <Dot delay={0.15} />
        <Dot delay={0.3} />
      </div>
    </div>
  </motion.div>
);

const Dot = ({ delay }) => (
  <motion.span
    animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
    transition={{ duration: 0.9, repeat: Infinity, delay }}
    className="w-1.5 h-1.5 rounded-full bg-brand-500 inline-block"
  />
);

export default AIAssistant;
