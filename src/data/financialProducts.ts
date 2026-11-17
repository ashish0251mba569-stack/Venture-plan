import type { AssessmentAnswers, GoalOption, RiskOption, SavingsOption, StageOption } from '../types/finguide';

export type ProductCategory = 'low' | 'medium' | 'high' | 'protection';

export interface FinancialProduct {
  id: string;
  name: string;
  category: ProductCategory;
  categoryLabel: string;
  meaning: string;
  minimumStart: string;
  riskLevel: string;
  liquidity: string;
  illustrativeReturn: string;
  bestFor: string;
  watchOut: string;
}

export const FINANCIAL_PRODUCTS: FinancialProduct[] = [
  {
    id: 'fd',
    name: 'Fixed Deposit (FD)',
    category: 'low',
    categoryLabel: 'Low Risk · Safety',
    meaning: 'Lend money to a bank for a fixed period in exchange for a fixed interest rate.',
    minimumStart: '₹1,000',
    riskLevel: 'Very Low',
    liquidity: 'Moderate (small penalty on early withdrawal)',
    illustrativeReturn: '6.0% – 7.5% p.a.',
    bestFor: 'Short-term goals (6 months – 2 years) & conservative savers',
    watchOut: 'Interest is taxed at your slab rate; may barely beat inflation over 5+ years.',
  },
  {
    id: 'liquid-mf',
    name: 'Liquid Mutual Fund',
    category: 'low',
    categoryLabel: 'Low Risk · Safety',
    meaning: 'Mutual fund investing in very short-term, high-grade debt instruments (up to 91 days).',
    minimumStart: '₹500',
    riskLevel: 'Low',
    liquidity: 'High (redeemable in 1–2 working days)',
    illustrativeReturn: '6.5% – 7.2% p.a.',
    bestFor: 'Emergency funds you may need urgently without lock-in penalties',
    watchOut: 'Returns are not guaranteed like bank FDs, though volatility is minimal.',
  },
  {
    id: 'ppf',
    name: 'Public Provident Fund (PPF)',
    category: 'medium',
    categoryLabel: 'Balanced · Tax Saving',
    meaning: 'Government-backed long-term savings account with tax-free interest and maturity.',
    minimumStart: '₹500 / year',
    riskLevel: 'Very Low (Sovereign)',
    liquidity: '15-year lock-in (partial withdrawal rules apply)',
    illustrativeReturn: '7.1% p.a. (Tax-free)',
    bestFor: 'Long-term safe corpus + Old Tax Regime Section 80C deduction',
    watchOut: 'Long 15-year lock-in makes it unsuitable for short-term purchases.',
  },
  {
    id: 'nifty-50',
    name: 'Nifty 50 Index Mutual Fund (SIP)',
    category: 'high',
    categoryLabel: 'Long-Term Growth',
    meaning: "Automatically invests across India's 50 largest listed companies in one low-cost fund.",
    minimumStart: '₹500 / month',
    riskLevel: 'Moderate–High (short term)',
    liquidity: 'High (exit anytime, market value fluctuates daily)',
    illustrativeReturn: '11% – 13% p.a. (5+ yr avg)',
    bestFor: 'First-time equity investors building wealth over 5+ years',
    watchOut: 'Can drop 10–25% during market downturns; avoid if you need money within 3 years.',
  },
  {
    id: 'flexi-cap',
    name: 'Flexi-Cap Equity Mutual Fund',
    category: 'high',
    categoryLabel: 'Long-Term Growth',
    meaning: 'Actively managed fund investing across large, mid, and small Indian companies.',
    minimumStart: '₹500 / month',
    riskLevel: 'High',
    liquidity: 'High (usually 1% exit load if redeemed under 1 year)',
    illustrativeReturn: '12% – 15% p.a. (long term)',
    bestFor: '5–10+ year wealth building after understanding index funds',
    watchOut: 'Higher expense ratio than index funds; performance depends on fund manager.',
  },
  {
    id: 'insurance',
    name: 'Term Life + Health Insurance',
    category: 'protection',
    categoryLabel: 'Protection · Must-Have',
    meaning: 'Pure financial protection against hospital bills or loss of income (not an investment).',
    minimumStart: '₹500 – ₹1,000 / mo',
    riskLevel: 'Essential Shield',
    liquidity: 'Covers medical/life emergencies',
    illustrativeReturn: 'Protects your savings',
    bestFor: 'Every earner or anyone whose family relies on their financial support',
    watchOut: 'Never mix insurance and investment (avoid high-fee endowment/ULIP bundles).',
  },
];

export interface QuizOption<T extends string> {
  value: T;
  label: string;
  description: string;
}

export interface QuizStepConfig {
  key: keyof AssessmentAnswers;
  title: string;
  subtitle: string;
  options: QuizOption<StageOption | SavingsOption | GoalOption | RiskOption>[];
}

