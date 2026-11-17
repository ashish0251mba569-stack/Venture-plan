export type StageOption = 'student' | 'fresher' | 'early_pro';
export type SavingsOption = '500-2000' | '2000-5000' | '5000-15000' | '15000+';
export type GoalOption = 'emergency' | 'short_term' | 'wealth' | 'basics';
export type RiskOption = 'low' | 'moderate' | 'high';
export type WtpChoice = 'yes_149' | 'maybe_99' | 'free_only';

export const SCHEMA_LIMITS = {
  UID_MAX: 128,
  DISPLAY_NAME_MAX: 100,
  EMAIL_MAX: 200,
  PHOTO_URL_MAX: 500,
  WTP_NOTE_MAX: 500,
  SCORE_MIN: 0,
  SCORE_MAX: 100,
} as const;

export interface AssessmentAnswers {
  stage: StageOption;
  savings: SavingsOption;
  goal: GoalOption;
  risk: RiskOption;
}

export interface StoredAssessment extends AssessmentAnswers {
  userId: string;
  score: number;
  sessionCompleted: boolean;
}

export interface WtpSubmission {
  id?: string;
  userId: string;
  userEmail: string;
  choice: WtpChoice;
  note: string;
  timestamp: string;
}

export interface ValidationStatsSummary {
  visits: number;
  quizCompleted: number;
  sessionsCompleted: number;
  wtpTotal: number;
  wtpYes149: number;
  wtpMaybe99: number;
  wtpFreeOnly: number;
}

export const FOUNDER_ADMIN_EMAIL = 'ashish.0251mba569@dgu.ac.in';
