import { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ArrowRight, LogOut } from 'lucide-react';
import { AskFinGuidePanel } from './components/AskFinGuidePanel';
import { CompareProductsPanel } from './components/CompareProductsPanel';
import { ConfidenceCheckPanel } from './components/ConfidenceCheckPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GrowthVisualizerPanel } from './components/GrowthVisualizerPanel';
import { ProModal } from './components/ProModal';
import { ValidationStatsModal } from './components/ValidationStatsModal';
import { auth, signInWithGoogle, signOutUser } from './firebase';
import {
  fetchUserAssessment,
  incrementCloudStat,
  loadGuestAssessment,
  loadLocalMetrics,
  markUserSessionComplete,
  recordLocalVisit,
  saveGuestAssessment,
  saveLocalMetrics,
  saveUserAssessment,
  submitWtpFeedback,
  syncUserProfile,
} from './services/finguideStore';
import { AssessmentAnswers, StoredAssessment, WtpChoice } from './types/finguide';

type WorkspaceTab = 'assessment' | 'compare' | 'assistant' | 'calculator';

const TABS: Array<{ id: WorkspaceTab; label: string }> = [
  { id: 'assessment', label: '1. Confidence Check' },
  { id: 'compare', label: '2. Compare Options' },
  { id: 'assistant', label: '3. Ask FinGuide AI' },
  { id: 'calculator', label: '4. SIP vs FD Visualizer' },
];

const HERO_IMAGE_PATH = '/src/assets/images/finguide_hero_editorial_1794896071368.jpg';

function GoogleLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 6-1.1 8-3l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.2 0-5.9-2.1-6.8-5H1.2v3.1C3.2 21.3 7.3 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.2 14.2c-.2-.7-.4-1.5-.4-2.2s.2-1.5.4-2.2V6.7H1.2C.4 8.3 0 10.1 0 12s.4 3.7 1.2 5.3l4-3.1z"
      />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.3 0 3.2 2.7 1.2 6.7l4 3.1c.9-2.9 3.6-5 6.8-5z"
      />
    </svg>
  );
}