export const QUIZ_STEPS: QuizStepConfig[] = [
  {
    key: 'stage',
    title: 'Which stage best describes you right now?',
    subtitle: 'We tailor examples and next steps to your current life stage.',
    options: [
      {
        value: 'student',
        label: 'College or MBA Student',
        description: 'Managing pocket money, internship stipend, or part-time income',
      },
      {
        value: 'fresher',
        label: 'Fresh Graduate / First Job',
        description: 'Receiving your first salary and starting to save monthly',
      },
      {
        value: 'early_pro',
        label: 'Young Professional (1–4 Years)',
        description: 'Regular income and ready for structured investing & tax clarity',
      },
    ],
  },
  {
    key: 'savings',
    title: 'How much can you realistically set aside each month?',
    subtitle: 'Starting with ₹500/month is enough to build the habit.',
    options: [
      {
        value: '500-2000',
        label: '₹500 – ₹2,000 / month',
        description: 'Starting small while learning how products work',
      },
      {
        value: '2000-5000',
        label: '₹2,000 – ₹5,000 / month',
        description: 'Steady monthly beginner savings capacity',
      },
      {
        value: '5000-15000',
        label: '₹5,000 – ₹15,000 / month',
        description: 'Ready to split savings across safety and growth',
      },
      {
        value: '15000+',
        label: '₹15,000+ / month',
        description: 'Building long-term wealth and tax efficiency',
      },
    ],
  },
  {
    key: 'goal',
    title: 'What is your #1 financial priority right now?',
    subtitle: 'Your time horizon determines how much risk makes sense.',
    options: [
      {
        value: 'emergency',
        label: 'Build an Emergency Fund',
        description: 'Safety cushion for unexpected expenses (0–2 years)',
      },
      {
        value: 'short_term',
        label: 'Short-Term Goal (1–3 Years)',
        description: 'Laptop, travel, certification, or higher studies fund',
      },
      {
        value: 'wealth',
        label: 'Long-Term Wealth (3–7+ Years)',
        description: 'Beat inflation and compound savings steadily',
      },
      {
        value: 'basics',
        label: 'Learn Everything from Scratch',
        description: 'Not sure yet — show me the smartest step-by-step order',
      },
    ],
  },
  {
    key: 'risk',
    title: 'How would you react if an investment dipped 10% temporarily?',
    subtitle: 'Be honest — matching your comfort level prevents panic selling.',
    options: [
      {
        value: 'low',
        label: 'Low Risk — Safety First',
        description: 'I prefer predictable returns without market ups and downs',
      },
      {
        value: 'moderate',
        label: 'Moderate — Balanced Approach',
        description: 'Okay with short-term swings for stronger long-term returns',
      },
      {
        value: 'high',
        label: 'Growth-Focused — Long Horizon',
        description: 'Comfortable holding through market dips for 5+ years',
      },
    ],
  },
];

export function computeConfidenceScore(answers: AssessmentAnswers): number {
  let score = 58;
  if (answers.savings !== '500-2000') score += 10;
  if (answers.goal === 'emergency' || answers.goal === 'wealth') score += 10;
  if (answers.risk === 'moderate') score += 12;
  else if (answers.risk === 'high') score += 10;
  else score += 8;
  return Math.min(100, Math.max(0, score));
}

export interface BlueprintStep {
  stepLabel: string;
  title: string;
  description: string;
}

export function buildBlueprint(answers: AssessmentAnswers): {
  profileLabel: string;
  summary: string;
  steps: BlueprintStep[];
} {
  const riskLabels: Record<RiskOption, string> = {
    low: 'Safety-First Beginner',
    moderate: 'Balanced Learner',
    high: 'Long-Term Growth Starter',
  };

  const goalText: Record<GoalOption, string> = {
    emergency: 'building your safety cushion first',
    short_term: 'protecting money you need within 1–3 years',
    wealth: 'growing long-term wealth faster than inflation',
    basics: 'learning the right order of personal finance',
  };

  const step2: BlueprintStep =
    answers.goal === 'short_term' || answers.risk === 'low'
      ? {
          stepLabel: 'Step 2 · Capital Stability',
          title: 'Fixed Deposit (FD) or Liquid Fund',
          description:
            'For money needed within 1–3 years, avoid stock market swings. FDs or Liquid Mutual Funds keep your principal steady and accessible.',
        }
      : {
          stepLabel: 'Step 2 · First Growth SIP',
          title: 'Nifty 50 Index Mutual Fund (SIP)',
          description:
            'Start a small monthly SIP (₹500–₹1,000) in a low-cost Nifty 50 Index Fund for 5+ years to experience market compounding calmly.',
        };

  const step3: BlueprintStep =
    answers.stage === 'student'
      ? {
          stepLabel: 'Step 3 · Smart Habits',
          title: 'Spending Clarity & Protection Basics',
          description:
            'Keep clear separation between monthly spends and savings, avoid revolving credit-card debt, and understand how health cover protects your family.',
        }
      : {
          stepLabel: 'Step 3 · Protection & Tax',
          title: 'Health/Term Cover & Regime Clarity',
          description:
            'Before chasing high returns, verify standalone health insurance (beyond employer cover) and compare New vs. Old Tax Regime before locking money in 80C.',
        };

  return {
    profileLabel: riskLabels[answers.risk],
    summary: `Based on your monthly capacity (₹${answers.savings}) and ${answers.risk} risk comfort, focus first on ${goalText[answers.goal]}.`,
    steps: [
      {
        stepLabel: 'Step 1 · Foundation',
        title: '3–6 Month Emergency Cushion',
        description:
          'Park starter emergency cash in a high-interest savings account or Liquid Mutual Fund so unexpected expenses never force you to break investments.',
      },
      step2,
      step3,
    ],
  };
}

export const PRESET_QUESTIONS: string[] = [
  'What is a SIP and can I start with ₹500?',
  'FD vs Mutual Fund — which is better for beginners?',
  'How much emergency fund do I need as a student or fresher?',
  'What is a Nifty 50 Index Fund?',
  'Term insurance vs LIC/Endowment plan?',
];
