import { RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface ResetRecordsButtonProps {
  onConfirm: () => void;
}

/** Two-step reset: the first click only asks for confirmation. */
export function ResetRecordsButton({ onConfirm }: ResetRecordsButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (confirming) cancelRef.current?.focus();
  }, [confirming]);

  if (!confirming) {
    return (
      <button type="button" className="btn btn--ghost" onClick={() => setConfirming(true)}>
        <RotateCcw aria-hidden="true" size={18} />
        Reset Personal Records
      </button>
    );
  }

  return (
    <div className="confirm" role="group" aria-label="Confirm reset of personal records">
      <p>Erase your saved records? This cannot be undone.</p>
      <div className="confirm__actions">
        <button
          type="button"
          className="btn btn--danger"
          onClick={() => {
            onConfirm();
            setConfirming(false);
          }}
        >
          Yes, reset
        </button>
        <button
          ref={cancelRef}
          type="button"
          className="btn btn--ghost"
          onClick={() => setConfirming(false)}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