function FinGuideApp() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('assessment');
  const [savedAssessment, setSavedAssessment] = useState<StoredAssessment | null>(() =>
    loadGuestAssessment(),
  );
  const [isSavingAssessment, setIsSavingAssessment] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [heroImageFailed, setHeroImageFailed] = useState(false);

  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const hasRecordedVisitRef = useRef(false);

  useEffect(() => {
    if (!hasRecordedVisitRef.current) {
      hasRecordedVisitRef.current = true;
      recordLocalVisit();
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);

      if (firebaseUser) {
        try {
          await syncUserProfile(firebaseUser);
          await incrementCloudStat('visits');
          const cloudAssessment = await fetchUserAssessment(firebaseUser.uid);
          if (cloudAssessment) {
            setSavedAssessment(cloudAssessment);
          } else {
            const guest = loadGuestAssessment();
            if (guest) {
              const migrated = await saveUserAssessment(firebaseUser.uid, guest, guest.score);
              setSavedAssessment(migrated);
            }
          }
        } catch (err) {
          console.error('Auth sync error:', err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code: unknown }).code)
          : '';
      if (code === 'auth/popup-closed-by-user') {
        return;
      }
      setAuthError(
        err instanceof Error ? err.message : 'Unable to complete Google Sign-In. Please allow popups and try again.',
      );
    }
  };

  const handleSignOut = async () => {
    setAuthError(null);
    await signOutUser();
  };

  const scrollToWorkspace = (tab: WorkspaceTab) => {
    setActiveTab(tab);
    workspaceRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSaveAssessment = async (answers: AssessmentAnswers, score: number) => {
    setIsSavingAssessment(true);
    try {
      const local = loadLocalMetrics();
      local.quizCompleted += 1;
      saveLocalMetrics(local);

      if (user) {
        const stored = await saveUserAssessment(user.uid, answers, score);
        setSavedAssessment(stored);
        await incrementCloudStat('quizCompleted');
      } else {
        const guestRecord: StoredAssessment = {
          userId: 'guest',
          ...answers,
          score,
          sessionCompleted: false,
        };
        saveGuestAssessment(guestRecord);
        setSavedAssessment(guestRecord);
      }
    } finally {
      setIsSavingAssessment(false);
    }
  };

  const handleMarkSessionComplete = async () => {
    if (!savedAssessment || savedAssessment.sessionCompleted) return;
    setIsSavingAssessment(true);
    try {
      const local = loadLocalMetrics();
      local.sessionsCompleted += 1;
      saveLocalMetrics(local);

      if (user) {
        await markUserSessionComplete(user.uid);
        await incrementCloudStat('sessionsCompleted');
        setSavedAssessment({ ...savedAssessment, sessionCompleted: true });
      } else {
        const updated = { ...savedAssessment, sessionCompleted: true };
        saveGuestAssessment(updated);
        setSavedAssessment(updated);
      }
    } finally {
      setIsSavingAssessment(false);
    }
  };

  const handleSubmitWtp = async (choice: WtpChoice, note: string) => {
    await submitWtpFeedback(user, choice, note);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-element wordmark */}
          <a
            href="#top"
            className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            FinGuide AI
          </a>

          {/* Zone 2: 4 concise single-line nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              type="button"
              onClick={() => scrollToWorkspace('assessment')}
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Confidence Check
            </button>
            <button
              type="button"
              onClick={() => scrollToWorkspace('compare')}
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Compare Options
            </button>
            <button
              type="button"
              onClick={() => scrollToWorkspace('assistant')}
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Ask FinGuide AI
            </button>
            <button
              type="button"
              onClick={() => scrollToWorkspace('calculator')}
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Growth Visualizer
            </button>
          </nav>

          {/* Zone 3: Single primary auth action */}
          <div className="flex items-center gap-3 shrink-0">
            {!authReady ? (
              <div className="w-28 h-9 bg-slate-100 rounded-lg animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-2.5">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Google profile'}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-full object-cover border border-slate-200"
                  />
                ) : (
                  <span className="w-7 h-7 rounded-full bg-blue-700 text-white text-xs font-semibold flex items-center justify-center">
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="hidden sm:inline text-sm font-medium text-slate-800 max-w-[120px] truncate">
                  {user.displayName?.split(' ')[0] || 'Account'}
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign out
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              >
                <GoogleLogo />
                Sign in with Google
              </button>
            )}
          </div>
        </div>
      </header>

      {authError && (
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 pt-4">
          <div className="px-4 py-2.5 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between gap-4">
            <span>{authError}</span>
            <button
              type="button"
              onClick={() => setAuthError(null)}
              className="text-amber-900 underline shrink-0"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <main id="top" className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-10">
        {/* Hero 2-Column Split */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-10">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-7 sm:p-10 flex flex-col justify-between">
            <div>
              <p className="text-xs font-medium text-blue-700 mb-3">
                Indian Personal Finance Education · Free for Students &amp; Young Earners
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight text-balance mb-4">
                Understand money and investments in simple language before you invest.
              </h1>
              <p className="text-base text-slate-600 leading-relaxed max-w-2xl mb-8">
                Confused by mutual funds, FDs, SIPs, insurance, and scattered online advice?
                Complete a 5-minute Financial Confidence Check to get a jargon-free learning roadmap
                matched to your savings and risk comfort.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => scrollToWorkspace('assessment')}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
              >
                Take the Free 5-Min Confidence Check
                <ArrowRight className="w-4 h-4" />
              </button>

              {!user && (
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="inline-flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
                >
                  <GoogleLogo />
                  Save Progress Free
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 min-h-[260px]">
            {!heroImageFailed ? (
              <img
                src={HERO_IMAGE_PATH}
                alt="Minimalist architectural illustration representing steady compounding growth"
                referrerPolicy="no-referrer"
                onError={() => setHeroImageFailed(true)}
                className="w-full h-full lg:h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-900 via-blue-950 to-emerald-950" />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent flex flex-col justify-end p-6 text-white">
              <p className="text-xs font-medium text-emerald-300 mb-1">
                Educational Guardrail · Zero Trading or Sales
              </p>
              <p className="text-sm text-slate-100 leading-relaxed">
                Start with ₹500/month clarity—compare FDs, Liquid Funds, PPF, and Nifty 50 Index
                SIPs side by side before putting a single rupee at risk.
              </p>
            </div>
          </div>
        </section>

        {/* Main Interactive Workspace */}
        <section ref={workspaceRef} aria-label="FinGuide AI Workspace">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-xl w-fit mb-6">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'assessment' && (
            <ConfidenceCheckPanel
              user={user}
              savedAssessment={savedAssessment}
              isSaving={isSavingAssessment}
              onSaveAssessment={handleSaveAssessment}
              onMarkSessionComplete={handleMarkSessionComplete}
              onNavigateCompare={() => setActiveTab('compare')}
              onOpenGoogleSignIn={handleGoogleSignIn}
            />
          )}

          {activeTab === 'compare' && <CompareProductsPanel />}

          {activeTab === 'assistant' && (
            <AskFinGuidePanel profileContext={savedAssessment} />
          )}

          {activeTab === 'calculator' && <GrowthVisualizerPanel />}
        </section>

        {/* FinGuide Pro Willingness-to-Pay Validation Banner */}
        <section className="mt-8 bg-white border border-slate-200 rounded-xl p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-amber-700 mb-1">
              FinGuide Pro · ₹149/month Student Trial
            </p>
            <h3 className="text-lg font-semibold text-slate-900">
              Want monthly check-ins, personalized goal tracking, and tax clarity?
            </h3>
            <p className="text-sm text-slate-600 mt-0.5">
              Unlock our free student trial preview and share honest pricing feedback.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsProModalOpen(true)}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0 self-start sm:self-center"
          >
            Test Free Pro Trial
          </button>
        </section>

        {/* Educational Disclaimer */}
        <p className="mt-6 text-xs text-slate-500 leading-relaxed">
          Educational Purpose Only: FinGuide AI is an educational learning and comparison tool for
          Indian personal finance. It does not offer real-money investment execution, stock trading,
          insurance sales, or SEBI-registered investment advice. Always verify official offer
          documents before investing.
        </p>
      </main>

      <footer className="border-t border-slate-200 bg-white py-5 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>FinGuide AI · Student Venture MVP</span>
          <button
            type="button"
            onClick={() => setIsStatsModalOpen(true)}
            className="text-slate-600 hover:text-slate-900 hover:underline underline-offset-4 transition-colors"
          >
            Founder Validation Stats
          </button>
        </div>
      </footer>

      <ProModal
        isOpen={isProModalOpen}
        user={user}
        onClose={() => setIsProModalOpen(false)}
        onSubmitWtp={handleSubmitWtp}
        onOpenGoogleSignIn={handleGoogleSignIn}
      />

      <ValidationStatsModal
        isOpen={isStatsModalOpen}
        user={user}
        onClose={() => setIsStatsModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <FinGuideApp />
    </ErrorBoundary>
  );
}
