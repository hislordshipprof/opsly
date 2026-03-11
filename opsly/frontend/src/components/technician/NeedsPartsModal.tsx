import { useState, useEffect, useRef } from 'react';

interface NeedsPartsModalProps {
  orderNumber: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (notes: string) => void;
  isSubmitting?: boolean;
}

export function NeedsPartsModal({
  orderNumber, isOpen, onClose, onSubmit, isSubmitting,
}: NeedsPartsModalProps) {
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
          <h3 className="text-lg font-bold">Request Parts for {orderNumber}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            List the parts needed. The manager will be notified.
          </p>
        </div>

        <div className="px-7 pb-5">
          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
            Parts Needed
          </label>
          <textarea
            ref={textareaRef}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="List parts needed, quantities, and any supplier preferences..."
            className="w-full h-28 p-3 rounded-xl border border-border/60 bg-card/50 text-sm resize-y outline-none focus:border-opsly-high transition-colors"
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
            disabled={!notes.trim() || isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-opsly-high text-white text-sm font-bold hover:bg-amber-600 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Parts Request'}
          </button>
        </div>
      </div>
    </div>
  );
}
