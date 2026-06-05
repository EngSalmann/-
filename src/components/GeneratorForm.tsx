import React, { useState } from "react";
import { Sparkles, Loader2, BookOpen, AlertTriangle, Coins, Plus } from "lucide-react";

interface GeneratorFormProps {
  onCardsGenerated: (cards: Array<{
    front: string;
    back: string;
    arabicFront: string;
    arabicBack: string;
    notes?: string;
  }>, deckTitle: string, deckDesc: string) => void;
  userCredits: number;
  onDeductCredits: (amount: number) => boolean;
  onEarnCredits: (amount: number) => void;
}

export default function GeneratorForm({
  onCardsGenerated,
  userCredits,
  onDeductCredits,
  onEarnCredits
}: GeneratorFormProps) {
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);
  const [contextText, setContextText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError("يرجى تحديد عنوان الدرس أو موضوع المادة الدراسية لتوليد البطاقات.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          count,
          contextText: contextText.trim() || undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "فشل التوليد من المزود، يرجى التكرار.");
      }

      if (!data.cards || !Array.isArray(data.cards) || data.cards.length === 0) {
        throw new Error("تنسيق الاستجابة غير صحيح أو فارغ.");
      }

      const title = topic.trim();
      const desc = contextText.trim() 
        ? `بطاقات ذكية تم توليدها بالذكاء من ملاحظاتك`
        : `بطاقات ذكية تم توليدها لمنهج: ${topic.trim()}.`;

      onCardsGenerated(data.cards, title, desc);
      
      // Reset inputs
      setTopic("");
      setContextText("");
      setCount(5);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message || "حدث خطأ غير متوقع أثناء الاتصال بخوادم التوليد الذكي. يرجى التحقق وإعادة المحاولة."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0D0D0F] p-6 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden text-right font-arabic" dir="rtl">
      
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
          <h2 className="text-base font-bold text-white tracking-tight font-arabic">مولد بطاقات المذاكرة بالذكاء الاصطناعي</h2>
        </div>
      </div>

      <div className="space-y-1 mb-6">
        <p className="text-sm font-bold text-amber-500 leading-relaxed font-arabic">
          اكتب موضوع الدرس أو الصق جزءاً من كتابك المدرسي، وسينشئ لك نموذج Gemini المتقدم بطاقات حفظ بالتكرار المتباعد باللغة العربية الفصحى فوراً.
        </p>
      </div>

      {error && (
        <div className="mb-5 flex flex-col gap-2 p-4 bg-red-950/20 border border-red-500/20 rounded-xl text-xs text-red-500">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="flex-1 text-right">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleGenerate} className="space-y-5">
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-bold text-amber-500 font-arabic" htmlFor="topic-input">
              موضوع الدراسة أو عنوان الدرس (مثال: تفاعلات الأكسدة والاختزال، البلاغة العربية)
            </label>
          </div>
          <input
            id="topic-input"
            type="text"
            required
            disabled={loading}
            placeholder="مثال: أحكام النون الساكنة والتنوين، قوانين نيوتن للحركة..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full bg-white/5 border border-white/10 text-xs rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 transition-colors font-arabic text-right"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-bold text-amber-500 font-arabic" htmlFor="notes-textarea">
              ملاحظات المعلم أو أجزاء المذكرة الدراسية لمساعدة الذكاء (اختياري)
            </label>
          </div>
          <textarea
            id="notes-textarea"
            disabled={loading}
            rows={4}
            placeholder="العديد من القوانين والتعاريف والرموز، الملاحظات التي شرحها المعلم داخل المحاضرة..."
            value={contextText}
            onChange={(e) => setContextText(e.target.value)}
            className="w-full bg-white/5 border border-white/10 text-xs rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 transition-colors resize-none font-arabic text-right leading-relaxed"
          />
        </div>

        <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/50 font-bold font-arabic">حجم حزمة المذاكرة:</span>
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              disabled={loading}
              className="bg-[#0D0D0F] border border-white/10 text-xs rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-amber-500/50 cursor-pointer text-center font-sans font-bold"
            >
              <option value={3}>3 بطاقات تفاعلية</option>
              <option value={5}>5 بطاقات تفاعلية</option>
              <option value={8}>8 بطاقات تفاعلية</option>
              <option value={10}>10 بطاقات تفاعلية</option>
              <option value={12}>12 بطاقة تفاعلية</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={loading}
              className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl text-black transition-all cursor-pointer font-arabic ${
                loading 
                  ? "bg-white/10 text-white/35 cursor-not-allowed" 
                  : "bg-amber-500 hover:bg-amber-400 shadow-md active:scale-95"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  جاري صياغة الأسئلة وتهجئتها...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-black" />
                  توليد بالذكاء الاصطناعي مجاناً
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
