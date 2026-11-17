import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { X } from 'lucide-react';
import { SCHEMA_LIMITS, WtpChoice } from '../types/finguide';

interface ProModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onSubmitWtp: (choice: WtpChoice, note: string) => Promise<void>;
  onOpenGoogleSignIn: () => void;
}

const WTP_CHOICES: Array<{ value: WtpChoice; title: string; subtitle: string }> = [
  {
    value: 'yes_149',
    title: 'Yes, I would pay ₹149/month',
    subtitle: 'Worth it for structured step-by-step guidance and goal check-ins',
  },
  {
    value: 'maybe_99',
    title: 'Maybe, if it were ₹99/month',
    subtitle: '₹149 feels slightly high for my current student/fresher budget',
  },
  {
    value: 'free_only',
    title: 'I would use the free version only',
    subtitle: 'Prefer free educational guides and basic comparison tools',
  },
];

export function ProModal({
  isOpen,
  user,
  onClose,
  onSubmitWtp,
  onOpenGoogleSignIn,
}: ProModalProps) {
  const [choice, setChoice] = useState<WtpChoice | null>(null);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user?.email && !note) {
      setNote(user.email);
    }
  }, [isOpen, user, note]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!choice) {
      setError('Please select one option above.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmitWtp(choice, note.slice(0, SCHEMA_LIMITS.WTP_NOTE_MAX));
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to save feedback right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/55 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pro-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-4 mb-3">
          <span className="text-xs font-semibold text-amber-700">
            FinGuide Pro · ₹149/month Student Trial
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h2 id="pro-modal-title" className="text-xl font-semibold text-slate-900 mb-2">
          Test Premium Guidance (Free Student Preview)
        </h2>
        <p className="text-sm text-slate-600 mb-5">
          FinGuide Pro includes unlimited Gemini-powered AI Q&amp;A, monthly savings check-ins,
          goal tracking, and beginner Indian tax-regime clarity.
        </p>

        <p className="text-sm font-medium text-slate-900 mb-2.5">
          Honest question: Would you pay ₹149/month for this after a free trial?
        </p>

        <div className="space-y-2.5 mb-4">
          {WTP_CHOICES.map((opt) => {
            const selected = choice === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setChoice(opt.value);
                  setError(null);
                }}
                className={`w-full text-left p-3.5 rounded-xl border transition-colors ${
                  selected
                    ? 'border-blue-700 bg-blue-50/70'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <span className="block text-sm font-semibold text-slate-900">{opt.title}</span>
                <span className="block text-xs text-slate-600 mt-0.5">{opt.subtitle}</span>
              </button>
            );
          })}
        </div>

        <input
          type="text"
          value={note}
          maxLength={SCHEMA_LIMITS.WTP_NOTE_MAX}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional: Email or most-wanted feature?"
          className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-700 mb-4"
        />

        {!user && (
          <p className="text-xs text-slate-500 mb-3">
            Tip:{' '}
            <button
              type="button"
              onClick={onOpenGoogleSignIn}
              className="text-blue-700 font-medium hover:underline"
            >
              Sign in free with Google
            </button>{' '}
            to sync your trial status across devices.
          </p>
        )}

        {error && <p className="text-xs font-medium text-amber-700 mb-3">{error}</p>}

        {submitted ? (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-sm font-medium text-emerald-800">
            Thank you! Your feedback is recorded and your Free Trial preview is active.
          </div>
        ) : (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors disabled:opacity-60"
          >
            {isSubmitting ? 'Recording Feedback...' : 'Submit & Unlock Free Trial Preview'}
          </button>
        )}
      </div>
    </div>
  );
}
