import React, { useState } from "react";
import { Card } from "../types";
import { 
  ArrowLeft, 
  RotateCw, 
  CheckCircle, 
  Volume2, 
  HelpCircle, 
  Coins, 
  Award, 
  Trophy, 
  ChevronRight, 
  Sparkles, 
  Star, 
  Check, 
  X, 
  BookOpen,
  Lock
} from "lucide-react";

interface SpacedReviewSessionProps {
  deckTitle: string;
  cards: Card[];
  onReviewCompleted: (cardId: string, rating: number) => void;
  onFinishSession: () => void;
  isEcoMode: boolean;
  onEarnBonusCredits?: (amount: number) => void;
}

interface QuizQuestion {
  cardId: string;
  question: string;
  correctAnswer: string;
  choices: string[];
}

// Simple Fisher-Yates shuffle helper
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function SpacedReviewSession({
  deckTitle,
  cards,
  onReviewCompleted,
  onFinishSession,
  isEcoMode,
  onEarnBonusCredits
}: SpacedReviewSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [sessionScores, setSessionScores] = useState<number[]>([]);

  // Quiz-related state
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [claimedBonus, setClaimedBonus] = useState(false);

  // Filter out any empty lists
  if (cards.length === 0) {
    return (
      <div className="bg-[#0D0D0F] p-8 rounded-3xl border border-white/5 text-center max-w-md mx-auto font-arabic" dir="rtl">
        <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4 animate-bounce" />
        <h3 className="text-lg font-bold text-white mb-2 font-arabic">اكتملت المراجعة بالكامل! 🎉</h3>
        <p className="text-xs text-white/50 mb-6 leading-relaxed font-light">
          عمل دراسي مذهل ورائع! لا توجد حالياً بطاقات إستذكار مستحقة للمراجعة في هذه المادة الدراسية.
        </p>
        <button
          onClick={onFinishSession}
          className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl transition-all cursor-pointer font-arabic"
        >
          العودة للوحة التحكم الرئيسية
        </button>
      </div>
    );
  }

  const activeCard = cards[currentIndex];

  const handleSpeak = (text: string, lang: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      
      // Attempt to pick an Arabic/fitting Voice
      const voices = window.speechSynthesis.getVoices();
      if (lang.startsWith("ar")) {
        const arabicVoice = voices.find(v => v.lang.startsWith("ar"));
        if (arabicVoice) utterance.voice = arabicVoice;
      } else {
        const englishVoice = voices.find(v => v.lang.startsWith("en"));
        if (englishVoice) utterance.voice = englishVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const submitRating = (rating: number) => {
    onReviewCompleted(activeCard.id, rating);
    const updatedScores = [...sessionScores, rating];
    setSessionScores(updatedScores);

    if (currentIndex + 1 < cards.length) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      setSessionCompleted(true);
    }
  };

  // Turn Reviewed Cards into a short multiple-choice Quiz
  const startQuiz = () => {
    const generated: QuizQuestion[] = cards.map((card) => {
      const qText = card.arabicFront || card.front;
      const aText = card.arabicBack || card.back;
      
      // Gather other reviewed card answers to acts as distractors
      const otherAnswers = cards
        .map(c => c.arabicBack || c.back)
        .filter(ans => ans !== aText);
        
      // Excellent fallback distractors to ensure 4 options even on single card decks
      const fallbackDistractors = [
        "مفهوم تفاعلي آخر متبع في المادة العلمية ومناهج الوزارة لطلاب الثانوية والجامعة",
        "تطبيق عملي بديل يتطلب مراجعة الأقسام العلمية السابقة",
        "فرضية رياضية أو إطار تحليلي متكامل لا يرتبط مباشرة بالتعريف الحالي",
        "قالب منهجي افتراضي لجدولة مخرعات التعليم متباعد الفترات",
        "معيار استقصائي عشوائي تم حذفه من مخرجات الفصل الأكاديمي الحالية"
      ];
      
      const uniqueDistractors = Array.from(new Set(otherAnswers));
      
      while (uniqueDistractors.length < 3) {
        const randomFallback = fallbackDistractors[Math.floor(Math.random() * fallbackDistractors.length)];
        if (!uniqueDistractors.includes(randomFallback)) {
          uniqueDistractors.push(randomFallback);
        }
      }
      
      const finalDistractors = uniqueDistractors.slice(0, 3);
      const shuffledChoices = shuffleArray([...finalDistractors, aText]);
      
      return {
        cardId: card.id,
        question: qText,
        correctAnswer: aText,
        choices: shuffledChoices
      };
    });

    setQuizQuestions(generated);
    setQuizIndex(0);
    setSelectedAnswer(null);
    setQuizScore(0);
    setQuizFinished(false);
    setIsQuizActive(true);
    setClaimedBonus(false);
  };

  const handleSelectQuizAnswer = (option: string) => {
    if (selectedAnswer !== null) return; // Answer locked
    setSelectedAnswer(option);
    
    const isCorrect = option === quizQuestions[quizIndex].correctAnswer;
    if (isCorrect) {
      setQuizScore(prev => prev + 1);
    }
  };

  const handleNextQuizQuestion = () => {
    if (quizIndex + 1 < quizQuestions.length) {
      setQuizIndex(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      setQuizFinished(true);
    }
  };

  // Claim Rewards
  const claimQuizBonus = () => {
    if (claimedBonus) return;
    setClaimedBonus(true);
    
    // Perfect quiz scores grant +25 credits, partial attempts grant +10 credits!
    const isPerfect = quizScore === quizQuestions.length;
    const bonus = isPerfect ? 25 : 10;
    
    if (onEarnBonusCredits) {
      onEarnBonusCredits(bonus);
    }
  };

  // Render Quiz component UI
  if (isQuizActive) {
    if (quizFinished) {
      const isPerfect = quizScore === quizQuestions.length;
      const pct = Math.round((quizScore / quizQuestions.length) * 100);
      
      return (
        <div className="bg-[#0D0D0F] p-8 rounded-3xl border border-white/5 shadow-2xl max-w-lg mx-auto text-center font-arabic relative overflow-hidden" dir="rtl">
          {/* Glowing Accents */}
          <div className="absolute -right-24 -top-24 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -left-24 -bottom-24 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10 space-y-6">
            <div className="mx-auto w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center animate-bounce">
              <Trophy className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-white">نتائج الاختبار القصير المتكامل! 🎊</h2>
              <p className="text-xs text-white/50 mt-1 max-w-sm mx-auto font-light leading-relaxed">
                أظهرت مستويات تركيز مذهلة! بمجرد مراجعة بطاقاتك، اختبرت معلوماتك لتوليد مسارات ثابتة بالذاكرة.
              </p>
            </div>

            {/* Scorecard panel */}
            <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl max-w-sm mx-auto space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#A1A1AA] font-light">الدقة العامة والدراسات</span>
                <span className="text-xs px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-white font-sans font-bold">{pct}%</span>
              </div>
              <div className="flex justify-between items-center items-baseline border-t border-white/5 pt-3">
                <span className="text-xs text-[#A1A1AA] font-light font-arabic">الإجابات الصحيحة</span>
                <span className="text-2xl font-black text-emerald-400 font-sans tracking-tight">
                  {quizScore} <span className="text-xs font-normal text-[#A1A1AA] font-arabic">من أصل {quizQuestions.length}</span>
                </span>
              </div>
            </div>

            {/* Reinforcement message */}
            <p className="text-xs text-amber-500 max-w-sm mx-auto leading-relaxed">
              {isPerfect 
                ? "🏆 أداء أسطوري استثنائي! درجة كاملة تدل على قوة حفظك التام للمادة العلمية."
                : pct >= 70
                ? "✨ مستوى أداء رائع! لقد تخطيت الاختبار بكفاءة عالية وتأكد حفظك لغالبية المصطلحات."
                : "📚 بداية موفقة! الممارسة المستمرة والمراجعة المتباعدة كفيلة بتحسين وتجاوز الصعاب غداً."}
            </p>

            {/* Reward Box */}
            <div className="bg-[#1c1917]/30 border border-amber-500/10 p-5 rounded-2xl text-right max-w-sm mx-auto space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-500 animate-pulse" />
                  مكافأة الاختبار المكتمل
                </span>
                <span className="text-xs font-bold text-amber-400 font-sans font-bold">+{isPerfect ? "25" : "10"} نقطة مجانية</span>
              </div>
              <p className="text-[10px] text-white/50 leading-relaxed font-light">
                {isPerfect 
                  ? "لأنك حصلت على المجموع العلامة الكاملة، تم تنشيط كوبون المكافأة الذهبى الأكاديمي."
                  : "دعم مخصص كتشجيع حقيقي لجهدك في استكمال الاختبار لتوليد البطاقات لاحقاً."}
              </p>

              <button
                onClick={claimQuizBonus}
                disabled={claimedBonus}
                className={`mt-3 w-full py-2 rounded-xl text-xs font-bold transition-all shadow px-4 flex items-center justify-center gap-1.5 cursor-pointer ${
                  claimedBonus 
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                    : "bg-amber-500 hover:bg-amber-400 text-black active:scale-95"
                }`}
              >
                {claimedBonus ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>تم حصد الرصيد بنجاح ومزامنته ✓</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-black animate-spin-slow" />
                    <span>حصد نقاط المكافأة فورا</span>
                  </>
                )}
              </button>
            </div>

            {/* Completion Buttons */}
            <div className="space-y-3 pt-2">
              <button
                onClick={onFinishSession}
                className="w-full py-3 bg-[#111115] hover:bg-[#16161b] border border-white/5 text-white font-bold text-xs rounded-xl tracking-wide transition-all shadow cursor-pointer text-center block"
              >
                حفظ وإنهاء والمتابعة للوحة تحكم الطلاب
              </button>
              <button
                onClick={startQuiz}
                className="w-full py-2 border border-white/5 text-white/40 hover:text-white hover:bg-white/5 text-[11px] rounded-xl transition-all font-medium cursor-pointer text-center block"
              >
                إعادة المحاولة بالاختبار كـشغف إضافي
              </button>
            </div>
          </div>
        </div>
      );
    }

    const currentQuestion = quizQuestions[quizIndex];

    return (
      <div className="max-w-xl mx-auto space-y-6 font-arabic text-right" dir="rtl">
        
        {/* Quiz Dashboard Stats Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-amber-500/90 font-bold uppercase block tracking-widest font-arabic">
              الوضع النشط: اختبار المراجعة القصير 🎯
            </span>
            <h3 className="text-sm font-extrabold text-white">حقيبة المادة: {deckTitle}</h3>
          </div>
          <span className="text-xs font-sans text-zinc-500">
            السؤال {quizIndex + 1} من {quizQuestions.length}
          </span>
        </div>

        {/* Progress gauge bar */}
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-l from-amber-500 to-yellow-400 transition-all duration-300 shadow-[0_0_8px_rgba(245,158,11,0.3)]"
            style={{ width: `${((quizIndex + 1) / quizQuestions.length) * 100}%` }}
          />
        </div>

        {/* Question Panel */}
        <div className="bg-[#0D0D0F] p-8 rounded-3xl border border-white/5 relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[160px]">
          <div className="absolute top-0 left-0 p-4 font-bold text-5xl opacity-[0.015] select-none font-sans pointer-events-none">Q</div>
          
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 border border-amber-500/25 rounded-md">
              السؤال الأكاديمي الحالي
            </span>
            <button
              onClick={() => handleSpeak(currentQuestion.question, "ar-SA")}
              className="p-1 px-1.5 rounded bg-white/5 hover:bg-white/10 text-white/70 text-[9px] flex items-center gap-1 cursor-pointer font-arabic"
            >
              <Volume2 className="w-3.5 h-3.5 text-amber-500" />
              <span>نطق السؤال</span>
            </button>
          </div>

          <h3 className="text-xl md:text-2xl font-extrabold text-[#F59E0B] leading-relaxed text-center py-4">
            {currentQuestion.question}
          </h3>

          <div className="border-t border-white/5 pt-3 flex items-center justify-between text-[10px] text-[#A1A1AA]">
            <span>خمن الإجابة والمطابقة الصحيحة من بين الخيارات المتاحة أدناه.</span>
            <span className="font-sans">الدقة الحالية: {quizScore} / {quizQuestions.length}</span>
          </div>
        </div>

        {/* Multiple Choice Options Group */}
        <div className="grid grid-cols-1 gap-3.5">
          {currentQuestion.choices.map((option, idx) => {
            const indexLetter = ["أ", "ب", "ج", "د"][idx] || "•";
            const isSelected = selectedAnswer === option;
            const isCorrect = option === currentQuestion.correctAnswer;
            const revealState = selectedAnswer !== null;

            let btnStyle = "bg-[#0A0A0C] border-white/5 text-zinc-300 hover:border-white/10 hover:bg-[#0f0f12]";
            let badgeStyle = "bg-white/5 text-amber-400 group-hover:text-white border-white/5";

            if (revealState) {
              if (isCorrect) {
                // Flash green
                btnStyle = "bg-emerald-950/15 border-emerald-500/40 text-emerald-400 font-bold shadow-lg shadow-emerald-950/5 animate-pulse";
                badgeStyle = "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
              } else if (isSelected) {
                // Selected but wrong - flash red
                btnStyle = "bg-red-950/15 border-red-500/40 text-red-400 font-light opacity-80";
                badgeStyle = "bg-red-500/20 text-red-400 border-red-500/40";
              } else {
                // Dim down non-selected incorrect choices
                btnStyle = "bg-[#0A0A0C] border-white/5 text-zinc-500 opacity-40 cursor-not-allowed";
                badgeStyle = "bg-white/5 text-zinc-600 border-transparent";
              }
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectQuizAnswer(option)}
                disabled={revealState}
                className={`group p-4 rounded-xl border flex items-center justify-between gap-4 text-right text-xs md:text-sm leading-relaxed transition-all duration-300 cursor-pointer ${btnStyle}`}
              >
                <div className="flex items-center gap-3.5 flex-1 select-all">
                  <span className={`w-8 h-8 rounded-lg border font-black text-xs flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105 ${badgeStyle}`}>
                    {indexLetter}
                  </span>
                  <span>{option}</span>
                </div>

                <div className="shrink-0">
                  {revealState && isCorrect && (
                    <span className="p-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 block">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                  {revealState && isSelected && !isCorrect && (
                    <span className="p-1.5 rounded-full bg-red-500/10 border border-red-500/25 text-red-400 block">
                      <X className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Explain Card & Advance Button */}
        {selectedAnswer !== null && (
          <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 text-right animate-fade-in">
            <div className="flex items-start gap-3 flex-1">
              <span className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 block shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-purple-400" />
              </span>
              <div className="space-y-1">
                <span className="text-[10px] text-purple-400 block font-bold">ملخص الاسترجاع النشط</span>
                <p className="text-xs text-white/70 leading-relaxed font-light">
                  {selectedAnswer === currentQuestion.correctAnswer 
                    ? "أحسنت! إجابة صحيحة تدعم ترسيخ الوصلات العصبية وعملية الاسترجاع الذهني النشط."
                    : "الإجابة الصحيحة موضحة باللون الأخضر. لا تنزعج، فالأخطاء تساهم بشكل فوري في جدولة البطاقة تلقائياً."}
                </p>
              </div>
            </div>

            <button
              onClick={handleNextQuizQuestion}
              className="w-full md:w-auto px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl tracking-wide shadow active:scale-95 transition-all text-center flex items-center justify-center gap-1 cursor-pointer font-arabic shrink-0"
            >
              <span>{quizIndex + 1 < quizQuestions.length ? "السؤال التالي" : "عرض النتائج النهائية 🏆"}</span>
              <ChevronRight className="w-4 h-4 transform rotate-180" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // Active Spaced Repetition Flashcard Player UI
  if (sessionCompleted) {
    const perfectScoreCount = sessionScores.filter(s => s >= 4).length;

    return (
      <div className="bg-[#0D0D0F] p-8 rounded-3xl border border-white/5 shadow-2xl max-w-lg mx-auto text-center font-arabic relative overflow-hidden" dir="rtl">
        {/* Glow behind */}
        <div className="absolute -right-20 -top-20 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>

        <Award className="w-16 h-16 text-amber-500 mx-auto mb-4 animate-pulse relative z-10" />
        <h2 className="text-2xl font-black text-white mb-2 font-arabic relative z-10">اكتملت جلسة المراجعة بنجاح! 🏆</h2>
        <p className="text-xs text-white/40 mb-6 font-arabic font-light relative z-10">
          حقيبة: {deckTitle} • أنجزت مراجعة {cards.length} بطاقة
        </p>

        <div className="bg-[#09090b] border border-white/5 p-5 rounded-2xl text-center max-w-sm mx-auto mb-6">
          <span className="block text-xs text-white/45 font-arabic mb-1.5">نسبة الإتقان والتذكر</span>
          <span className="text-2xl font-bold text-emerald-400 font-sans">{perfectScoreCount} / {cards.length}</span>
        </div>

        <p className="text-xs text-emerald-400/90 mb-6 max-w-sm mx-auto leading-relaxed font-arabic">
          {perfectScoreCount === cards.length 
            ? "⭐ نتيجة تامة ممتازة! ستقوم خوارزمية التكرار الأكاديمي بتوسيع الفترة الزمنية تلقائياً لثقتها بذاكرتك."
            : "رائع جداً! تم حفظ التقدم، وسنقوم تلقائياً بتقريب موعد الأسئلة التي تعثرت بها لتثبيتها في عقلك غداً."}
        </p>

        {/* Action Options: Back to Dashboard vs Start Interactive Short Quiz */}
        <div className="space-y-3 max-w-md mx-auto">
          <button
            onClick={startQuiz}
            className="w-full py-3 px-5 bg-gradient-to-l from-amber-500 to-yellow-400 text-black font-extrabold text-xs font-arabic rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-amber-500/25"
          >
            <Sparkles className="w-4 h-4 text-black animate-spin-slow animate-pulse" />
            <span>🎯 خُض اختباراً قصيراً وسريعاً (mcq) لتأكيد الفهم والانتقال للقمة</span>
          </button>

          <button
            onClick={onFinishSession}
            className="w-full py-3 bg-[#111114] hover:bg-[#16161b] border border-white/5 text-white/70 hover:text-white font-bold text-xs font-arabic rounded-xl transition-all cursor-pointer"
          >
            تأكيد وحفظ التقدم والعودة للوحة التحكم
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 font-arabic" dir="rtl">
      <div className="flex items-center justify-between">
        <button
          onClick={onFinishSession}
          className="flex items-center gap-1.5 text-xs font-bold text-white/50 hover:text-white transition-colors cursor-pointer font-arabic"
        >
          <ArrowLeft className="w-4 h-4 transform rotate-180" />
          <span>إلغاء المراجعة والعودة</span>
        </button>
        <span className="text-xs font-sans text-zinc-500" dir="rtl">
          البطاقة {currentIndex + 1} من {cards.length}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-500 transition-all duration-300 shadow-[0_0_8px_rgba(245,158,11,0.3)]"
          style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
        />
      </div>

      {/* Flip Card Container */}
      <div 
        onClick={() => setIsFlipped(!isFlipped)}
        className={`relative w-full h-80 rounded-3xl border cursor-pointer select-none transition-all duration-500 flex flex-col justify-between p-6 ${
          isEcoMode ? "duration-0 animate-none" : "" // Disable transition time in pure Eco battery preservation
        } ${
          isFlipped 
            ? "border-amber-500/30 bg-[#0c0c0e] shadow-inner" 
            : "border-white/5 bg-[#0D0D0F] text-zinc-100 shadow-xl hover:border-white/10"
        }`}
      >
        {/* Card Header utilities */}
        <div className="flex items-center justify-between" dir="rtl">
          <span className="text-[10px] font-bold tracking-wide text-amber-500/80 font-arabic">
            {isFlipped ? "مستخلص الإجابة ومطابقة الحفظ" : "التحدي الذهني النشط للذاكرة"}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSpeak(
                  isFlipped ? activeCard.arabicBack || activeCard.back : activeCard.arabicFront || activeCard.front, 
                  "ar-SA"
                );
              }}
              title="سماع النطق بالصوت"
              className="p-1 px-1.5 rounded bg-white/5 hover:bg-white/10 text-white/70 text-[9px] flex items-center gap-1 cursor-pointer font-arabic"
            >
              <Volume2 className="w-3.5 h-3.5 text-amber-500" />
              <span>نطق صوتي</span>
            </button>
          </div>
        </div>

        {/* Dynamic Card Face views */}
        <div className="flex-1 mt-6 flex flex-col justify-center text-center px-4 font-arabic">
          {!isFlipped ? (
            <div className="space-y-4">
              <h3 className="text-2xl md:text-3xl font-extrabold text-[#F59E0B] leading-relaxed select-text" dir="rtl">
                {activeCard.arabicFront || activeCard.front}
              </h3>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-xl md:text-2xl font-extrabold text-white leading-relaxed select-text" dir="rtl">
                {activeCard.arabicBack || activeCard.back}
              </h3>
            </div>
          )}
        </div>

        {/* Card Footer tips */}
        <div className="flex items-center justify-between border-t border-white/5 pt-3 text-zinc-500">
          {isFlipped && activeCard.notes ? (
            <span className="text-[10px] text-white/40 block truncate max-w-full font-light font-arabic">
              💡 تلميح: {activeCard.notes}
            </span>
          ) : (
            <span className="text-[10px] text-zinc-400 flex items-center gap-1.5 mx-auto text-center font-arabic">
              <RotateCw className="w-3 h-3 animate-spin duration-3000 text-amber-500" />
              اضغط على واجهة البطاقة لإظهار الترجمة والإجابة
            </span>
          )}
        </div>
      </div>

      {/* SuperMemo-2 Spaced Repetition Ratings panel */}
      {isFlipped && (
        <div className="bg-[#0D0D0F] p-4 rounded-2xl border border-white/5 space-y-3 font-arabic" dir="rtl">
          <div className="flex items-center gap-1.5 text-xs text-white/45 pb-2 border-b border-white/5 justify-between">
            <span className="flex items-center gap-1 font-bold">
              <HelpCircle className="w-3.5 h-3.5 text-amber-500" /> قيم مستوى حفظك للبطاقة الـدراسيّة:
            </span>
            <span className="text-[9px] text-[#A1A1AA] bg-white/5 px-2 py-0.5 rounded-md">جدولة خوارزمية SM-2</span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            <button
              onClick={() => submitRating(0)}
              className="p-2 py-3 bg-[#09090b] hover:bg-red-950/20 border border-white/5 hover:border-red-500/30 rounded-xl text-center transition-all group cursor-pointer"
            >
              <span className="block text-sm font-bold text-red-500 group-hover:scale-110 font-sans">0</span>
              <span className="text-[10px] text-white/40">نسيت تماماً</span>
            </button>

            <button
              onClick={() => submitRating(1)}
              className="p-2 py-3 bg-[#09090b] hover:bg-orange-950/20 border border-white/5 hover:border-orange-500/30 rounded-xl text-center transition-all group cursor-pointer"
            >
              <span className="block text-sm font-bold text-orange-500 group-hover:scale-110 font-sans">1</span>
              <span className="text-[10px] text-white/40">خاطئ تماماً</span>
            </button>

            <button
              onClick={() => submitRating(2)}
              className="p-2 py-3 bg-[#09090b] hover:bg-amber-950/20 border border-white/5 hover:border-amber-500/30 rounded-xl text-center transition-all group cursor-pointer"
            >
              <span className="block text-sm font-bold text-amber-500 group-hover:scale-110 font-sans">2</span>
              <span className="text-[10px] text-white/40">تعثرت كثيراً</span>
            </button>

            <button
              onClick={() => submitRating(3)}
              className="p-2 py-3 bg-[#09090b] hover:bg-blue-950/20 border border-white/5 hover:border-blue-500/30 rounded-xl text-center transition-all group cursor-pointer"
            >
              <span className="block text-sm font-bold text-blue-400 group-hover:scale-110 font-sans">3</span>
              <span className="text-[10px] text-white/40">بصعوبة</span>
            </button>

            <button
              onClick={() => submitRating(4)}
              className="p-2 py-3 bg-[#09090b] hover:bg-indigo-950/20 border border-white/5 hover:border-indigo-500/30 rounded-xl text-center transition-all group cursor-pointer"
            >
              <span className="block text-sm font-bold text-indigo-400 group-hover:scale-110 font-sans">4</span>
              <span className="text-[10px] text-white/40">تذكر جيد</span>
            </button>

            <button
              onClick={() => submitRating(5)}
              className="p-2 py-3 bg-[#09090b] hover:bg-emerald-950/20 border border-white/5 hover:border-emerald-500/30 rounded-xl text-center transition-all group cursor-pointer"
            >
              <span className="block text-sm font-bold text-emerald-400 group-hover:scale-110 font-sans">5</span>
              <span className="text-[10px] text-white/40">حفظ فوري تام</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
