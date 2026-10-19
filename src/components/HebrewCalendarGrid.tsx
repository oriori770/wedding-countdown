import React, { useState } from 'react';
import { Lock, Gift, Sparkles, Heart } from 'lucide-react';
import type { CountdownDay } from '../types/countdown';

import { HEBREW_DAYS_NUMERALS } from '../config/constants';

interface HebrewCalendarGridProps {
  days: CountdownDay[];
  openedDayIds: number[];
  isPreviewMode: boolean;
  onOpenDay: (day: CountdownDay) => void;
}

// Days of the Hebrew week starting from Sunday (RTL order: ראשון to שבת)
const DAYS_OF_WEEK = [
  { key: 'sun', label: 'א׳', name: 'ראשון' },
  { key: 'mon', label: 'ב׳', name: 'שני' },
  { key: 'tue', label: 'ג׳', name: 'שלישי' },
  { key: 'wed', label: 'ד׳', name: 'רביעי' },
  { key: 'thu', label: 'ה׳', name: 'חמישי' },
  { key: 'fri', label: 'ו׳', name: 'שישי' },
  { key: 'sat', label: 'ש׳', name: 'שבת' },
];

export const HebrewCalendarGrid: React.FC<HebrewCalendarGridProps> = ({
  days,
  openedDayIds,
  isPreviewMode,
  onOpenDay,
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showLockedToast = (day: CountdownDay) => {
    setToastMessage(`ההפתעה תיפתח ב-${day.hebrew_date || `יום ${day.day_number}`} (${day.civil_date}) ✨`);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Check if a specific day is unlocked
  const isDayUnlocked = (day: CountdownDay) => {
    if (isPreviewMode) return true;
    if (!day.unlock_date) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [year, month, dayNum] = day.unlock_date.split('-').map(Number);
    const unlockDate = new Date(year, month - 1, dayNum, 0, 0, 0, 0);

    return today.getTime() >= unlockDate.getTime();
  };


  // Day 1 (א' כסלו) starts on Wednesday (Index 3: Sun=0, Mon=1, Tue=2, Wed=3).
  // Therefore, we render 3 empty slots before Day 1.
  const emptyPrecedingSlots = 3;

  return (
    <div className="w-full relative">
      {/* Calendar Header Card */}
      <div className="glass-panel rounded-2xl p-3.5 mb-3.5 border border-rose-100 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs">
              כסלו
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-stone-800 leading-tight">
                חודש כסלו תשפ״ז
              </h3>
              <p className="text-[11px] text-stone-500">
                11 בנובמבר — 9 בדצמבר 2026
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-medium text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
            <Sparkles className="w-3 h-3 text-rose-500 animate-pulse" />
            <span>29 הפתעות עד החופה</span>
          </div>
        </div>
      </div>

      {/* Floating Locked Hint Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-stone-900/90 text-white text-xs px-4 py-2 rounded-full shadow-lg border border-stone-700 animate-in fade-in slide-in-from-bottom-2 duration-200 flex items-center gap-2 max-w-xs text-center">
          <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Hebrew Calendar Table / Grid */}
      <div className="glass-panel rounded-2xl p-2.5 sm:p-3 border border-rose-100 shadow-2xs">
        {/* Days of Week Header (7 Columns) */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center mb-2 pb-1.5 border-b border-rose-100/80">
          {DAYS_OF_WEEK.map((dw) => (
            <div
              key={dw.key}
              className={`text-xs font-bold py-1 ${
                dw.key === 'sat' ? 'text-amber-700' : 'text-stone-500'
              }`}
            >
              <span className="block text-xs">{dw.label}</span>
              <span className="hidden sm:block text-[9px] text-stone-400">{dw.name}</span>
            </div>
          ))}
        </div>

        {/* Calendar Cells Grid (7 Columns) */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {/* Preceding empty cells before Wednesday */}
          {Array.from({ length: emptyPrecedingSlots }).map((_, idx) => (
            <div
              key={`empty-${idx}`}
              className="h-12 sm:h-14 rounded-xl bg-stone-50/40 border border-transparent opacity-30 select-none pointer-events-none"
            />
          ))}

          {/* 29 Days of Kislev */}
          {days.map((day) => {
            const isUnlocked = isDayUnlocked(day);
            const isOpened = openedDayIds.includes(day.id);
            const isWeddingDay = day.day_number === 29;
            const hebrewNumeral =
              (day.day_number !== null
                ? HEBREW_DAYS_NUMERALS[day.day_number]
                : undefined) || `${day.day_number ?? ''}`;


            // 1. Wedding Day Special Styling (Day 29 - 9 Dec)
            if (isWeddingDay) {
              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => (isUnlocked ? onOpenDay(day) : showLockedToast(day))}
                  aria-label={`יום החתונה - כ״ט כסלו`}
                  className={`relative group h-12 sm:h-14 rounded-xl p-1 flex flex-col items-center justify-between transition-all duration-200 cursor-pointer ${
                    isUnlocked
                      ? 'bg-gradient-to-br from-amber-200 via-amber-100 to-rose-100 border-2 border-amber-400 shadow-sm hover:scale-105 ring-2 ring-amber-300/60'
                      : 'bg-amber-50/70 border border-amber-200 text-stone-600'
                  }`}
                >
                  <span className="text-[9px] font-extrabold text-amber-700 leading-none">
                    💍 חופה!
                  </span>
                  <span className="text-xs sm:text-sm font-black text-stone-800 leading-tight">
                    {hebrewNumeral}
                  </span>
                  <span className="text-[9px] font-semibold text-stone-500">
                    {day.civil_date}
                  </span>
                </button>
              );
            }

            // 2. Unlocked & Ready to Open (Unread)
            if (isUnlocked && !isOpened) {
              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => onOpenDay(day)}
                  aria-label={`יום ${day.hebrew_date} - הפתעה ממתינה לך!`}
                  className="relative group h-12 sm:h-14 rounded-xl p-1 flex flex-col items-center justify-between bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-sm ring-2 ring-rose-400/80 ring-offset-1 animate-pulse-subtle hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center">
                    <Gift className="w-2.5 h-2.5 text-white animate-bounce" />
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold text-white leading-tight drop-shadow-xs">
                    {hebrewNumeral}
                  </span>
                  <span className="text-[9px] font-medium text-rose-100">
                    {day.civil_date}
                  </span>
                </button>
              );
            }

            // 3. Unlocked & Opened (Re-viewable)
            if (isUnlocked && isOpened) {
              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => onOpenDay(day)}
                  aria-label={`יום ${day.hebrew_date} - צפייה חוזרת`}
                  className="relative group h-12 sm:h-14 rounded-xl p-1 flex flex-col items-center justify-between bg-white/95 border border-rose-200/90 text-stone-800 shadow-2xs hover:border-rose-400 hover:scale-102 active:scale-98 transition-all cursor-pointer"
                >
                  <div className="w-3 h-3 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
                    <Heart className="w-2 h-2 fill-rose-500" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-rose-600 leading-tight">
                    {hebrewNumeral}
                  </span>
                  <span className="text-[9px] text-stone-400 font-medium">
                    {day.civil_date}
                  </span>
                </button>
              );
            }

            // 4. Locked Tile
            return (
              <button
                key={day.id}
                type="button"
                onClick={() => showLockedToast(day)}
                aria-label={`יום ${day.hebrew_date} נעול עד ${day.civil_date}`}
                className="relative h-12 sm:h-14 rounded-xl p-1 flex flex-col items-center justify-between bg-stone-100/70 border border-stone-200/50 text-stone-400 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <div className="w-3 h-3 flex items-center justify-center text-stone-300">
                  <Lock className="w-2.5 h-2.5" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-stone-400 leading-tight">
                  {hebrewNumeral}
                </span>
                <span className="text-[9px] text-stone-400">
                  {day.civil_date}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend at bottom of calendar */}
      <div className="mt-3 flex items-center justify-center gap-3 text-[11px] text-stone-500 flex-wrap">
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 ring-1 ring-rose-300" />
          <span>הפתעה מחכה</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-white border border-rose-300" />
          <span>נפתח כבר</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-stone-200" />
          <span>נעול</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-300 border border-amber-400" />
          <span>יום החתונה 💍</span>
        </span>
      </div>
    </div>
  );
};
