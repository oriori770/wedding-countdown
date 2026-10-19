import React, { useState, useEffect } from 'react';
import { Heart, Sparkles, Gift, ShieldAlert } from 'lucide-react';

interface HeaderCountdownProps {
  brideName: string;
  groomName: string;
  weddingDate: string; // ISO string
  totalDays: number;
  openedDaysCount: number;
  onOpenAdmin: () => void;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

export const HeaderCountdown: React.FC<HeaderCountdownProps> = ({
  brideName,
  groomName,
  weddingDate,
  totalDays,
  openedDaysCount,
  onOpenAdmin,
}) => {
  const calculateTimeRemaining = (): TimeRemaining => {
    const target = new Date(weddingDate).getTime();
    const now = new Date().getTime();
    const difference = target - now;

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((difference / 1000 / 60) % 60);
    const seconds = Math.floor((difference / 1000) % 60);

    return { days, hours, minutes, seconds, isPast: false };
  };

  const [timeLeft, setTimeLeft] = useState<TimeRemaining>(calculateTimeRemaining);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeRemaining());
    }, 1000);

    return () => clearInterval(timer);
  }, [weddingDate]);

  const padZero = (n: number) => String(n).padStart(2, '0');

  const progressPercentage =
    totalDays > 0 ? Math.min(100, Math.round((openedDaysCount / totalDays) * 100)) : 0;

  return (
    <header className="relative w-full pt-4 pb-4">
      {/* Top action row: Badge & Secret Admin entrance */}
      <div className="flex items-center justify-between mb-3 text-xs">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100/90 text-rose-700 font-semibold border border-rose-200/80 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
          <span>המסע שלנו לחופה</span>
        </div>

        {/* Discreet Admin Entrance for the Groom / Developer */}
        <button
          onClick={onOpenAdmin}
          type="button"
          title="כניסה לפאנל מנהל (הצגת כל הימים)"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/70 hover:bg-white text-stone-400 hover:text-stone-700 border border-stone-200/70 transition-all cursor-pointer"
        >
          <ShieldAlert className="w-3 h-3 text-stone-400" />
          <span>מנהל</span>
        </button>
      </div>

      {/* Couple's Names & Romantic Header */}
      <div className="text-center mb-4">
        <div className="inline-flex items-center justify-center gap-2 mb-1">
          <Heart className="w-5 h-5 text-rose-500 fill-rose-400 animate-bounce" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-800 tracking-tight">
            <span>{brideName}</span>
            <span className="text-rose-400 mx-2 font-serif font-normal">&</span>
            <span>{groomName}</span>
          </h1>
          <Heart className="w-5 h-5 text-rose-500 fill-rose-400 animate-bounce" />
        </div>
        <p className="text-xs sm:text-sm text-stone-500 font-medium">
          סופרים את הרגעים עד ליום המאושר בחיינו • כ״ט כסלו (9.12)
        </p>
      </div>

      {/* Countdown Timer Boxes */}
      <div className="relative glass-panel rounded-2xl p-3.5 shadow-2xs border border-rose-100/80 mb-3.5">
        <div className="text-center text-xs text-rose-600/90 font-semibold mb-2 flex items-center justify-center gap-1">
          <span>זמן שנותר עד לחופה המקודשת</span>
        </div>

        {timeLeft.isPast ? (
          <div className="text-center py-2 text-rose-600 font-bold text-lg animate-pulse">
            💍 היום זה קורה! מזל טוב לזוג המושלם! 🎉
          </div>
        ) : (
          /* Rendered strictly dir="ltr" so order is Days : Hours : Minutes : Seconds */
          <div
            dir="ltr"
            className="grid grid-cols-4 gap-2 text-center"
            aria-label="טיימר ספירה לאחור"
          >
            {/* Days */}
            <div className="bg-white/95 rounded-xl py-2 px-1 border border-rose-100/90 shadow-2xs">
              <span className="block text-xl sm:text-2xl font-bold text-rose-600 font-mono tracking-tight">
                {padZero(timeLeft.days)}
              </span>
              <span className="block text-[11px] text-stone-500 font-medium mt-0.5" dir="rtl">
                ימים
              </span>
            </div>

            {/* Hours */}
            <div className="bg-white/95 rounded-xl py-2 px-1 border border-rose-100/90 shadow-2xs">
              <span className="block text-xl sm:text-2xl font-bold text-rose-600 font-mono tracking-tight">
                {padZero(timeLeft.hours)}
              </span>
              <span className="block text-[11px] text-stone-500 font-medium mt-0.5" dir="rtl">
                שעות
              </span>
            </div>

            {/* Minutes */}
            <div className="bg-white/95 rounded-xl py-2 px-1 border border-rose-100/90 shadow-2xs">
              <span className="block text-xl sm:text-2xl font-bold text-rose-600 font-mono tracking-tight">
                {padZero(timeLeft.minutes)}
              </span>
              <span className="block text-[11px] text-stone-500 font-medium mt-0.5" dir="rtl">
                דקות
              </span>
            </div>

            {/* Seconds */}
            <div className="bg-white/95 rounded-xl py-2 px-1 border border-rose-100/90 shadow-2xs">
              <span className="block text-xl sm:text-2xl font-bold text-rose-500 font-mono tracking-tight animate-pulse">
                {padZero(timeLeft.seconds)}
              </span>
              <span className="block text-[11px] text-stone-500 font-medium mt-0.5" dir="rtl">
                שניות
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="glass-panel rounded-xl p-2.5 sm:p-3 shadow-2xs border border-rose-100/70">
        <div className="flex items-center justify-between text-xs text-stone-600 mb-1.5 font-medium">
          <span className="flex items-center gap-1.5">
            <Gift className="w-3.5 h-3.5 text-rose-500" />
            <span>
              פתחת <strong className="text-rose-600 font-bold">{openedDaysCount}</strong> מתוך{' '}
              <strong className="text-stone-700">{totalDays}</strong> הפתעות
            </span>
          </span>
          <span className="text-rose-600 font-bold font-mono">{progressPercentage}%</span>
        </div>

        {/* Outer bar */}
        <div className="w-full bg-rose-100/70 h-2 rounded-full overflow-hidden p-0.5 border border-rose-200/50">
          <div
            className="h-full bg-gradient-to-l from-rose-500 via-pink-400 to-rose-400 rounded-full transition-all duration-700 ease-out shadow-xs"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    </header>
  );
};
