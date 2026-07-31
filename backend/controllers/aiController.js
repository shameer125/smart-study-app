const OpenAI = require('openai');
const { randomUUID } = require('crypto');
const ChatMessage = require('../models/ChatMessage');
const asyncHandler = require('../middleware/asyncHandler');

let openai = null;
const getClient = () => {
  if (openai) return openai;
  if (!process.env.OPENAI_API_KEY) return null;

  const baseURL = process.env.OPENAI_BASE_URL || undefined;
  const isOpenRouter = baseURL && baseURL.includes('openrouter.ai');

  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL,
    defaultHeaders: isOpenRouter
      ? {
          'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'http://localhost:5173',
          'X-Title': process.env.OPENROUTER_APP_NAME || 'Smart Study',
        }
      : undefined,
  });
  return openai;
};


const SYSTEM_PROMPT = `You are "Aria", the in-app Smart Study AI Assistant.
Your job is to help students learn effectively. You can:
- Explain concepts in simple terms with examples
- Summarize notes or long passages clearly
- Generate study plans, flashcards, or practice questions
- Help debug homework problems step-by-step

Style:
- Be warm, encouraging, and concise
- Use markdown formatting (headings, bullets, **bold**) when helpful
- Use LaTeX in $...$ for math when relevant
- When asked to summarize, output a clean bulleted summary`;

const offlineFallback = (prompt) => {
  const trimmed = prompt.trim();
  return `**Aria (offline demo mode)**

I couldn't reach the AI provider right now, but here's a helpful structure based on your question:

> "${trimmed.slice(0, 220)}${trimmed.length > 220 ? '…' : ''}"

**Suggested approach**
- Break the topic into 3-5 key sub-concepts
- For each, write a 2-sentence definition in your own words
- Create one example + one counter-example
- Quiz yourself with 5 questions and review what you miss

Configure \`OPENAI_API_KEY\` in your backend \`.env\` to enable full AI responses.`;
};

const chat = asyncHandler(async (req, res) => {
  const { message, conversationId, history = [], mode = 'chat' } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: 'Message is required' });
  }

  const convId = conversationId || randomUUID();

  await ChatMessage.create({
    userId: req.user._id,
    conversationId: convId,
    role: 'user',
    content: message,
  });

  
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.slice(-12).map((m) => ({ role: m.role, content: m.content })),
    {
      role: 'user',
      content:
        mode === 'summarize'
          ? `Summarize the following clearly with bullet points and key takeaways:\n\n${message}`
          : mode === 'explain'
          ? `Explain this concept simply with an example, as if I'm a beginner:\n\n${message}`
          : message,
    },
  ];

  const client = getClient();
  let assistantText;
  let usedModel = null;

  if (!client) {
    assistantText = offlineFallback(message);
  } else {
    // Build a model list: primary + fallbacks (resilient to OpenRouter rate-limits)
    const primary = process.env.OPENAI_MODEL || 'google/gemma-4-31b-it:free';
    const extras = (process.env.OPENAI_FALLBACK_MODELS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const defaultFallbacks = [
      'google/gemma-4-26b-a4b-it:free',
      'openai/gpt-oss-20b:free',
      'openai/gpt-oss-120b:free',
    ];
    const tryList = [...new Set([primary, ...extras, ...defaultFallbacks])];

    const errors = [];
    for (const model of tryList) {
      try {
        const completion = await client.chat.completions.create({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 800,
        });
        const text = completion.choices?.[0]?.message?.content?.trim();
        if (text) {
          assistantText = text;
          usedModel = model;
          break;
        }
        errors.push(`${model}: empty reply`);
      } catch (err) {
        errors.push(`${model}: ${err.status || ''} ${err.message?.slice(0, 80) || err}`);
      }
    }

    if (!assistantText) {
      console.error('All AI providers failed:\n  ' + errors.join('\n  '));
      assistantText = offlineFallback(message);
    } else if (usedModel && usedModel !== primary) {
      console.log(`[ai] fell back to "${usedModel}" (primary "${primary}" unavailable)`);
    }
  }

  await ChatMessage.create({
    userId: req.user._id,
    conversationId: convId,
    role: 'assistant',
    content: assistantText,
  });

  res.json({
    success: true,
    conversationId: convId,
    reply: assistantText,
    model: usedModel || 'offline-fallback',
  });
});

const getConversations = asyncHandler(async (req, res) => {
  const items = await ChatMessage.aggregate([
    { $match: { userId: req.user._id } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$conversationId',
        lastMessage: { $first: '$content' },
        role: { $first: '$role' },
        updatedAt: { $first: '$createdAt' },
        messages: { $sum: 1 },
      },
    },
    { $sort: { updatedAt: -1 } },
    { $limit: 30 },
  ]);
  res.json({ success: true, conversations: items });
});

const getConversation = asyncHandler(async (req, res) => {
  const msgs = await ChatMessage.find({
    userId: req.user._id,
    conversationId: req.params.id,
  }).sort({ createdAt: 1 });
  res.json({ success: true, messages: msgs });
});

const deleteConversation = asyncHandler(async (req, res) => {
  await ChatMessage.deleteMany({ userId: req.user._id, conversationId: req.params.id });
  res.json({ success: true, message: 'Conversation deleted' });
});

module.exports = { chat, getConversations, getConversation, deleteConversation };
