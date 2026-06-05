import { useRef, useEffect } from 'react';

const CodeInput = ({ length = 6, value, onChange, autoFocus = true, disabled }) => {
  const refs = useRef([]);
  const chars = (value || '').padEnd(length, ' ').slice(0, length).split('');

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const setChar = (i, ch) => {
    const arr = chars.slice();
    arr[i] = ch || ' ';
    const next = arr.join('').trim();
    onChange(next);
  };

  const onKey = (e, i) => {
    if (e.key === 'Backspace') {
      if (!chars[i]?.trim() && i > 0) {
        refs.current[i - 1]?.focus();
        setChar(i - 1, '');
      } else {
        setChar(i, '');
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowRight' && i < length - 1) {
      refs.current[i + 1]?.focus();
    }
  };

  const onInput = (e, i) => {
    const digit = (e.target.value || '').replace(/\D/g, '').slice(-1);
    if (!digit) {
      setChar(i, '');
      return;
    }
    setChar(i, digit);
    if (i < length - 1) refs.current[i + 1]?.focus();
  };

  const onPaste = (e) => {
    const text = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, length);
    if (!text) return;
    e.preventDefault();
    onChange(text);
    const idx = Math.min(text.length, length - 1);
    refs.current[idx]?.focus();
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3" onPaste={onPaste}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          value={chars[i]?.trim() || ''}
          onChange={(e) => onInput(e, i)}
          onKeyDown={(e) => onKey(e, i)}
          inputMode="numeric"
          maxLength={1}
          disabled={disabled}
          className="w-11 h-14 sm:w-12 sm:h-16 text-center text-xl sm:text-2xl font-display font-bold rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/60 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 transition disabled:opacity-50"
        />
      ))}
    </div>
  );
};

export default CodeInput;
