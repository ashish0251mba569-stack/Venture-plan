import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { ArrowLeft, ArrowRight, Check, RotateCcw } from 'lucide-react';
import {
  buildBlueprint,
  computeConfidenceScore,
  QUIZ_STEPS,
} from '../data/financialProducts';
import { AssessmentAnswers, StoredAssessment } from '../types/finguide';

interface ConfidenceCheckPanelProps {
  user: User | null;
  savedAssessment: StoredAssessment | null;
  isSaving: boolean;
  onSaveAssessment: (answers: AssessmentAnswers, score: number) => Promise<void>;
  onMarkSessionComplete: () => Promise<void>;
  onNavigateCompare: () => void;
  onOpenGoogleSignIn: () => void;
}

export function ConfidenceCheckPanel({
  user,
  savedAssessment,
  isSaving,
  onSaveAssessment,
  onMarkSessionComplete,
  onNavigateCompare,
  onOpenGoogleSignIn,
}: ConfidenceCheckPanelProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<AssessmentAnswers>>({});
  const [isRetaking, setIsRetaking] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (savedAssessment && !isRetaking) {
      setAnswers({
        stage: savedAssessment.stage,
        savings: savedAssessment.savings,
        goal: savedAssessment.goal,
        risk: savedAssessment.risk,
      });
    }
  }, [savedAssessment, isRetaking]);

  const showResult = Boolean(savedAssessment) && !isRetaking;
  const currentStep = QUIZ_STEPS[stepIndex];
  const currentValue = answers[currentStep.key];

  const handleSelectOption = (value: string) => {
    setValidationError(null);
    setAnswers((prev) => ({
      ...prev,
      [currentStep.key]: value,
    }));
  };

  const handleNext = async () => {
    if (!currentValue) {
      setValidationError('Please select one option to continue.');
      return;
    }
    if (stepIndex < QUIZ_STEPS.length - 1) {
      setStepIndex((i) => i + 1);
      return;
    }

    const completeAnswers = answers as AssessmentAnswers;
    const score = computeConfidenceScore(completeAnswers);
    setIsRetaking(false);
    await onSaveAssessment(completeAnswers, score);
  };

  const handleRetake = () => {
    setStepIndex(0);
    setValidationError(null);
    setIsRetaking(true);
  };

  if (showResult && savedAssessment) {
    const blueprint = buildBlueprint(savedAssessment);
    const firstName = user?.displayName ? `${user.displayName.split(' ')[0]}'s` : 'Your';

    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-blue-700 text-white flex flex-col items-center justify-center shrink-0">
              <span className="font-mono text-xl font-bold tabular-nums leading-none">
                {savedAssessment.score}
              </span>
              <span className="text-[11px] text-blue-100 mt-1">of 100</span>
            </div>
            <div>
              <p className="text-xs font-medium text-emerald-700 mb-1">
                {blueprint.profileLabel} · Readiness Profile
              </p>
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-900">
                {firstName} Personalized Guidance Plan
              </h2>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl">{blueprint.summary}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRetake}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 self-start sm:self-center"
          >
            <RotateCcw className="w-4 h-4" />
            Retake Check
          </button>
        </div>

        <div className="mt-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4">
            Recommended 3-Step Starting Blueprint (Educational)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {blueprint.steps.map((step) => (
              <div key={step.stepLabel} className="pt-4 border-t border-slate-200">
                <p className="text-xs font-medium text-blue-700 mb-1">{step.stepLabel}</p>
                <h4 className="text-base font-semibold text-slate-900 mb-2">{step.title}</h4>
                <p className="text-sm text-slate-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">
              Complete Your Guidance Session
            </h4>
            <p className="text-sm text-slate-600 mt-0.5">
              Review your starting blueprint, compare options, or ask FinGuide AI a question.
            </p>
            {!user && (
              <button
                type="button"
                onClick={onOpenGoogleSignIn}
                className="text-xs font-medium text-blue-700 hover:underline mt-1.5"
              >
                Sign in free with Google to save this roadmap across devices
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              disabled={savedAssessment.sessionCompleted || isSaving}
              onClick={onMarkSessionComplete}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                savedAssessment.sessionCompleted
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-default'
                  : 'bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-60'
              }`}
            >
              <Check className="w-4 h-4" />
              {savedAssessment.sessionCompleted
                ? 'Guidance Session Completed'
                : 'Mark Guidance Session Complete'}
            </button>

            <button
              type="button"
              onClick={onNavigateCompare}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              Compare Options
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progressPercent = ((stepIndex + 1) / QUIZ_STEPS.length) * 100;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
      <div className="flex items-center justify-between gap-4 text-xs text-slate-500 mb-3">
        <span className="font-medium text-blue-700">
          Step {stepIndex + 1} of {QUIZ_STEPS.length}
        </span>
        <span>About 2 minutes</span>
      </div>

      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-blue-700 transition-all duration-200"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-1">
        {currentStep.title}
      </h2>
      <p className="text-sm text-slate-600 mb-6">{currentStep.subtitle}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {currentStep.options.map((option) => {
          const isSelected = currentValue === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelectOption(option.value)}
              className={`text-left p-4 rounded-xl border transition-colors min-h-[76px] ${
                isSelected
                  ? 'border-blue-700 bg-blue-50/70'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
              }`}
            >
              <span className="block text-sm font-semibold text-slate-900 mb-1">
                {option.label}
              </span>
              <span className="block text-xs text-slate-600 leading-relaxed">
                {option.description}
              </span>
            </button>
          );
        })}
      </div>

      {validationError && (
        <p className="text-sm font-medium text-amber-700 mb-4">{validationError}</p>
      )}

      <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => {
            setValidationError(null);
            setStepIndex((i) => Math.max(0, i - 1));
          }}
          disabled={stepIndex === 0}
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 ${
            stepIndex === 0 ? 'invisible' : ''
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <button
          type="button"
          disabled={isSaving}
          onClick={handleNext}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-60 whitespace-nowrap shrink-0"
        >
          {stepIndex === QUIZ_STEPS.length - 1
            ? isSaving
              ? 'Saving Plan...'
              : 'See My Personalized Plan'
            : 'Next'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
