import { useState, useEffect, useRef } from 'react';

interface CompletionModalProps {
  orderNumber: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (notes: string) => void;
  isSubmitting?: boolean;
}

export function CompletionModal({
  orderNumber, isOpen, onClose, onSubmit, isSubmitting,
}: CompletionModalProps) {
  const [notes, setNotes] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    } else {
      setNotes('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="glass-card-heavy w-[480px] max-w-[90vw] overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-7 pt-6 pb-4">
          <h3 className="text-lg font-bold">Mark {orderNumber} Complete</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Add resolution notes for this job. The tenant and manager will be notified.
          </p>
        </div>

        <div className="px-7 pb-5">
          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
            Resolution Notes
          </label>
          <textarea
            ref={textareaRef}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe what was done, parts used, and any follow-up instructions for the tenant..."
            className="w-full h-28 p-3 rounded-xl border border-border/60 bg-card/50 text-sm resize-y outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="px-7 pb-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-border/60 text-sm font-semibold text-secondary-foreground hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(notes)}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-opsly-low text-white text-sm font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Completing...' : '\u2713 Complete Job'}
          </button>
        </div>
      </div>
    </div>
  );
}
