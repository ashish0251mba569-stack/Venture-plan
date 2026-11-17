import type { User } from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  AssessmentAnswers,
  FOUNDER_ADMIN_EMAIL,
  SCHEMA_LIMITS,
  StoredAssessment,
  ValidationStatsSummary,
  WtpChoice,
  WtpSubmission,
} from '../types/finguide';

const LOCAL_METRICS_KEY = 'finguide_mvp_metrics_v2';
const LOCAL_ASSESSMENT_KEY = 'finguide_guest_assessment_v2';

interface LocalMetrics {
  visits: number;
  quizCompleted: number;
  sessionsCompleted: number;
  wtpResponses: WtpSubmission[];
}

export function loadLocalMetrics(): LocalMetrics {
  const fallback: LocalMetrics = {
    visits: 0,
    quizCompleted: 0,
    sessionsCompleted: 0,
    wtpResponses: [],
  };
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_METRICS_KEY) || '{}');
    return {
      visits: typeof parsed.visits === 'number' ? parsed.visits : 0,
      quizCompleted: typeof parsed.quizCompleted === 'number' ? parsed.quizCompleted : 0,
      sessionsCompleted: typeof parsed.sessionsCompleted === 'number' ? parsed.sessionsCompleted : 0,
      wtpResponses: Array.isArray(parsed.wtpResponses) ? parsed.wtpResponses : [],
    };
  } catch {
    return fallback;
  }
}

export function saveLocalMetrics(data: LocalMetrics) {
  localStorage.setItem(LOCAL_METRICS_KEY, JSON.stringify(data));
}

export function recordLocalVisit(): LocalMetrics {
  const metrics = loadLocalMetrics();
  metrics.visits += 1;
  saveLocalMetrics(metrics);
  return metrics;
}

export function resetLocalMetrics() {
  localStorage.removeItem(LOCAL_METRICS_KEY);
}

