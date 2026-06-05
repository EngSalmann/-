/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  uid: string;
  email: string;
  credits: number; // For AI generation (starts at 100, earned back by achievements / daily challenges)
  streakCount: number;
  lastReviewedAt: string | null;
  streakUpdateDate: string | null; // Date (YYYY-MM-DD) on which streak was verified active
  unlockedBadges: string[]; // List of badge ID strings unlocked
  totalReviews: number; // Total number of individual cards answered
  masteryScore: number; // Numerical metric of user's cumulative mastery level
  createdAt: string;
}

export interface Deck {
  id: string;
  userId: string;
  title: string;
  description: string;
  cardCount: number;
  createdAt: string;
  lastSyncedAt?: string;
}

export interface Card {
  id: string;
  deckId: string;
  userId: string;
  front: string;
  back: string;
  arabicFront: string;
  arabicBack: string;
  interval: number; // Interval in days (SM-2 spaced repetition state)
  eaFactor: number; // Easeness factor (SM-2 spaced repetition state, starts at 2.5)
  repetitions: number; // Consecutive successful repetitions (SM-2 state)
  nextDue: string; // ISO String representation of next review schedule.
  masteryLevel: number; // 0 to 5 level mapping mastery degree (0 = Learning, 5 = Mastered)
  notes?: string; // Optional student context/mnemonics (ideal for keyword filtering/search)
}

export interface DailyChallenge {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  targetCount: number;
  currentCount: number;
  rewardCredits: number;
  completed: boolean;
  type: "review" | "generate" | "perfect"; // review cards, generate AI cards, score full marks on a review
}

export interface Badge {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  icon: string; // Lucide icon reference string
  color: string; // Tailwind color string for outline/accents
  requirementText: string;
  requirementTextAr: string;
}

export const STUDY_BADGES: Badge[] = [
  {
    id: "first_steps",
    title: "First Steps",
    titleAr: "خطوتك الأولى للتفوّق",
    description: "Create or generate your first study deck of cards.",
    descriptionAr: "ابدأ رحلتك الدراسية عبر إنشاء مادتك أو منهجك الخاص مع توليد أول حزمة بطاقات مخصصة.",
    icon: "BookOpen",
    color: "from-blue-600 to-cyan-500",
    requirementText: "Decks >= 1",
    requirementTextAr: "إنشاء مادة دراسية واحدة على الأقل"
  },
  {
    id: "early_bird",
    title: "Dedicated Scholar",
    titleAr: "الباحث الأكاديمي المتميّز",
    description: "Complete your first spaced repetition review session.",
    descriptionAr: "ادخل أجواء المذاكرة الحقيقية وأتمم أول اختبار مراجعة ذكي متباعد للبطاقات المستحقة.",
    icon: "CheckCircle2",
    color: "from-emerald-500 to-teal-400",
    requirementText: "Total Reviews >= 1",
    requirementTextAr: "إكمال أول جلسة مراجعة مكررة ناجحة بنجاح"
  },
  {
    id: "streak_3",
    title: "3-Day Fire",
    titleAr: "لهيب المذاكرة (٣ أيام)",
    description: "Maintain a study streak of 3 consecutive learning days.",
    descriptionAr: "أثبت جدّيتك من خلال المحافظة على رتم مذاكرة يومي مستمر لمدّة ثلاثة أيام متتالية دون انقطاع.",
    icon: "Flame",
    color: "from-amber-500 to-orange-600",
    requirementText: "Streak >= 3",
    requirementTextAr: "المحافظة على المذاكرة لـ ٣ أيام متوالية"
  },
  {
    id: "streak_7",
    title: "7-Day Ascendant",
    titleAr: "العلامة والقمة الأسبوعية",
    description: "Secure a full 1-week continuous study streak.",
    descriptionAr: "القمّة الحقيقية والالتزام الفولاذي! حافظ على سلسلة مذاكرة وحفظ مستمرّة لأسبوع كامل بلا غياب.",
    icon: "Award",
    color: "from-fuchsia-500 to-pink-600",
    requirementText: "Streak >= 7",
    requirementTextAr: "المحافظة على المذاكرة لـ ٧ أيام متوالية"
  },
  {
    id: "ai_explorer",
    title: "AI Synthesizer",
    titleAr: "مُحفّز الذكاء الاصطناعي الأكاديمي",
    description: "Generate cards using the smart Gemini language model engine.",
    descriptionAr: "دمج التقنية بالتعليم! ابتكر وولد دروس وبطاقات ذكية متكاملة بالاستعانة بمحرك ذكاء Gemini الفائق.",
    icon: "Sparkles",
    color: "from-yellow-400 to-amber-500",
    requirementText: "AI decks generated",
    requirementTextAr: "توليد بطاقات وحزم بالذكاء الاصطناعي بنجاح"
  },
  {
    id: "master_10",
    title: "Zen Brain",
    titleAr: "سيد الذاكرة المطلقة",
    description: "Reach elite mastery level (Level 5) on at least 10 cards.",
    descriptionAr: "أثبت حفظك الخارق! أوصل ما لا يقل عن ١٠ بطاقات ومصطلحات إلى مستوى الإتقان النهائي (المستوى ٥).",
    icon: "Brain",
    color: "from-violet-600 to-fuchsia-700",
    requirementText: "Mastered Cards >= 10",
    requirementTextAr: "بلوغ ١٠ بطاقات لمستوى التكرار النهائي الـ ٥"
  },
  {
    id: "offline_survivor",
    title: "Nomad Scholar",
    titleAr: "الرحالة والمذاكر الصامد",
    description: "Review your flashcards and progress completely offline.",
    descriptionAr: "لا تراجع أمام الصعاب! قم بمذاكرة واسترجاع بطاقاتك واثبات تقدمك حتى دون توفر اتصال بالشبكة.",
    icon: "WifiOff",
    color: "from-sky-400 to-blue-600",
    requirementText: "Study Offline",
    requirementTextAr: "المذاكرة الفعّالة واستدعاء البطاقات بوضع الأوفلاين"
  }
];
