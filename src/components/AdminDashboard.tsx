import React, { useState, useMemo } from 'react';
import {
  ArrowRight,
  Sparkles,
  FileText,
  Ticket,
  HelpCircle,
  Video,
  Search,
} from 'lucide-react';
import type { CountdownDay, DayContentType } from '../types/countdown';


interface AdminDashboardProps {
  days: CountdownDay[];
  onOpenDayModal: (day: CountdownDay) => void;
  onBackToBrideView: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  days,
  onOpenDayModal,
  onBackToBrideView,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filtered days
  const filteredDays = useMemo(() => {
    return days.filter((d) => {
      const matchesType = filterType === 'all' || d.type === filterType;
      const matchesSearch =
        searchQuery.trim() === '' ||
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.sender_name && d.sender_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (d.hebrew_date && d.hebrew_date.includes(searchQuery)) ||
        d.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(d.day_number).includes(searchQuery);

      return matchesType && matchesSearch;
    });
  }, [days, filterType, searchQuery]);

  const counts = useMemo(() => {
    return {
      all: days.length,
      letter: days.filter((d) => d.type === 'letter').length,
      coupon: days.filter((d) => d.type === 'coupon').length,
      quiz: days.filter((d) => d.type === 'quiz').length,
      video: days.filter((d) => d.type === 'video').length,
    };
  }, [days]);

  const renderTypeIcon = (type: DayContentType) => {
    switch (type) {
      case 'letter':
        return <FileText className="w-3.5 h-3.5 text-rose-500" />;
      case 'coupon':
        return <Ticket className="w-3.5 h-3.5 text-amber-500" />;
      case 'quiz':
        return <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />;
      case 'video':
        return <Video className="w-3.5 h-3.5 text-purple-500" />;
    }
  };

  const getTypeNameInHebrew = (type: DayContentType) => {
    switch (type) {
      case 'letter':
        return 'מכתב';
      case 'coupon':
        return 'קופון';
      case 'quiz':
        return 'חידון';
      case 'video':
        return 'סרטון';
    }
  };

  return (
    <div className="w-full pb-16">
      {/* Admin Top Sticky Navigation */}
      <div className="sticky top-0 z-30 bg-stone-900/90 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-lg border border-stone-800 mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-sm">
            🛠️
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">
              תצוגת מנהל ומפתח
            </h1>
            <p className="text-[11px] text-stone-400">
              כל {days.length} הימים פתוחים לבדיקה
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBackToBrideView}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>חזרה לכלה</span>
        </button>
      </div>

      {/* Admin Notice */}
      <div className="glass-panel-rose rounded-2xl p-4 mb-4 border border-rose-200/80 shadow-2xs">
        <div className="flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div className="text-xs text-stone-700 leading-relaxed">
            <strong>שלום חתן / מפתח!</strong> כאן תוכל לראות ולפתוח את כל התכנים,
            החידונים, המכתבים והשוברים ללא הגבלת תאריכים. לחץ על כל כרטיס כדי
            לבדוק את החלון שלו כפי שהכלה תראה אותו.
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="glass-panel rounded-2xl p-3 mb-4 border border-rose-100 shadow-2xs space-y-2.5">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="חיפוש לפי כותרת, שולח, יום או תוכן..."
            className="w-full pr-9 pl-3 py-2 bg-white rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-rose-400"
          />
        </div>

        {/* Type Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 ${
              filterType === 'all'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-white text-stone-600 hover:bg-rose-50 border border-stone-200'
            }`}
          >
            הכל ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('letter')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 flex items-center gap-1 ${
              filterType === 'letter'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-white text-stone-600 hover:bg-rose-50 border border-stone-200'
            }`}
          >
            <FileText className="w-3 h-3" />
            <span>מכתבים ({counts.letter})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType('coupon')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 flex items-center gap-1 ${
              filterType === 'coupon'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-white text-stone-600 hover:bg-rose-50 border border-stone-200'
            }`}
          >
            <Ticket className="w-3 h-3" />
            <span>קופונים ({counts.coupon})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType('quiz')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 flex items-center gap-1 ${
              filterType === 'quiz'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-white text-stone-600 hover:bg-rose-50 border border-stone-200'
            }`}
          >
            <HelpCircle className="w-3 h-3" />
            <span>חידונים ({counts.quiz})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType('video')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 flex items-center gap-1 ${
              filterType === 'video'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-white text-stone-600 hover:bg-rose-50 border border-stone-200'
            }`}
          >
            <Video className="w-3 h-3" />
            <span>סרטונים ({counts.video})</span>
          </button>
        </div>
      </div>

      {/* Grid of All Cards */}
      <div className="grid grid-cols-2 gap-3">
        {filteredDays.map((day) => (
          <button
            key={day.id}
            type="button"
            onClick={() => onOpenDayModal(day)}
            className="group text-right p-3.5 rounded-2xl bg-white border border-rose-200/80 hover:border-rose-400 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer active:scale-98 relative overflow-hidden"
          >
            {/* Top Row: Day badges */}
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100">
                {day.hebrew_date || `יום ${day.day_number}`}
              </span>

              <div className="flex items-center gap-1">
                <span
                  className="w-6 h-6 rounded-full bg-stone-50 border border-stone-200/60 flex items-center justify-center"
                  title={getTypeNameInHebrew(day.type)}
                >
                  {renderTypeIcon(day.type)}
                </span>
                <span className="text-[10px] text-stone-400 font-mono">
                  {day.civil_date}
                </span>
              </div>
            </div>

            {/* Title & Preview */}
            <div className="my-auto py-1 w-full">
              <h3 className="text-xs sm:text-sm font-bold text-stone-800 line-clamp-2 leading-tight group-hover:text-rose-600 transition-colors">
                {day.title}
              </h3>
              {day.sender_name && (
                <p className="text-[11px] text-stone-500 mt-1 line-clamp-1">
                  מאת: {day.sender_name}
                </p>
              )}
            </div>

            {/* Bottom Action */}
            <div className="w-full mt-2 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-rose-500 font-semibold">
              <span>פתח לבדיקה</span>
              <span className="text-stone-300 group-hover:text-rose-500 transition-colors">
                🔍
              </span>
            </div>
          </button>
        ))}
      </div>

      {filteredDays.length === 0 && (
        <div className="text-center py-12 text-stone-400 text-xs">
          לא נמצאו ימים התואמים את החיפוש.
        </div>
      )}
    </div>
  );
};
