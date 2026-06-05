import React, { useState, useEffect } from "react";
import { Battery, Zap, ShieldAlert, Cpu } from "lucide-react";

export type PowerProfile = "eco" | "balanced" | "high";

interface BatteryOptimizerProps {
  currentProfile: PowerProfile;
  onChangeProfile: (profile: PowerProfile) => void;
}

export default function BatteryOptimizer({ currentProfile, onChangeProfile }: BatteryOptimizerProps) {
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState<boolean | null>(null);

  useEffect(() => {
    // Access the navigator battery status api if supported
    const nav: any = navigator;
    if (nav.getBattery) {
      nav.getBattery().then((batt: any) => {
        setBatteryLevel(Math.round(batt.level * 100));
        setIsCharging(batt.charging);

        const handleLevelChange = () => setBatteryLevel(Math.round(batt.level * 100));
        const handleChargingChange = () => setIsCharging(batt.charging);

        batt.addEventListener("levelchange", handleLevelChange);
        batt.addEventListener("chargingchange", handleChargingChange);

        return () => {
          batt.removeEventListener("levelchange", handleLevelChange);
          batt.removeEventListener("chargingchange", handleChargingChange);
        };
      }).catch(() => {});
    }
  }, []);

  return (
    <div className="bg-[#0D0D0F] p-5 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Battery className={`w-5 h-5 ${currentProfile === "eco" ? "text-emerald-400 animate-pulse" : "text-amber-500"}`} />
          <h3 className="font-arabic font-bold text-sm text-white tracking-wide">محسن استهلاك الطاقة</h3>
        </div>
        {batteryLevel !== null && (
          <span className="text-xs font-mono text-white/55 flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">
            {batteryLevel}% {isCharging ? <Zap className="w-3 h-3 text-emerald-400" /> : ""}
          </span>
        )}
      </div>

      <div className="text-right mb-4" dir="rtl">
        <p className="text-[11px] font-arabic font-medium leading-relaxed text-amber-500/80">
          اضبط جودة الرسوم لتوفير طاقة البطارية أثناء المذاكرة الطويلة.
        </p>
        <p className="text-[10px] text-white/40 leading-relaxed text-right font-arabic mt-1">
          تعديل أداء الرسوم لزيادة عمر بطارية هاتفك بالكامل أثناء جلسات المراجعة الممتدة. البكسلات السوداء الصرفة توفر استهلاك طاقة شاشات الهاتف بالكامل.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => onChangeProfile("eco")}
          className={`flex flex-col items-center gap-1 py-3 px-1 rounded-xl text-center border transition-all cursor-pointer ${
            currentProfile === "eco"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-white/5 border-white/5 text-white/50 hover:border-white/10"
          }`}
        >
          <Zap className="w-4 h-4 text-emerald-400" />
          <span className="text-[11px] font-arabic font-bold">توفير رائع</span>
          <span className="text-[9px] text-emerald-400/80 font-arabic">اقتصادي</span>
        </button>

        <button
          onClick={() => onChangeProfile("balanced")}
          className={`flex flex-col items-center gap-1 py-3 px-1 rounded-xl text-center border transition-all cursor-pointer ${
            currentProfile === "balanced"
              ? "bg-white/10 border-amber-500/30 text-amber-500"
              : "bg-white/5 border-white/5 text-white/50 hover:border-white/10"
          }`}
        >
          <Cpu className="w-4 h-4 text-amber-500" />
          <span className="text-[11px] font-arabic font-bold">متوازن</span>
          <span className="text-[9px] text-amber-500/80 font-arabic">افتراضي</span>
        </button>

        <button
          onClick={() => onChangeProfile("high")}
          className={`flex flex-col items-center gap-1 py-3 px-1 rounded-xl text-center border transition-all cursor-pointer ${
            currentProfile === "high"
              ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
              : "bg-white/5 border-white/5 text-white/50 hover:border-white/10"
          }`}
        >
          <Zap className="w-4 h-4 text-purple-400 animate-bounce" />
          <span className="text-[11px] font-arabic font-bold">أداء عالٍ</span>
          <span className="text-[9px] text-purple-400/80 font-arabic">سريع</span>
        </button>
      </div>

      {currentProfile === "eco" && (
        <div className="mt-3 flex items-start gap-1.5 p-3 bg-emerald-950/20 border border-emerald-500/10 rounded-xl text-[10px] text-emerald-400" dir="rtl">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
          <span className="font-arabic leading-relaxed font-light text-right">
            تم تفعيل نمط توفير الطاقة: تقليل سرعة معدل التحديث التفاعلي لتوفير بطارية هاتفك بالكامل.
          </span>
        </div>
      )}
    </div>
  );
}
