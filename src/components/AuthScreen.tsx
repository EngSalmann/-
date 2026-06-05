import React, { useState } from "react";
import { Brain, Sparkles, Coins, Key, User, ArrowRight, ShieldCheck, Heart, LogIn, UserPlus } from "lucide-react";

interface AuthScreenProps {
  onAuthSuccess: (email: string, displayName: string, isFirebase: boolean, customUid?: string) => void;
  isFirebaseActive: boolean;
  loading: boolean;
  errorMessage: string | null;
}

export default function AuthScreen({
  onAuthSuccess,
  isFirebaseActive,
  loading,
  errorMessage
}: AuthScreenProps) {
  const [authMode, setAuthMode] = useState<"register" | "login">("register");
  const [localEmail, setLocalEmail] = useState("");
  const [localName, setLocalName] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [grade, setGrade] = useState("الصف العاشر (الصف الدراسي الأول ثانوية)");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmitLocalRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localEmail.trim() || !localName.trim()) return;
    setLocalError(null);
    onAuthSuccess(localEmail.trim(), localName.trim(), false);
  };

  const handleSubmitLocalLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const emailToSearch = loginEmail.toLowerCase().trim();
    if (!emailToSearch) return;
    setLocalError(null);

    // Search LocalStorage for any existing profile key mapping to this email
    let foundUid = "";
    let foundName = "";

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("flashrep_profile_")) {
        try {
          const profileData = JSON.parse(localStorage.getItem(key) || "");
          if (profileData && profileData.email && profileData.email.toLowerCase().trim() === emailToSearch) {
            foundUid = profileData.uid;
            foundName = profileData.name || profileData.email.split("@")[0];
            break;
          }
        } catch (err) {
          // ignore parsing error
        }
      }
    }

    if (foundUid) {
      onAuthSuccess(emailToSearch, foundName, false, foundUid);
    } else {
      setLocalError("لم يتم العثور على حساب محلي بهذا البريد الإلكتروني. يرجى التحقق من العنوان المكتوب أو إنشاء حساب جديد من علامة التبويب المجاورة.");
    }
  };

  const combinedError = errorMessage || localError;

  return (
    <div className="max-w-md mx-auto space-y-6 pt-4 font-arabic" dir="rtl">
      {/* Arabic and English Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex p-3 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl mb-1">
          <Brain className="w-8 h-8 animate-pulse" />
        </div>
        
        {/* Arabic Title & Subtitle First */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-amber-500 tracking-tight font-arabic">
            منصة نبراس <span className="text-white font-light">للحفظ الذكي</span>
          </h1>
          <p className="text-sm font-arabic text-white/80 tracking-wide font-bold mt-1">
            بطاقات استذكار ذكية بالتكرار المتباعد للمرحلة الثانوية والجامعية بذكاء جيميناي
          </p>
        </div>
      </div>

      <div className="bg-[#0D0D0F] rounded-3xl border border-white/5 p-6 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 p-4 font-serif text-3xl opacity-5 italic select-none">مجاني</div>
        
        {combinedError && (
          <div className="p-3 bg-red-950/20 border border-red-500/20 text-red-400 text-xs rounded-xl text-center font-arabic leading-relaxed">
            {combinedError}
          </div>
        )}

        {/* Onboarding Mode Toggles for Local Auth */}
        <div className="grid grid-cols-2 gap-2 bg-white/5 p-1 rounded-2xl border border-white/5">
          <button
            type="button"
            onClick={() => {
              setAuthMode("register");
              setLocalError(null);
            }}
            className={`py-2 px-3 text-xs font-bold font-arabic rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              authMode === "register"
                ? "bg-amber-500 text-black shadow-md"
                : "text-white/60 hover:text-white"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>إنشاء حساب جديد</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode("login");
              setLocalError(null);
            }}
            className={`py-2 px-3 text-xs font-bold font-arabic rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              authMode === "login"
                ? "bg-amber-500 text-black shadow-md"
                : "text-white/60 hover:text-white"
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>تسجيل دخول لحساب سابق</span>
          </button>
        </div>

        {authMode === "register" ? (
          /* Robust Register Form */
          <form onSubmit={handleSubmitLocalRegister} className="space-y-4 text-right">
            <div className="pb-2 border-b border-white/5 text-center">
              <h3 className="text-sm font-bold text-amber-500 font-arabic">
                إكمال ملف الطالب الدراسي العام
              </h3>
              <p className="text-[10px] text-white/40 mt-1 font-arabic">
                سلسلة المذاكرة واسترداد الهوية • مجاني بالكامل
              </p>
            </div>

            <p className="text-[11px] text-white/60 leading-relaxed text-center font-arabic font-light">
              أنشئ حساباً دراسياً لتسجيل تقدمك، سلاسل المذاكرة، ومعدلات الحفظ محلياً على المتصفح بشكل آمن تماماً وبلا انقطاع.
            </p>

            <div className="space-y-3">
              {/* Name Input */}
              <div>
                <label className="block text-xs font-bold text-white mb-1 font-arabic">
                  اسم الطالب الثلاثي
                </label>
                <div className="relative">
                  <User className="absolute right-3 top-2.5 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    required
                    placeholder="مثال: سلمان القحطاني"
                    value={localName}
                    onChange={(e) => setLocalName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pr-9 pl-4 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 transition-all font-arabic text-right"
                  />
                </div>
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-xs font-bold text-white mb-1 font-arabic">
                  البريد الإلكتروني للاسترجاع والمزامنة
                </label>
                <div className="relative">
                  <Key className="absolute right-3 top-2.5 w-4 h-4 text-white/30" />
                  <input
                    type="email"
                    required
                    placeholder="student@school-rep.ai"
                    value={localEmail}
                    onChange={(e) => setLocalEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pr-9 pl-4 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 transition-all text-right"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Grade Dropdown */}
              <div>
                <label className="block text-xs font-bold text-white mb-1 font-arabic">
                  السنة الدراسية الحالية (المرحلة التعليمية)
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full bg-[#0D0D0F] border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-amber-500/50 transition-all font-arabic text-right cursor-pointer"
                >
                  <option value="الاول-ثانوي">السنة الأولى ثانوية (الصف العاشر)</option>
                  <option value="الثاني-ثانوي">السنة الثانية ثانوية (الصف الحادي عشر)</option>
                  <option value="الثالث-ثانوي">السنة الثالثة ثانوية (الصف الثاني عشر - التوجيهي)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase transition-all shadow-md flex items-center justify-center gap-2 rounded-xl hover:scale-[1.01] cursor-pointer font-arabic mt-4"
            >
              <span>تسجيل ملف الطالب والبدء فوراً</span>
              <ArrowRight className="w-4 h-4 text-black transform rotate-180" />
            </button>
          </form>
        ) : (
          /* Robust Login Form */
          <form onSubmit={handleSubmitLocalLogin} className="space-y-4 text-right">
            <div className="pb-2 border-b border-white/5 text-center">
              <h3 className="text-sm font-bold text-amber-500 font-arabic">
                تسجيل الدخول إلى حسابك الدراسي
              </h3>
              <p className="text-[10px] text-white/40 mt-1 font-arabic">
                أدخل بريدك الإلكتروني المسجل لاسترداد بطاقاتك وحزمة حفظك
              </p>
            </div>

            <p className="text-[11px] text-white/60 leading-relaxed text-center font-arabic font-light">
              أدخل البريد الإلكتروني الذي استعملته في التسجيل سابقاً لاستيراد والولوج لكافة مجلدات بطاقات الحفظ والتقدم الدراسي المستمر وسلسلة أيامك.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-white mb-1 font-arabic">
                  البريد الإلكتروني المسجل به سابقاً
                </label>
                <div className="relative">
                  <Key className="absolute right-3 top-2.5 w-4 h-4 text-white/30" />
                  <input
                    type="email"
                    required
                    placeholder="student@school-rep.ai"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pr-9 pl-4 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 transition-all text-right"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 rounded-xl hover:scale-[1.01] cursor-pointer font-arabic mt-4"
            >
              <span>تحميل الحساب وبدء المذاكرة</span>
              <LogIn className="w-4 h-4 text-black" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
