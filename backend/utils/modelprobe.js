require('dotenv').config();
const OpenAI = require('openai');

const models = [
  'openai/gpt-oss-20b:free',
  'openai/gpt-oss-120b:free',
  'nvidia/nemotron-nano-9b-v2:free',
  'nvidia/nemotron-nano-12b-v2-vl:free',
  'z-ai/glm-4.5-air:free',
  'qwen/qwen3-coder:free',
  'qwen/qwen3-next-80b-a3b-instruct:free',
  'google/gemma-4-26b-a4b-it:free',
  'google/gemma-4-31b-it:free',
  'meta-llama/llama-3.2-3b-instruct:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'minimax/minimax-m2.5:free',
  'deepseek/deepseek-v4-flash:free',
];

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
  defaultHeaders: {
    'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'http://localhost:5173',
    'X-Title': process.env.OPENROUTER_APP_NAME || 'Smart Study',
  },
});

const probe = async (model) => {
  const start = Date.now();
  try {
    const r = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: 'Reply with only: OK' }],
      max_tokens: 5,
      temperature: 0,
    });
    const reply = r.choices?.[0]?.message?.content?.trim() || '(empty)';
    return { model, ok: true, reply, ms: Date.now() - start };
  } catch (e) {
    return { model, ok: false, status: e.status, msg: e.message?.slice(0, 80), ms: Date.now() - start };
  }
};

(async () => {
  console.log(`\nProbing ${models.length} free models on OpenRouter...\n`);
  const results = await Promise.all(models.map(probe));
  for (const r of results) {
    if (r.ok) console.log(`✅  ${r.model.padEnd(55)} → "${r.reply}"  (${r.ms}ms)`);
    else console.log(`❌  ${r.model.padEnd(55)} [${r.status || 'err'}] ${r.msg}`);
  }
  const working = results.filter((r) => r.ok);
  console.log(`\n${working.length}/${models.length} models worked on your account.`);
  if (working.length) {
    console.log(`\n👉  Recommended: ${working[0].model}\n`);
  } else {
    console.log('\n⚠  No free models accessible — your OpenRouter account may need credits OR the free pool is saturated.\n');
  }
})();
