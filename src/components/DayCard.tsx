import React from 'react';
import { Lock, Gift, CheckCircle2, FileText, Video, HelpCircle, Ticket } from 'lucide-react';
import type { CountdownDay, DayContentType } from '../types/countdown';

interface DayCardProps {
  day: CountdownDay;
  isOpened: boolean;
  isPreviewMode: boolean;
  onOpen: (day: CountdownDay) => void;
}

export const DayCard: React.FC<DayCardProps> = ({
  day,
  isOpened,
  isPreviewMode,
  onOpen,
}) => {
  // Check unlock status normalized to local midnight 00:00:00
  const isUnlocked = React.useMemo(() => {
    if (isPreviewMode) return true;
    if (!day.unlock_date) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Parse 'YYYY-MM-DD'
    const [year, month, dayNum] = day.unlock_date.split('-').map(Number);
    const unlockDate = new Date(year, month - 1, dayNum, 0, 0, 0, 0);

    return today.getTime() >= unlockDate.getTime();
  }, [day.unlock_date, isPreviewMode]);

  // Format unlock date to Hebrew (e.g. "25 באוק׳")
  const formattedUnlockDate = React.useMemo(() => {
    if (!day.unlock_date) return 'טרם נקבע';
    try {
      const [year, month, dayNum] = day.unlock_date.split('-').map(Number);
      const date = new Date(year, month - 1, dayNum);
      return new Intl.DateTimeFormat('he-IL', {
        day: 'numeric',
        month: 'short',
      }).format(date);
    } catch {
      return day.unlock_date || '';
    }
  }, [day.unlock_date]);


  // Type icon helper
  const renderTypeIcon = (type: DayContentType) => {
    switch (type) {
      case 'letter':
        return <FileText className="w-3.5 h-3.5 text-rose-500" />;
      case 'video':
        return <Video className="w-3.5 h-3.5 text-rose-500" />;
      case 'quiz':
        return <HelpCircle className="w-3.5 h-3.5 text-rose-500" />;
      case 'coupon':
        return <Ticket className="w-3.5 h-3.5 text-rose-500" />;
    }
  };

  const getTypeNameInHebrew = (type: DayContentType) => {
    switch (type) {
      case 'letter':
        return 'מכתב';
      case 'video':
        return 'סרטון';
      case 'quiz':
        return 'חידון';
      case 'coupon':
        return 'קופון';
    }
  };

  // State 1: Locked
  if (!isUnlocked) {
    return (
      <div
        role="button"
        tabIndex={-1}
        aria-disabled="true"
        aria-label={`יום ${day.day_number} נעול עד ${formattedUnlockDate}`}
        className="relative group flex flex-col justify-between p-4 rounded-2xl bg-stone-100/90 border border-stone-200/80 text-stone-400 select-none cursor-not-allowed shadow-2xs opacity-85 transition-all"
      >
        {/* Top row: Day badge & Lock icon */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-stone-200/80 text-stone-500">
            יום {day.day_number}
          </span>
          <div className="w-7 h-7 rounded-full bg-stone-200/90 flex items-center justify-center text-stone-500">
            <Lock className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Center: Teaser */}
        <div className="my-auto py-2 text-center">
          <span className="block text-xs font-semibold text-stone-600 mb-0.5">
            {formattedUnlockDate}
          </span>
          <p className="text-[11px] text-stone-400 font-medium">נעול בינתיים...</p>
        </div>

        {/* Bottom hint */}
        <div className="mt-2 text-center pt-2 border-t border-stone-200/50">
          <span className="text-[10px] text-stone-400">הפתעה מיוחדת</span>
        </div>
      </div>
    );
  }

  // State 2: Unlocked & Unread (Ready to Open!)
  if (!isOpened) {
    return (
      <button
        type="button"
        onClick={() => onOpen(day)}
        aria-label={`יום ${day.day_number} - הפתעה מחכה לך! לחצי לפתיחה`}
        className="relative group flex flex-col justify-between p-4 rounded-2xl bg-gradient-to-br from-rose-400 via-rose-500 to-pink-500 text-white shadow-md hover:shadow-lg transition-all duration-300 text-right cursor-pointer animate-pulse-subtle hover:scale-[1.03] active:scale-[0.98] border border-rose-300/40"
      >
        {/* Top row */}
        <div className="flex items-center justify-between w-full mb-2">
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/25 text-white backdrop-blur-xs">
            יום {day.day_number}
          </span>
          <div className="w-8 h-8 rounded-full bg-white text-rose-500 flex items-center justify-center shadow-xs animate-bounce">
            <Gift className="w-4 h-4" />
          </div>
        </div>

        {/* Center content */}
        <div className="my-auto py-2 w-full text-center">
          <span className="inline-block text-xs font-bold tracking-wide text-rose-100 uppercase mb-1">
            נפתח היום!
          </span>
          <h3 className="text-sm font-bold text-white drop-shadow-xs line-clamp-1">
            הפתעה מחכה לך!
          </h3>
          <p className="text-[11px] text-rose-100/90 mt-1">לחצי לפתיחה ✨</p>
        </div>

        {/* Bottom sparkler */}
        <div className="w-full mt-2 pt-2 border-t border-white/20 text-center">
          <span className="text-[10px] font-medium text-white/90">הפתעה שלא נפתחה</span>
        </div>
      </button>
    );
  }

  // State 3: Unlocked & Opened (Saved in localStorage)
  return (
    <button
      type="button"
      onClick={() => onOpen(day)}
      aria-label={`יום ${day.day_number} - ${day.title}. לחצי לצפייה חוזרת`}
      className="relative group flex flex-col justify-between p-4 rounded-2xl bg-white/95 border border-rose-200/90 text-stone-800 shadow-2xs hover:shadow-md transition-all duration-200 text-right cursor-pointer hover:border-rose-400 hover:scale-[1.01] active:scale-[0.99]"
    >
      {/* Top row: Day badge, Type badge, Checkmark */}
      <div className="flex items-center justify-between w-full mb-2">
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
          יום {day.day_number}
        </span>
        <div className="flex items-center gap-1">
          <div className="w-6 h-6 rounded-full bg-rose-50 flex items-center justify-center" title={getTypeNameInHebrew(day.type)}>
            {renderTypeIcon(day.type)}
          </div>
          <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Center content: Day Title & Sender */}
      <div className="my-auto py-1 w-full">
        <h3 className="text-xs sm:text-sm font-bold text-stone-800 line-clamp-2 leading-tight group-hover:text-rose-600 transition-colors">
          {day.title}
        </h3>
        {day.sender_name && (
          <p className="text-[11px] text-stone-500 mt-1 line-clamp-1">
            {day.sender_name}
          </p>
        )}
      </div>

      {/* Bottom action link */}
      <div className="w-full mt-2 pt-2 border-t border-rose-100/70 flex items-center justify-between text-[10px] text-rose-500 font-medium">
        <span>צפייה חוזרת</span>
        <span>←</span>
      </div>
    </button>
  );
};
