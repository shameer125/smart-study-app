/**
 * Smoke-test: verifies MongoDB, SMTP, and OpenRouter from the .env file.
 *   Run with:  node utils/envcheck.js
 *
 * Exits 0 on success, 1 on first failure.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const OpenAI = require('openai');

const pass = (m) => console.log(`✅  ${m}`);
const fail = (m, e) => {
  console.log(`❌  ${m}`);
  if (e?.message) console.log(`    └─ ${e.message}`);
};
const info = (m) => console.log(`ℹ️   ${m}`);

const mask = (v, keep = 6) => {
  if (!v) return '(empty)';
  const s = String(v);
  if (s.length <= keep) return '*'.repeat(s.length);
  return s.slice(0, keep) + '…' + '*'.repeat(Math.max(0, s.length - keep - 4)) + s.slice(-2);
};

(async () => {
  console.log('\n──────────── Smart Study env check ────────────\n');

  // --- basic env presence ---
  const required = ['MONGO_URI', 'JWT_SECRET'];
  let missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    fail(`Missing required env: ${missing.join(', ')}`);
    process.exit(1);
  }
  pass('All required env vars present');
  info(`NODE_ENV       = ${process.env.NODE_ENV || 'development'}`);
  info(`PORT           = ${process.env.PORT || 5000}`);
  info(`CLIENT_URL     = ${process.env.CLIENT_URL || '(default)'}`);
  info(`OPENAI_API_KEY = ${mask(process.env.OPENAI_API_KEY)}`);
  info(`SMTP_USER      = ${process.env.SMTP_USER || '(not set, console-mode)'}`);

  // --- 1) MongoDB ---
  console.log('\n[1/3] MongoDB');
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    const dbName = mongoose.connection.name;
    pass(`Connected to "${dbName}" @ ${mongoose.connection.host}`);
    if (dbName === 'test' || !dbName) {
      info('⚠ Database name resolves to "test" — add /smart_study to your URI.');
    }
    await mongoose.disconnect();
  } catch (e) {
    fail('MongoDB connection failed', e);
    process.exitCode = 1;
  }

  // --- 2) SMTP ---
  console.log('\n[2/3] SMTP (email)');
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    info('SMTP not configured — running in console-mail mode (codes will be logged).');
  } else {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await transporter.verify();
      pass(`SMTP login OK as ${process.env.SMTP_USER}`);
    } catch (e) {
      fail('SMTP verify failed', e);
      info('   For Gmail: enable 2FA + use a 16-char App Password from https://myaccount.google.com/apppasswords');
      process.exitCode = 1;
    }
  }

  // --- 3) OpenRouter ---
  console.log('\n[3/3] OpenRouter / AI');
  if (!process.env.OPENAI_API_KEY) {
    info('OPENAI_API_KEY not set — AI will use offline-fallback mode.');
  } else {
    const isOR = (process.env.OPENAI_BASE_URL || '').includes('openrouter.ai');
    try {
      const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.OPENAI_BASE_URL || undefined,
        defaultHeaders: isOR
          ? {
              'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'http://localhost:5173',
              'X-Title': process.env.OPENROUTER_APP_NAME || 'Smart Study',
            }
          : undefined,
      });
      const tryList = [
        process.env.OPENAI_MODEL || 'google/gemma-4-31b-it:free',
        ...(process.env.OPENAI_FALLBACK_MODELS || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      ];
      let success = false;
      const errors = [];
      for (const model of tryList) {
        try {
          const completion = await client.chat.completions.create({
            model,
            messages: [{ role: 'user', content: 'Reply with only: OK' }],
            max_tokens: 5,
            temperature: 0,
          });
          const reply = completion.choices?.[0]?.message?.content?.trim();
          if (reply) {
            pass(`AI responded via ${isOR ? 'OpenRouter' : 'OpenAI'} (${model}): "${reply}"`);
            success = true;
            break;
          }
          errors.push(`${model}: empty`);
        } catch (e) {
          errors.push(`${model}: ${e.status || ''} ${e.message?.slice(0, 60) || e}`);
        }
      }
      if (!success) {
        fail('AI request failed for all configured models');
        errors.forEach((e) => info(`   - ${e}`));
        info('   Run "npm run modelprobe" to find models that work on your account.');
        process.exitCode = 1;
      }
    } catch (e) {
      fail('AI request failed', e);
      info('   Verify the key at https://openrouter.ai/keys and the model id is correct.');
      process.exitCode = 1;
    }
  }

  console.log('\n────────────────────────────────────────────────\n');
  if (process.exitCode) process.exit(process.exitCode);
  process.exit(0);
})();
