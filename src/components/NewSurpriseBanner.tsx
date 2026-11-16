import React, { useEffect, useRef } from 'react';
import { Gift, Sparkles, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { CountdownDay } from '../types/countdown';
import {
  getAllUnopenedUnlockedDays,
  getLatestUnopenedUnlockedDay,
} from '../lib/countdownHelpers';

interface NewSurpriseBannerProps {
  days: CountdownDay[];
  openedDayIds: number[];
  onOpenDay: (day: CountdownDay) => void;
  isPreviewMode?: boolean;
}

export const NewSurpriseBanner: React.FC<NewSurpriseBannerProps> = ({
  days,
  openedDayIds,
  onOpenDay,
  isPreviewMode = false,
}) => {
  const unopenedDays = getAllUnopenedUnlockedDays(days, openedDayIds, isPreviewMode);
  const targetDay = getLatestUnopenedUnlockedDay(days, openedDayIds, isPreviewMode);

  // Trigger romantic celebration confetti on arrival when an unviewed surprise exists
  const hasCelebratedArrival = useRef(false);

  useEffect(() => {
    if (targetDay && !hasCelebratedArrival.current) {
      hasCelebratedArrival.current = true;
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.28 },
          colors: ['#f43f5e', '#fb7185', '#fda4af', '#f59e0b', '#fbbf24', '#ffffff'],
          ticks: 200,
          gravity: 0.85,
        });
      } catch (err) {
        console.warn('Arrival confetti error:', err);
      }
    }
  }, [targetDay]);

  // If all currently unlocked days have been viewed:
  if (!targetDay) {
    return (
      <aside aria-label="סטטוס הפתעות" className="my-2 p-2.5 rounded-2xl bg-white/70 backdrop-blur-md border border-rose-100 shadow-2xs flex items-center justify-center gap-2 text-xs text-rose-700/90 text-center animate-in fade-in duration-300">
        <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-400 shrink-0" />
        <span className="font-medium">
          צפית בכל ההפתעות שנפתחו עד כה! נתראה מחר עם הפתעה חדשה 💖
        </span>
      </aside>
    );
  }

  const isWeddingDay = targetDay.day_number === 29;
  const otherUnopenedCount = unopenedDays.length - 1;

  const dateDescription = targetDay.hebrew_date
    ? `${targetDay.hebrew_date} (${targetDay.civil_date})`
    : targetDay.civil_date || `יום ${targetDay.day_number}`;

  return (
    <aside aria-label="הודעת יום חדש" className="relative my-3 group">
      {/* Ambient Pulsating Glow Aura */}
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300 opacity-60 blur-lg animate-glow-pulse pointer-events-none" />

      {/* Main Glassmorphic Surprise Card */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-rose-200/90 bg-gradient-to-br from-rose-500 via-pink-500 to-rose-600 p-4 sm:p-5 text-white shadow-lg shadow-rose-500/25">
        {/* Shimmer sweep effect */}
        <div className="absolute inset-0 shimmer-foil opacity-15 pointer-events-none" />

        {/* Floating background decorative shapes */}
        <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-amber-300/20 blur-xl pointer-events-none" />

        {/* Top Status & Ping Pill */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-[11px] font-bold text-white shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
            </span>
            <span>✨ יום חדש נפתח לצפייה!</span>
          </div>

          {otherUnopenedCount > 0 && (
            <span className="text-[11px] font-medium bg-rose-900/35 px-2.5 py-0.5 rounded-full border border-white/20 backdrop-blur-xs text-rose-100">
              עוד {otherUnopenedCount} {otherUnopenedCount === 1 ? 'הפתעה מחכה' : 'הפתעות מחכות'}
            </span>
          )}
        </div>

        {/* Catchy Headline */}
        <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight leading-snug drop-shadow-sm flex items-center gap-2">
          <span>
            {isWeddingDay
              ? '💍 היום הגדול הגיע! יום חתונת השנה!'
              : 'התקרבנו בעוד יום לחתונת השנה!'}
          </span>
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 animate-star-twinkle shrink-0" />
        </h3>

        {/* Invitation Message */}
        <p className="text-xs sm:text-sm text-rose-50/95 font-medium leading-relaxed mt-1.5 mb-3.5">
          {isWeddingDay ? (
            'היום את עומדת תחת החופה! ההפתעה האחרונה והמרגשת מכולן פתוחה ומחכה רק לך... 💕'
          ) : (
            <>
              ההפתעה ל<strong>{dateDescription}</strong> כבר פתוחה ומחכה במיוחד בשבילך!
              בואי לגלות מה הכנו עבורך היום... 💕
            </>
          )}
        </p>

        {/* Action Button (CTA) */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onOpenDay(targetDay)}
            aria-label={`פתיחת ההפתעה ל${dateDescription}`}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white text-rose-600 font-extrabold text-sm shadow-md hover:bg-rose-50 hover:shadow-lg hover:scale-102 active:scale-98 transition-all cursor-pointer group"
          >
            <Gift className="w-4 h-4 text-rose-500 group-hover:rotate-12 transition-transform animate-bounce" />
            <span>צפייה בהפתעה החדשה</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          </button>
        </div>
      </div>
    </aside>
  );
};