export function loadGuestAssessment(): StoredAssessment | null {
  try {
    const raw = localStorage.getItem(LOCAL_ASSESSMENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAssessment;
  } catch {
    return null;
  }
}

export function saveGuestAssessment(data: StoredAssessment) {
  localStorage.setItem(LOCAL_ASSESSMENT_KEY, JSON.stringify(data));
}

function clampString(val: string | null | undefined, max: number, fallback = ''): string {
  const trimmed = (val ?? fallback).trim();
  return trimmed.slice(0, max);
}

export async function syncUserProfile(user: User): Promise<void> {
  const path = `users/${user.uid}`;
  const userRef = doc(db, 'users', user.uid);
  const payload = {
    displayName: clampString(user.displayName, SCHEMA_LIMITS.DISPLAY_NAME_MAX, 'Student User'),
    email: clampString(user.email, SCHEMA_LIMITS.EMAIL_MAX, 'user@example.com'),
    ...(user.photoURL ? { photoURL: clampString(user.photoURL, SCHEMA_LIMITS.PHOTO_URL_MAX) } : {}),
  };

  let exists = false;
  try {
    const snap = await getDoc(userRef);
    exists = snap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  if (!exists) {
    try {
      await setDoc(userRef, {
        uid: user.uid,
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  } else {
    try {
      await updateDoc(userRef, {
        ...payload,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }
}

export async function fetchUserAssessment(uid: string): Promise<StoredAssessment | null> {
  const path = `assessments/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'assessments', uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      userId: String(data.userId),
      stage: data.stage,
      savings: data.savings,
      goal: data.goal,
      risk: data.risk,
      score: Number(data.score),
      sessionCompleted: Boolean(data.sessionCompleted),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserAssessment(
  uid: string,
  answers: AssessmentAnswers,
  score: number,
): Promise<StoredAssessment> {
  const path = `assessments/${uid}`;
  const ref = doc(db, 'assessments', uid);
  const clampedScore = Math.min(SCHEMA_LIMITS.SCORE_MAX, Math.max(SCHEMA_LIMITS.SCORE_MIN, Math.round(score)));

  let exists = false;
  try {
    const snap = await getDoc(ref);
    exists = snap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  if (!exists) {
    try {
      await setDoc(ref, {
        userId: uid,
        stage: answers.stage,
        savings: answers.savings,
        goal: answers.goal,
        risk: answers.risk,
        score: clampedScore,
        sessionCompleted: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  } else {
    try {
      await updateDoc(ref, {
        stage: answers.stage,
        savings: answers.savings,
        goal: answers.goal,
        risk: answers.risk,
        score: clampedScore,
        sessionCompleted: false,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  return {
    userId: uid,
    ...answers,
    score: clampedScore,
    sessionCompleted: false,
  };
}

export async function markUserSessionComplete(uid: string): Promise<void> {
  const path = `assessments/${uid}`;
  try {
    await updateDoc(doc(db, 'assessments', uid), {
      sessionCompleted: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function incrementCloudStat(
  field: keyof Omit<ValidationStatsSummary, 'wtpTotal'>,
  alsoIncrementWtpTotal = false,
): Promise<void> {
  const path = 'validation_stats/summary';
  const summaryRef = doc(db, 'validation_stats', 'summary');

  let exists = false;
  try {
    const snap = await getDoc(summaryRef);
    exists = snap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  if (!exists) {
    try {
      await setDoc(summaryRef, {
        visits: field === 'visits' ? 1 : 0,
        quizCompleted: field === 'quizCompleted' ? 1 : 0,
        sessionsCompleted: field === 'sessionsCompleted' ? 1 : 0,
        wtpTotal: alsoIncrementWtpTotal ? 1 : 0,
        wtpYes149: field === 'wtpYes149' ? 1 : 0,
        wtpMaybe99: field === 'wtpMaybe99' ? 1 : 0,
        wtpFreeOnly: field === 'wtpFreeOnly' ? 1 : 0,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  } else {
    try {
      const updates: Record<string, unknown> = {
        [field]: increment(1),
        updatedAt: serverTimestamp(),
      };
      if (alsoIncrementWtpTotal) {
        updates.wtpTotal = increment(1);
      }
      await updateDoc(summaryRef, updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }
}

export async function submitWtpFeedback(
  user: User | null,
  choice: WtpChoice,
  note: string,
): Promise<WtpSubmission> {
  const safeNote = clampString(note, SCHEMA_LIMITS.WTP_NOTE_MAX);
  const localMetrics = loadLocalMetrics();
  const submission: WtpSubmission = {
    userId: user ? user.uid : 'guest',
    userEmail: user ? clampString(user.email, SCHEMA_LIMITS.EMAIL_MAX, 'guest') : 'guest',
    choice,
    note: safeNote,
    timestamp: new Date().toISOString(),
  };
  localMetrics.wtpResponses.push(submission);
  saveLocalMetrics(localMetrics);

  if (user && user.emailVerified) {
    const path = 'wtp_feedback';
    try {
      await addDoc(collection(db, path), {
        userId: user.uid,
        userEmail: clampString(user.email, SCHEMA_LIMITS.EMAIL_MAX, 'user@example.com'),
        choice,
        note: safeNote,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }

    const statField =
      choice === 'yes_149' ? 'wtpYes149' : choice === 'maybe_99' ? 'wtpMaybe99' : 'wtpFreeOnly';
    await incrementCloudStat(statField, true);
  }

  return submission;
}

export async function fetchValidationOverview(user: User | null): Promise<{
  summary: ValidationStatsSummary;
  feedbackRows: WtpSubmission[];
  source: 'cloud' | 'local';
}> {
  const local = loadLocalMetrics();
  const localSummary: ValidationStatsSummary = {
    visits: local.visits,
    quizCompleted: local.quizCompleted,
    sessionsCompleted: local.sessionsCompleted,
    wtpTotal: local.wtpResponses.length,
    wtpYes149: local.wtpResponses.filter((r) => r.choice === 'yes_149').length,
    wtpMaybe99: local.wtpResponses.filter((r) => r.choice === 'maybe_99').length,
    wtpFreeOnly: local.wtpResponses.filter((r) => r.choice === 'free_only').length,
  };

  if (!user || !user.emailVerified) {
    return { summary: localSummary, feedbackRows: local.wtpResponses, source: 'local' };
  }

  const summaryPath = 'validation_stats/summary';
  let cloudSummary = localSummary;
  try {
    const snap = await getDoc(doc(db, 'validation_stats', 'summary'));
    if (snap.exists()) {
      const d = snap.data();
      cloudSummary = {
        visits: Math.max(localSummary.visits, Number(d.visits) || 0),
        quizCompleted: Math.max(localSummary.quizCompleted, Number(d.quizCompleted) || 0),
        sessionsCompleted: Math.max(localSummary.sessionsCompleted, Number(d.sessionsCompleted) || 0),
        wtpTotal: Math.max(localSummary.wtpTotal, Number(d.wtpTotal) || 0),
        wtpYes149: Math.max(localSummary.wtpYes149, Number(d.wtpYes149) || 0),
        wtpMaybe99: Math.max(localSummary.wtpMaybe99, Number(d.wtpMaybe99) || 0),
        wtpFreeOnly: Math.max(localSummary.wtpFreeOnly, Number(d.wtpFreeOnly) || 0),
      };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, summaryPath);
  }

  const isAdmin = user.email === FOUNDER_ADMIN_EMAIL;
  const feedbackPath = 'wtp_feedback';
  const rows: WtpSubmission[] = [];

  try {
    const q = isAdmin
      ? query(collection(db, feedbackPath))
      : query(collection(db, feedbackPath), where('userId', '==', user.uid));
    const docs = await getDocs(q);
    docs.forEach((docSnap) => {
      const d = docSnap.data();
      rows.push({
        id: docSnap.id,
        userId: String(d.userId || ''),
        userEmail: String(d.userEmail || ''),
        choice: d.choice as WtpChoice,
        note: String(d.note || ''),
        timestamp: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : new Date().toISOString(),
      });
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, feedbackPath);
  }

  return {
    summary: cloudSummary,
    feedbackRows: rows.length > 0 ? rows : local.wtpResponses,
    source: 'cloud',
  };
}

export async function resetCloudValidationStats(): Promise<void> {
  const path = 'validation_stats/summary';
  try {
    await setDoc(doc(db, 'validation_stats', 'summary'), {
      visits: 0,
      quizCompleted: 0,
      sessionsCompleted: 0,
      wtpTotal: 0,
      wtpYes149: 0,
      wtpMaybe99: 0,
      wtpFreeOnly: 0,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
