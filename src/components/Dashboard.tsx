import React from "react";
import { UserProfile, STUDY_BADGES, Badge, DailyChallenge } from "../types";
import { Flame, Medal, Target, Award, Brain, TrendingUp, Sparkles, Coins, CheckSquare, ShieldCheck, Lock, Check, Zap } from "lucide-react";

interface DashboardProps {
  profile: UserProfile;
  dailyChallenges: DailyChallenge[];
  onClaimReward: (challengeId: string) => void;
  cardsCount: number;
  masteryCardsCount: number;
}

export default function Dashboard({
  profile,
  dailyChallenges,
  onClaimReward,
  cardsCount,
  masteryCardsCount
}: DashboardProps) {
  
  const unlockedCount = profile.unlockedBadges.length;

  return (
    <div className="space-y-10 text-right font-arabic" dir="rtl">
      
      {/* Premium Header Accent Area */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-amber-500/10 via-purple-500/5 to-transparent border border-white/5 p-8 md:p-10">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-right">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
              <span>مرحبا بك في لوحة القيادة الذكية</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
              فصـل دراسي ملـيء <span className="text-transparent bg-clip-text bg-gradient-to-l from-amber-400 to-yellow-200">بالإنجازات والاستمرارية</span> 🌟
            </h2>
            <p className="text-xs md:text-sm text-white/60 max-w-xl leading-relaxed">
              تتبّع تقدمك الأكاديمي، ونشّط أوسمة الشرف والدراسة المستقرة من خلال خوارزميات التكرار المتباعد الفعالة.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 shrink-0">
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div className="text-right">
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">إجمالي نقاط الرصيد للدراسة</p>
              <p className="text-2xl font-black text-amber-400 font-sans">{profile.credits} <span className="text-xs font-bold text-amber-100/60 font-arabic">نقطة مجانية</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Student Highlights Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5" dir="rtl">
        {/* Streak Counter */}
        <div className="group bg-[#0D0D0F] hover:bg-[#121215] p-6 rounded-3xl border border-white/5 hover:border-amber-500/20 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[140px] transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 left-0 p-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
            <Flame className="w-20 h-20 text-orange-500" />
          </div>
          <div className="flex justify-between items-start">
            <span className="block text-[11px] text-amber-500/90 font-bold tracking-wide">الاستمرار اليومي</span>
            <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mt-3">
            <span className="text-4xl font-extrabold text-white font-sans tracking-tight">{profile.streakCount}</span>
            <span className="text-amber-500/80 text-xs font-semibold">يوم متواصل</span>
          </div>
          <div className="mt-4 flex gap-1.5 w-full font-sans">
            <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${profile.streakCount >= 1 ? 'bg-gradient-to-r from-orange-500 to-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-white/10'}`}></div>
            <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${profile.streakCount >= 2 ? 'bg-gradient-to-r from-orange-500 to-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-white/10'}`}></div>
            <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${profile.streakCount >= 3 ? 'bg-gradient-to-r from-orange-500 to-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-white/10'}`}></div>
            <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${profile.streakCount >= 5 ? 'bg-gradient-to-r from-orange-500 to-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-white/10'}`}></div>
          </div>
        </div>

        {/* Mastered Cards Count (Level 5) */}
        <div className="group bg-[#0D0D0F] hover:bg-[#121215] p-6 rounded-3xl border border-white/5 hover:border-emerald-500/20 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[140px] transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 left-0 p-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
            <Brain className="w-20 h-20 text-emerald-500" />
          </div>
          <div className="flex justify-between items-start">
            <span className="block text-[11px] text-amber-500/90 font-bold tracking-wide">البطاقات المتقنة</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Brain className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mt-3">
            <span className="text-4xl font-extrabold text-white font-sans tracking-tight">{masteryCardsCount}</span>
            <span className="text-amber-500/80 text-xs font-semibold">حفظ تام</span>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full mt-4 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-l from-emerald-500 to-teal-400 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
              style={{ width: `${cardsCount ? Math.min((masteryCardsCount / cardsCount) * 100, 100) : 0}%` }}
            />
          </div>
        </div>

        {/* Total cards query count */}
        <div className="group bg-[#0D0D0F] hover:bg-[#121215] p-6 rounded-3xl border border-white/5 hover:border-blue-500/20 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[140px] transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 left-0 p-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
            <CheckSquare className="w-20 h-20 text-blue-500" />
          </div>
          <div className="flex justify-between items-start">
            <span className="block text-[11px] text-amber-500/90 font-bold tracking-wide">بنك الأسئلة بالكامل</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mt-3">
            <span className="text-4xl font-extrabold text-white font-sans tracking-tight">{cardsCount}</span>
            <span className="text-amber-500/80 text-xs font-semibold">فقرة تفاعلية</span>
          </div>
          <div className="text-[10px] text-white/50 mt-4 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> 
            <span>تحديث فوري نشط بنجاح</span>
          </div>
        </div>

        {/* Study Badges Unlocked */}
        <div className="group bg-[#0D0D0F] hover:bg-[#121215] p-6 rounded-3xl border border-white/5 hover:border-purple-500/20 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[140px] transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 left-0 p-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
            <Award className="w-20 h-20 text-purple-500" />
          </div>
          <div className="flex justify-between items-start">
            <span className="block text-[11px] text-amber-500/90 font-bold tracking-wide">الأوسمة المكتسبة</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mt-3">
            <span className="text-4xl font-extrabold text-white font-sans tracking-tight">{unlockedCount}</span>
            <span className="text-amber-500/80 text-xs font-semibold">/ {STUDY_BADGES.length} أوسمة</span>
          </div>
          <div className="text-[10px] text-amber-500/90 mt-4 flex items-center gap-1">
            <Medal className="w-3.5 h-3.5 text-amber-500" /> 
            <span>أوسمة شرف الحفظ والتميز</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Daily challenges column */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between border-b border-white/5 pb-4 font-arabic" dir="rtl">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2.5 leading-none">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 block">
                <Target className="w-4.5 h-4.5" />
              </span>
              <span>المهام والواجبات اليومية ومكافآتها</span>
            </h3>
            <span className="text-[10px] text-amber-400/80 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold">تتجدد تلقائياً</span>
          </div>

          <div className="space-y-4" dir="rtl">
            {dailyChallenges.map((challenge) => {
              const progressRatio = Math.min(challenge.currentCount / challenge.targetCount, 1);
              const percentDisplay = Math.round(progressRatio * 100);

              return (
                <div
                  key={challenge.id}
                  className={`group p-5 rounded-2xl border transition-all duration-300 text-right ${
                    challenge.completed
                      ? "bg-emerald-950/10 border-emerald-500/30 shadow-lg shadow-emerald-900/10"
                      : "bg-[#0D0D0F] border-white/5 hover:border-white/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="space-y-1.5 flex-1">
                      <h4 className="text-xs md:text-sm font-extrabold text-amber-500 tracking-wide">{challenge.titleAr || challenge.title}</h4>
                      <p className="text-xs text-white/70 leading-relaxed font-light">{challenge.descriptionAr || challenge.description}</p>
                    </div>
                  </div>

                  {/* Progress status indicators */}
                  <div className="space-y-3 pt-3.5 border-t border-white/5 flex items-center justify-between gap-4 text-[11px]">
                    <div className="flex-1 space-y-1.5">
                      <div className="flex justify-between font-arabic text-[10px] text-white/40">
                        <span>مستوى إتمام المذاكرة للمهمة</span>
                        <span className="text-amber-500 font-sans font-bold">{challenge.currentCount} / {challenge.targetCount} ({percentDisplay}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-l from-amber-500 to-yellow-400 transition-all duration-300 shadow-[0_0_10px_rgba(245,158,11,0.3)] rounded-full"
                          style={{ width: `${percentDisplay}%` }}
                        />
                      </div>
                    </div>

                    <div className="shrink-0 self-end">
                      {challenge.completed ? (
                        <span className="px-3.5 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl font-bold text-[10px] whitespace-nowrap flex items-center gap-1 shadow-sm">
                          <Check className="w-3.5 h-3.5" /> مكتملة ✓
                        </span>
                      ) : progressRatio >= 1 ? (
                        <button
                          onClick={() => onClaimReward(challenge.id)}
                          className="px-3.5 py-2 bg-emerald-500 hover:scale-105 hover:bg-emerald-400 text-black rounded-xl font-extrabold whitespace-nowrap shadow-lg active:scale-95 transition-all text-xs font-arabic cursor-pointer flex items-center gap-1.5"
                        >
                          <Zap className="w-3.5 h-3.5" /> تأكيد الإنجاز
                        </button>
                      ) : (
                        <span className="px-2.5 py-1 bg-white/5 text-white/30 border border-white/5 rounded-lg font-medium whitespace-nowrap text-[10px] font-arabic">
                          جاري العمل
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Unlockable study badges collection column */}
        <div className="lg:col-span-3 space-y-5">
          <div className="flex items-center justify-between border-b border-white/5 pb-4 font-arabic" dir="rtl">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2.5 leading-none">
              <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 block">
                <Award className="w-4.5 h-4.5" />
              </span>
              <span>أوسمة شرف الحفظ والتميز الأكاديمي ({unlockedCount} / {STUDY_BADGES.length})</span>
            </h3>
            <span className="text-[10px] text-purple-400/80 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full font-semibold">لوحة الشرف للأذكياء</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" dir="rtl">
            {STUDY_BADGES.map((badge: Badge) => {
              const isUnlocked = profile.unlockedBadges.includes(badge.id);

              return (
                <div
                  key={badge.id}
                  className={`group p-5 border rounded-2xl flex items-start gap-4 transition-all duration-300 relative overflow-hidden ${
                    isUnlocked
                      ? "bg-[#0D0D0F] border-white/10 hover:border-amber-500/20 shadow-xl"
                      : "bg-[#0D0D0F]/45 border-white/5 opacity-40 hover:opacity-60"
                  }`}
                >
                  <div
                    className={`p-3 rounded-2xl border text-zinc-950 bg-gradient-to-tr ${badge.color} shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                      isUnlocked ? "shadow-lg shadow-amber-500/25" : "grayscale"
                    }`}
                  >
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  
                  <div className="space-y-1.5 flex-1 text-right">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs md:text-sm font-extrabold text-white tracking-wide">{badge.titleAr || badge.title}</h4>
                      {isUnlocked ? (
                        <span className="text-[8px] text-emerald-400 font-bold uppercase bg-emerald-500/15 px-2 py-0.5 border border-emerald-500/25 rounded-md flex items-center gap-0.5">
                          ✔ مفتوح
                        </span>
                      ) : (
                        <span className="text-[8px] text-white/30 font-bold uppercase bg-white/5 px-2 py-0.5 border border-white/5 rounded-md flex items-center gap-0.5">
                          <Lock className="w-2 h-2" /> مغلق
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-white/60 leading-relaxed font-light">{badge.descriptionAr || badge.description}</p>
                    <div className="border-t border-white/5 mt-2 pt-2 flex items-center justify-between gap-1">
                      <span className="text-[9px] text-amber-500/80 font-bold font-arabic">متطلب التنشيط:</span>
                      <span className="text-[9px] text-white/50 bg-white/[0.03] px-2 py-0.5 border border-white/5 rounded text-left font-semibold">{badge.requirementTextAr || badge.requirementText}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
