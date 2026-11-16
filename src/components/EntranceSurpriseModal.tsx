import React, { useEffect } from 'react';
import { Gift, Sparkles, X, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { CountdownDay } from '../types/countdown';

interface EntranceSurpriseModalProps {
  day: CountdownDay | null;
  isOpen: boolean;
  onOpenSurprise: (day: CountdownDay) => void;
  onClose: () => void;
}

export const EntranceSurpriseModal: React.FC<EntranceSurpriseModalProps> = ({
  day,
  isOpen,
  onOpenSurprise,
  onClose,
}) => {
  useEffect(() => {
    if (isOpen && day) {
      try {
        // Multi-stage romantic confetti blast
        confetti({
          particleCount: 65,
          spread: 75,
          origin: { y: 0.35 },
          colors: ['#f43f5e', '#fb7185', '#fda4af', '#f59e0b', '#fbbf24', '#ffffff'],
          gravity: 0.85,
          ticks: 250,
        });

        const timer = setTimeout(() => {
          try {
            confetti({
              particleCount: 45,
              angle: 60,
              spread: 55,
              origin: { x: 0.15, y: 0.4 },
              colors: ['#f43f5e', '#fda4af', '#fbbf24'],
            });
            confetti({
              particleCount: 45,
              angle: 120,
              spread: 55,
              origin: { x: 0.85, y: 0.4 },
              colors: ['#f43f5e', '#fda4af', '#fbbf24'],
            });
          } catch {
            // ignore
          }
        }, 320);

        return () => clearTimeout(timer);
      } catch (err) {
        console.warn('Entrance confetti error:', err);
      }
    }
  }, [isOpen, day]);

  if (!isOpen || !day) return null;

  const isWeddingDay = day.day_number === 29;
  const dateDescription = day.hebrew_date
    ? `${day.hebrew_date} (${day.civil_date})`
    : day.civil_date || `יום ${day.day_number}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md animate-in fade-in duration-300"
    >
      {/* Background glow orbs */}
      <div className="absolute w-72 h-72 rounded-full bg-rose-500/20 blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute w-60 h-60 rounded-full bg-amber-400/20 blur-3xl pointer-events-none" />

      {/* Modal Card */}
      <div className="relative w-full max-w-sm rounded-3xl border-2 border-rose-200/90 bg-gradient-to-b from-white via-rose-50/70 to-pink-50 p-6 text-center shadow-2xl shadow-rose-900/20 animate-in zoom-in-95 duration-300 overflow-hidden">
        {/* Shimmer overlay */}
        <div className="absolute inset-0 shimmer-foil opacity-10 pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="סגירה"
          className="absolute top-4 left-4 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Floating Animated Icon Badge */}
        <div className="relative mx-auto mb-4 w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-rose-400 to-pink-500 opacity-25 blur-lg animate-ping" />
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-600 shadow-lg shadow-rose-500/35 flex items-center justify-center border-2 border-white/60 animate-bounce">
            <Gift className="w-10 h-10 text-white drop-shadow-md" />
          </div>
          <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-amber-400 animate-star-twinkle" />
          <Heart className="absolute -bottom-1 -left-1 w-5 h-5 text-rose-400 fill-rose-400 animate-pulse" />
        </div>

        {/* Badge Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100/90 text-rose-700 text-xs font-bold border border-rose-200/80 mb-3 shadow-2xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600" />
          </span>
          <span>✨ הפתעה חדשה נפתחה היום!</span>
        </div>

        {/* Headline */}
        <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight leading-snug mb-2">
          {isWeddingDay ? (
            <>
              💍 היום הגדול הגיע!
              <br />
              <span className="text-rose-600">יום חתונת השנה!</span>
            </>
          ) : (
            <>
              התקרבנו בעוד יום
              <br />
              <span className="text-rose-600">לחתונת השנה! 💍✨</span>
            </>
          )}
        </h2>

        {/* Invitation Message */}
        <p className="text-xs sm:text-sm text-stone-600 font-medium leading-relaxed mb-6 px-1">
          {isWeddingDay ? (
            'היום את עומדת תחת החופה! ההפתעה האחרונה והמרגשת מכולן פתוחה ומחכה רק לך... 💕'
          ) : (
            <>
              דלת חדשה נפתחה בלוח ההפתעות ל<strong>{dateDescription}</strong> ומחכה במיוחד בשבילך!
              בואי לגלות מה הכנו עבורך היום... 💕
            </>
          )}
        </p>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => onOpenSurprise(day)}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:to-pink-600 text-white font-black text-base shadow-lg shadow-rose-500/30 hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer group"
          >
            <Gift className="w-5 h-5 text-white group-hover:rotate-12 transition-transform" />
            <span>פתחי את ההפתעה עכשיו</span>
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl text-stone-500 hover:text-stone-800 text-xs font-semibold hover:bg-stone-100/70 transition-colors cursor-pointer"
          >
            אצפה מאוחר יותר בלוח ההפתעות
          </button>
        </div>
      </div>
    </div>
  );
};
