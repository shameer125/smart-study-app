const nodemailer = require('nodemailer');

let transporter = null;
let mode = 'console';

const init = () => {
  if (transporter !== null) return;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: SMTP_SECURE === 'true',
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    mode = 'smtp';
  } else {
    transporter = false;
    mode = 'console';
  }
};

const generateCode = () =>
  String(Math.floor(100000 + Math.random() * 900000)); // 6-digit

const baseTemplate = ({ title, intro, code, footer, accent = '#6366f1' }) => `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:'Inter','Segoe UI',Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.08);">
          <tr><td style="background:linear-gradient(135deg,#6366f1 0%,#a855f7 50%,#ec4899 100%);padding:28px 32px;color:white;">
            <div style="font-size:13px;letter-spacing:3px;text-transform:uppercase;opacity:.85;">Smart Study</div>
            <div style="font-size:24px;font-weight:700;margin-top:6px;">${title}</div>
          </td></tr>
          <tr><td style="padding:28px 32px;">
            <p style="font-size:15px;line-height:1.6;margin:0 0 18px 0;color:#334155;">${intro}</p>
            ${
              code
                ? `<div style="margin:18px 0;background:#f8fafc;border:1px dashed ${accent};border-radius:14px;padding:18px;text-align:center;">
                    <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#64748b;margin-bottom:6px;">Your code</div>
                    <div style="font-family:'Courier New',monospace;font-size:34px;font-weight:700;letter-spacing:10px;color:${accent};">${code}</div>
                    <div style="font-size:12px;color:#94a3b8;margin-top:10px;">Expires in 15 minutes</div>
                  </div>`
                : ''
            }
            <p style="font-size:13px;color:#64748b;margin:20px 0 0 0;">${footer || ''}</p>
          </td></tr>
          <tr><td style="padding:18px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;text-align:center;">
            If you didn't request this, you can safely ignore this email.<br/>
            © ${new Date().getFullYear()} Smart Study
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

const verificationTemplate = (name, code) =>
  baseTemplate({
    title: 'Verify your email',
    intro: `Hi ${name || 'there'} 👋, welcome to Smart Study! Use the code below to verify your email address and unlock your account.`,
    code,
    footer: 'This code expires in 15 minutes. If you didn\'t sign up, ignore this email.',
  });

const resetTemplate = (name, code) =>
  baseTemplate({
    title: 'Reset your password',
    intro: `Hi ${name || 'there'}, we received a request to reset your Smart Study password. Use the code below to continue.`,
    code,
    accent: '#ec4899',
    footer: 'If you didn\'t request a password reset, please ignore this email or contact support.',
  });

const welcomeTemplate = (name) =>
  baseTemplate({
    title: 'Welcome aboard! 🎉',
    intro: `Hi ${name}, your email is verified and your Smart Study account is fully active. Time to plan, focus, and learn smarter.`,
    footer: 'Open Smart Study and start your first focus session — your future self will thank you.',
  });

const send = async ({ to, subject, html }) => {
  init();
  if (mode === 'smtp') {
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || `Smart Study <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    return { ok: true, mode: 'smtp', id: info.messageId };
  }
  // Dev fallback: log to console
  console.log(`\n📧  [dev-mail] -> ${to}`);
  console.log(`    subject: ${subject}`);
  const codeMatch = html.match(/>(\d{6})</);
  if (codeMatch) console.log(`    CODE:    ${codeMatch[1]}\n`);
  return { ok: true, mode: 'console' };
};

const sendVerification = (user, code) =>
  send({
    to: user.email,
    subject: 'Verify your Smart Study email',
    html: verificationTemplate(user.name, code),
  });

const sendPasswordReset = (user, code) =>
  send({
    to: user.email,
    subject: 'Smart Study — reset your password',
    html: resetTemplate(user.name, code),
  });

const sendWelcome = (user) =>
  send({
    to: user.email,
    subject: 'Welcome to Smart Study 🎉',
    html: welcomeTemplate(user.name),
  });

module.exports = {
  generateCode,
  sendVerification,
  sendPasswordReset,
  sendWelcome,
  getMode: () => mode,
};
