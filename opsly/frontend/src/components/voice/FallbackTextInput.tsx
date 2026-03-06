import { useRef, useState } from 'react';

interface FallbackTextInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
}

export default function FallbackTextInput({ onSend, disabled }: FallbackTextInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText('');
    // Reset height after clearing
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
    // Auto-grow: reset then set to scrollHeight
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 flex-1 min-w-0">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        disabled={disabled}
        rows={1}
        className="flex-1 min-w-0 resize-none rounded-xl border border-input/50 bg-background/40 backdrop-blur-sm px-3 py-2 text-sm leading-snug placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 scrollbar-none"
      />
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        aria-label="Send message"
        className="size-9 shrink-0 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
      >
        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
        </svg>
      </button>
    </form>
  );
}
