import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { Download, RotateCcw, X } from 'lucide-react';
import {
  fetchValidationOverview,
  resetCloudValidationStats,
  resetLocalMetrics,
} from '../services/finguideStore';
import { FOUNDER_ADMIN_EMAIL, ValidationStatsSummary, WtpSubmission } from '../types/finguide';

interface ValidationStatsModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
}

export function ValidationStatsModal({ isOpen, user, onClose }: ValidationStatsModalProps) {
  const [summary, setSummary] = useState<ValidationStatsSummary>({
    visits: 0,
    quizCompleted: 0,
    sessionsCompleted: 0,
    wtpTotal: 0,
    wtpYes149: 0,
    wtpMaybe99: 0,
    wtpFreeOnly: 0,
  });
  const [feedbackRows, setFeedbackRows] = useState<WtpSubmission[]>([]);
  const [source, setSource] = useState<'cloud' | 'local'>('local');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchValidationOverview(user);
      setSummary(result.summary);
      setFeedbackRows(result.feedbackRows);
      setSource(result.source);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load validation metrics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadStats();
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const completionRate = summary.visits
    ? Math.round((summary.sessionsCompleted / summary.visits) * 100)
    : 0;
  const wtpRate = summary.wtpTotal
    ? Math.round((summary.wtpYes149 / summary.wtpTotal) * 100)
    : 0;

  const handleExportCsv = () => {
    const rows: string[][] = [
      ['Metric', 'Value'],
      ['Source', source],
      ['Total Visits', String(summary.visits)],
      ['Confidence Checks Completed', String(summary.quizCompleted)],
      ['Guidance Sessions Completed', `${summary.sessionsCompleted} (${completionRate}%)`],
      ['Total WTP Responses', String(summary.wtpTotal)],
      ['Yes at Rs 149/mo', `${summary.wtpYes149} (${wtpRate}%)`],
      ['Maybe at Rs 99/mo', String(summary.wtpMaybe99)],
      ['Free Version Only', String(summary.wtpFreeOnly)],
      [],
      ['User Email', 'WTP Choice', 'Note', 'Timestamp'],
      ...feedbackRows.map((r) => [r.userEmail, r.choice, r.note, r.timestamp]),
    ];

    const csv = rows
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'finguide-ai-validation.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = async () => {
    resetLocalMetrics();
    if (user?.email === FOUNDER_ADMIN_EMAIL && user.emailVerified) {
      await resetCloudValidationStats();
    }
    await loadStats();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/55 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stats-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-4 mb-2">
          <h2 id="stats-modal-title" className="text-lg font-semibold text-slate-900">
            Founder Validation Stats
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-500 mb-5">
          {source === 'cloud'
            ? 'Synced with Firebase Firestore · Tracks campus testing & ₹149/mo validation'
            : 'Local browser session metrics · Sign in with Google to sync cloud stats'}
        </p>

        {error && (
          <div className="mb-4 p-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3 mb-5">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <div className="p-4 border border-slate-200 rounded-lg">
              <p className="text-xs text-slate-500">Total MVP Visits</p>
              <p className="text-xl font-semibold font-mono tabular-nums text-slate-900 mt-1">
                {summary.visits}
              </p>
            </div>
            <div className="p-4 border border-slate-200 rounded-lg">
              <p className="text-xs text-slate-500">Confidence Checks Done</p>
              <p className="text-xl font-semibold font-mono tabular-nums text-slate-900 mt-1">
                {summary.quizCompleted}
              </p>
            </div>
            <div className="p-4 border border-slate-200 rounded-lg">
              <p className="text-xs text-slate-500">Sessions Completed (Target ≥40%)</p>
              <p className="text-xl font-semibold font-mono tabular-nums text-blue-700 mt-1">
                {summary.sessionsCompleted}{' '}
                <span className="text-sm font-normal text-slate-500">({completionRate}%)</span>
              </p>
            </div>
            <div className="p-4 border border-slate-200 rounded-lg">
              <p className="text-xs text-slate-500">WTP at ₹149/mo (Target 10–20%)</p>
              <p className="text-xl font-semibold font-mono tabular-nums text-emerald-700 mt-1">
                {summary.wtpYes149} / {summary.wtpTotal}{' '}
                <span className="text-sm font-normal text-slate-500">({wtpRate}%)</span>
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-4 h-4" />
            Download CSV
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Stats
          </button>
        </div>
      </div>
    </div>
  );
}
