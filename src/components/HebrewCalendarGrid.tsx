import React, { useState, useMemo } from 'react';
import { Lock, Gift, Sparkles, Heart } from 'lucide-react';
import type { CountdownDay } from '../types/countdown';

import { HEBREW_DAYS_NUMERALS, getDayMetadata } from '../config/constants';

interface HebrewCalendarGridProps {
  days: CountdownDay[];
  openedDayIds: number[];
  onOpenDay: (day: CountdownDay) => void;
  isPreviewMode?: boolean;
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
  onOpenDay,
  isPreviewMode = false,
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
    if (!day.unlock_date) return false;
    if (isPreviewMode) return true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [year, month, dayNum] = day.unlock_date.split('-').map(Number);
    const unlockDate = new Date(year, month - 1, dayNum, 0, 0, 0, 0);

    return today.getTime() >= unlockDate.getTime();
  };

  // Build the complete list of 30 calendar days
  const calendarDays = useMemo(() => {
    return Array.from({ length: 30 }).map((_, index) => {
      const dayNumber = index;
      const existingDay = days.find((d) => d.day_number === dayNumber);
      const metadata = getDayMetadata(dayNumber);
      return (
        existingDay || {
          id: -(dayNumber + 1),
          day_number: dayNumber,
          title: 'נעול',
          type: 'letter' as const,
          content: '',
          unlock_date: metadata.unlock_date,
          hebrew_date: metadata.hebrew_date || '',
          civil_date: metadata.civil_date || '',
          day_of_week: metadata.day_of_week || '',
        }
      );
    });
  }, [days]);

  // Determine which day is "Today" (the current day)
  const currentDay = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Exact calendar match with unlock_date
    const exactMatch = calendarDays.find((d) => {
      if (!d.unlock_date) return false;
      const [year, month, dayNum] = d.unlock_date.split('-').map(Number);
      const unlockDate = new Date(year, month - 1, dayNum, 0, 0, 0, 0);
      return today.getTime() === unlockDate.getTime();
    });

    if (exactMatch) return exactMatch;

    // If in preview mode and today's date is outside the calendar dates,
    // fallback to first unread day or Day 1
    if (isPreviewMode) {
      const firstUnopened = calendarDays.find((d) => !openedDayIds.includes(d.id));
      return firstUnopened || calendarDays[1] || calendarDays[0];
    }

    return null;
  }, [calendarDays, isPreviewMode, openedDayIds]);

  const currentDayUnread = useMemo(() => {
    if (!currentDay) return null;
    const isUnlocked = isDayUnlocked(currentDay);
    const isOpened = openedDayIds.includes(currentDay.id);
    return isUnlocked && !isOpened ? currentDay : null;
  }, [currentDay, openedDayIds, isPreviewMode]);

  // Day 0 (ל' חשוון) starts on Tuesday (Index 2: Sun=0, Mon=1, Tue=2).
  // Therefore, we render 2 empty slots before Day 0.
  const emptyPrecedingSlots = 2;

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
                10 בנובמבר — 9 בדצמבר 2026
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-medium text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
            <Sparkles className="w-3 h-3 text-rose-500 animate-pulse" />
            <span>30 הפתעות עד החופה</span>
          </div>
        </div>

        {/* Today's Special Surprise Invitation Banner */}
        {currentDayUnread && (
          <button
            type="button"
            onClick={() => onOpenDay(currentDayUnread)}
            className="mt-3 w-full p-2.5 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white shadow-md hover:shadow-lg transition-all flex items-center justify-between gap-2 group cursor-pointer animate-pulse-subtle"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <Gift className="w-4 h-4 text-white animate-bounce" />
              </div>
              <div className="text-right">
                <div className="text-xs font-black leading-tight flex items-center gap-1">
                  <span>ההפתעה של היום מחכה לך! ✨</span>
                </div>
                <div className="text-[10px] text-rose-100 font-medium">
                  {currentDayUnread.hebrew_date || `יום ${currentDayUnread.day_number}`} ({currentDayUnread.civil_date}) • לחצי לפתיחה
                </div>
              </div>
            </div>

            <span className="text-[11px] font-bold bg-white text-rose-600 px-2.5 py-1 rounded-full shadow-xs group-hover:bg-amber-100 transition-colors shrink-0">
              פתחי עכשיו 🎁
            </span>
          </button>
        )}
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
          {/* Preceding empty cells before Tuesday */}
          {Array.from({ length: emptyPrecedingSlots }).map((_, idx) => (
            <div
              key={`empty-${idx}`}
              className="h-12 sm:h-14 rounded-xl bg-stone-50/40 border border-transparent opacity-30 select-none pointer-events-none"
            />
          ))}

          {/* 30 Days of Surprises (includes day 0) */}
          {calendarDays.map((day) => {
            const isUnlocked = isDayUnlocked(day);
            const isOpened = openedDayIds.includes(day.id);
            const isWeddingDay = day.day_number === 29;
            const isCurrent = currentDay?.day_number === day.day_number;
            const hebrewNumeral =
              (day.day_number !== null
                ? HEBREW_DAYS_NUMERALS[day.day_number]
                : undefined) || `${day.day_number ?? ''}`;

            // 1. Wedding Day Special Styling (Day 29 - 9 Dec)
            if (isWeddingDay) {
              const isCurrentWeddingDay = isCurrent;
              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => (isUnlocked ? onOpenDay(day) : showLockedToast(day))}
                  aria-label={`יום החתונה - כ״ט כסלו${isCurrentWeddingDay ? ' - היום החופה!' : ''}`}
                  className={`relative group h-12 sm:h-14 rounded-xl p-1 flex flex-col items-center justify-between transition-all duration-200 cursor-pointer ${
                    isCurrentWeddingDay
                      ? 'bg-gradient-to-br from-amber-300 via-amber-200 to-rose-200 border-2 border-amber-500 ring-4 ring-amber-400/80 shadow-lg animate-today-glow z-10 scale-105'
                      : isUnlocked
                      ? 'bg-gradient-to-br from-amber-200 via-amber-100 to-rose-100 border-2 border-amber-400 shadow-sm hover:scale-105 ring-2 ring-amber-300/60'
                      : 'bg-amber-50/70 border border-amber-200 text-stone-600'
                  }`}
                >
                  {isCurrentWeddingDay && (
                    <span className="absolute -top-2.5 z-20 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-stone-900 font-black text-[9px] shadow-md border border-white flex items-center gap-1 animate-bounce select-none pointer-events-none">
                      <Sparkles className="w-2.5 h-2.5 text-amber-950 animate-spin" />
                      <span>היום! 💍</span>
                    </span>
                  )}
                  <span className="text-[9px] font-extrabold text-amber-800 leading-none">
                    💍 חופה!
                  </span>
                  <span className="text-xs sm:text-sm font-black text-stone-800 leading-tight">
                    {hebrewNumeral}
                  </span>
                  <span className="text-[9px] font-semibold text-stone-600">
                    {day.civil_date}
                  </span>
                </button>
              );
            }

            // 2. The Current Day - Unlocked & Ready to Open (Unread)
            // Vibrant, glowing and specially colored to invite tapping!
            if (isCurrent && isUnlocked && !isOpened) {
              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => onOpenDay(day)}
                  aria-label={`יום ${day.hebrew_date} - ההפתעה של היום מחכה לך! לחצי לפתיחה`}
                  className="relative group h-12 sm:h-14 rounded-xl p-1 flex flex-col items-center justify-between bg-gradient-to-br from-rose-500 via-pink-600 to-amber-500 text-white border-2 border-amber-300/90 ring-2 ring-amber-400/90 ring-offset-2 ring-offset-rose-100 shadow-lg animate-today-glow z-10 scale-105 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer overflow-visible"
                >
                  {/* Floating "היום!" Badge */}
                  <span className="absolute -top-2.5 z-20 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-300 text-stone-900 font-black text-[9px] shadow-md border border-white flex items-center gap-1 animate-bounce select-none pointer-events-none">
                    <Sparkles className="w-2.5 h-2.5 text-amber-950 animate-spin" />
                    <span>היום!</span>
                  </span>

                  {/* Silky Shine Sweep Glare Effect */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
                    <div className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-white/35 to-transparent -skew-x-12 animate-shine-sweep" />
                  </div>

                  {/* Top bouncing gift icon */}
                  <div className="w-3.5 h-3.5 rounded-full bg-amber-400/30 border border-amber-200/50 flex items-center justify-center shadow-2xs">
                    <Gift className="w-2.5 h-2.5 text-amber-100 animate-bounce" />
                  </div>

                  {/* Hebrew Numeral */}
                  <span className="text-xs sm:text-sm font-black text-white leading-tight drop-shadow-md tracking-wide">
                    {hebrewNumeral}
                  </span>

                  {/* Inviting Bottom CTA */}
                  <span className="text-[9px] font-extrabold text-amber-200 leading-none drop-shadow-xs">
                    פתחי אותי! ✨
                  </span>
                </button>
              );
            }

            // 3. The Current Day - Already Opened
            if (isCurrent && isUnlocked && isOpened) {
              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => onOpenDay(day)}
                  aria-label={`יום ${day.hebrew_date} - ההפתעה של היום (נפתחה)`}
                  className="relative group h-12 sm:h-14 rounded-xl p-1 flex flex-col items-center justify-between bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50/70 border-2 border-rose-400 ring-2 ring-rose-300/60 shadow-md text-stone-800 z-10 scale-102 hover:border-rose-500 hover:scale-108 active:scale-95 transition-all cursor-pointer overflow-visible"
                >
                  {/* Floating "היום" Badge */}
                  <span className="absolute -top-2 z-20 px-1.5 py-0.2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white font-extrabold text-[8px] shadow-xs flex items-center gap-0.5 select-none pointer-events-none">
                    <Sparkles className="w-2 h-2 text-rose-100" />
                    <span>היום</span>
                  </span>

                  <div className="w-3 h-3 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center">
                    <Heart className="w-2 h-2 fill-rose-500 animate-pulse" />
                  </div>

                  <span className="text-xs sm:text-sm font-black text-rose-600 leading-tight">
                    {hebrewNumeral}
                  </span>

                  <span className="text-[9px] text-rose-500 font-semibold">
                    {day.civil_date}
                  </span>
                </button>
              );
            }

            // 4. Past Days Unlocked & Ready to Open (Unread)
            if (isUnlocked && !isOpened) {
              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => onOpenDay(day)}
                  aria-label={`יום ${day.hebrew_date} - הפתעה ממתינה לך!`}
                  className="relative group h-12 sm:h-14 rounded-xl p-1 flex flex-col items-center justify-between bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-sm ring-1 ring-rose-400/60 animate-pulse-subtle hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center">
                    <Gift className="w-2.5 h-2.5 text-white" />
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

            // 5. Past Days Unlocked & Opened (Re-viewable)
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

            // 6. Locked Tile
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
      <div className="mt-3 flex items-center justify-center gap-2.5 text-[11px] text-stone-500 flex-wrap">
        <span className="inline-flex items-center gap-1 font-bold text-rose-700">
          <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-rose-500 via-pink-600 to-amber-400 ring-2 ring-amber-300 animate-pulse" />
          <span>היום הנוכחי ✨</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500" />
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
