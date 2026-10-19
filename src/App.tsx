import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Heart, RefreshCw, ShieldCheck, ShieldAlert, Send } from 'lucide-react';
import type { CountdownDay } from './types/countdown';
import { BRIDE_NAME, GROOM_NAME, WEDDING_DATE } from './config/constants';
import { fetchApprovedDays, fetchAllSubmissions } from './lib/supabase';
import { HeaderCountdown } from './components/HeaderCountdown';
import { HebrewCalendarGrid } from './components/HebrewCalendarGrid';
import { AdminDashboard } from './components/AdminDashboard';
import { SubmitGreeting } from './components/SubmitGreeting';
import { DayModal } from './components/DayModal';

const STORAGE_KEY = 'wedding_countdown_opened_days';

type AppMode = 'bride' | 'admin' | 'submit';

function getModeFromUrl(): AppMode {
  if (typeof window === 'undefined') return 'bride';
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');
  if (
    mode === 'admin' ||
    params.get('admin') === 'true' ||
    params.get('view') === 'admin'
  ) {
    return 'admin';
  }
  if (mode === 'submit' || params.get('submit') === 'true') {
    return 'submit';
  }
  return 'bride';
}

export const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(getModeFromUrl);
  const [days, setDays] = useState<CountdownDay[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [openedDayIds, setOpenedDayIds] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [selectedDay, setSelectedDay] = useState<CountdownDay | null>(null);

  // Preview mode toggle for Bride Calendar
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('preview') === 'true';
    }
    return false;
  });

  // Sync mode with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setMode(getModeFromUrl());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Navigate mode helper
  const navigateToMode = useCallback((newMode: AppMode) => {
    setMode(newMode);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('view');
      url.searchParams.delete('admin');
      url.searchParams.delete('submit');

      if (newMode === 'admin') {
        url.searchParams.set('mode', 'admin');
      } else if (newMode === 'submit') {
        url.searchParams.set('mode', 'submit');
      } else {
        url.searchParams.delete('mode');
      }
      window.history.pushState({}, '', url.toString());
    }
  }, []);

  // Fetch data depending on active mode
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (mode === 'admin') {
        const allItems = await fetchAllSubmissions();
        setDays(allItems);
      } else {
        const approvedItems = await fetchApprovedDays();
        setDays(approvedItems);
      }
    } catch (err) {
      console.error('Failed to load countdown days:', err);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Save opened days to localStorage
  const markDayAsOpened = (id: number) => {
    setOpenedDayIds((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn('LocalStorage save failed:', err);
      }
      return updated;
    });
  };

  // Reset opened progress (for testing)
  const handleResetProgress = () => {
    if (window.confirm('האם לאפס את כל ההפתעות שכבר נפתחו?')) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (err) {
        console.warn(err);
      }
      setOpenedDayIds([]);
    }
  };

  const handleTogglePreview = () => {
    setIsPreviewMode((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        if (next) {
          url.searchParams.set('preview', 'true');
        } else {
          url.searchParams.delete('preview');
        }
        window.history.replaceState({}, '', url.toString());
      }
      return next;
    });
  };

  // Handle opening a day from the Hebrew Calendar
  const handleDayClick = (day: CountdownDay) => {
    const isAlreadyOpened = openedDayIds.includes(day.id);

    // If first-time opening an unlocked day: blast celebratory confetti!
    if (!isAlreadyOpened) {
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f43f5e', '#fb7185', '#fda4af', '#fbbf24', '#fbcfe8'],
        });
      } catch (err) {
        console.warn('Confetti error:', err);
      }
      markDayAsOpened(day.id);
    }

    setSelectedDay(day);
  };

  // 1. Guest Submission View (?mode=submit)
  if (mode === 'submit') {
    return (
      <SubmitGreeting
        onBackToCountdown={() => navigateToMode('bride')}
      />
    );
  }

  // 2. Admin Scheduling Dashboard View (?mode=admin)
  if (mode === 'admin') {
    return (
      <div
        dir="rtl"
        className="min-h-screen text-stone-800 bg-rose-50/60 pb-10 selection:bg-rose-200"
      >
        <main className="relative z-10 max-w-md mx-auto pt-4 px-3 sm:px-4">
          <AdminDashboard
            days={days}
            onOpenDayModal={(day) => setSelectedDay(day)}
            onBackToBrideView={() => navigateToMode('bride')}
            onRefreshData={loadData}
          />
        </main>
        <DayModal day={selectedDay} onClose={() => setSelectedDay(null)} />
      </div>
    );
  }

  // 3. Default: Bride's Countdown Board
  return (
    <div
      dir="rtl"
      className="min-h-screen text-stone-800 bg-rose-50/60 pb-10 selection:bg-rose-200"
    >
      {/* Background ambient decorative glowing orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-rose-200/30 blur-3xl animate-float" />
        <div className="absolute top-1/2 -left-32 w-96 h-96 rounded-full bg-pink-200/25 blur-3xl" />
        <div className="absolute -bottom-20 right-1/4 w-72 h-72 rounded-full bg-amber-100/40 blur-3xl" />
      </div>

      {/* Main Mobile App Container */}
      <main className="relative z-10 max-w-md mx-auto min-h-screen flex flex-col px-3 sm:px-4">
        <HeaderCountdown
          brideName={BRIDE_NAME}
          groomName={GROOM_NAME}
          weddingDate={WEDDING_DATE}
          totalDays={29}
          openedDaysCount={openedDayIds.length}
          onOpenAdmin={() => navigateToMode('admin')}
        />

        {/* Guest submission invitation banner */}
        <div className="mb-3 px-3 py-2 rounded-2xl bg-gradient-to-r from-rose-100/90 via-pink-100/80 to-rose-50/90 border border-rose-200/80 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-white text-rose-500 flex items-center justify-center text-xs shadow-2xs">
              💌
            </span>
            <div className="text-right">
              <span className="block text-xs font-bold text-stone-800 leading-tight">
                חברים ומשפחה?
              </span>
              <span className="block text-[11px] text-stone-500">
                שלחו הפתעה שתשובץ בלוח
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigateToMode('submit')}
            className="px-2.5 py-1 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
          >
            <Send className="w-3 h-3" />
            <span>שליחה</span>
          </button>
        </div>

        {/* Preview Banner if active */}
        {isPreviewMode && (
          <div className="mb-2 p-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-xs text-center flex items-center justify-center gap-1.5 shadow-2xs">
            <span>🔓 מצב בדיקה פעיל — כל משבצות הלוח פתוחות</span>
            <button
              type="button"
              onClick={handleTogglePreview}
              className="underline font-bold text-amber-900 mr-1 cursor-pointer"
            >
              כיבוי
            </button>
          </div>
        )}

        {/* Hebrew Calendar Grid */}
        <section className="my-1">
          {loading ? (
            <div className="h-64 rounded-2xl bg-white/70 animate-pulse border border-rose-100/80 p-4" />
          ) : (
            <HebrewCalendarGrid
              days={days}
              openedDayIds={openedDayIds}
              isPreviewMode={isPreviewMode}
              onOpenDay={handleDayClick}
            />
          )}
        </section>

        {/* Romantic App Footer */}
        <footer className="mt-auto pt-6 pb-4 border-t border-rose-200/50 text-center text-xs text-stone-500 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-rose-200/60 shadow-2xs">
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
            <span>נבנה באהבה אינסופית עבור {BRIDE_NAME}</span>
          </div>

          <div className="flex items-center justify-center gap-2.5 text-[11px] text-stone-400 flex-wrap">
            <button
              onClick={() => navigateToMode('submit')}
              type="button"
              className="hover:text-rose-600 text-stone-500 transition-colors flex items-center gap-1 cursor-pointer font-medium"
            >
              <span>שליחת ברכה</span>
            </button>
            <span>•</span>
            <button
              onClick={handleTogglePreview}
              type="button"
              className={`transition-colors flex items-center gap-1 cursor-pointer ${
                isPreviewMode ? 'text-amber-600 font-bold' : 'hover:text-stone-600'
              }`}
            >
              <span>{isPreviewMode ? 'נעילת לוח' : 'פתיחה לבדיקה'}</span>
            </button>
            <span>•</span>
            <button
              onClick={handleResetProgress}
              type="button"
              className="hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>איפוס</span>
            </button>
            <span>•</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>שמור</span>
            </span>
            <span>•</span>
            <button
              onClick={() => navigateToMode('admin')}
              type="button"
              className="hover:text-amber-700 text-stone-500 flex items-center gap-1 cursor-pointer font-semibold"
            >
              <ShieldAlert className="w-3 h-3 text-amber-500" />
              <span>מנהל</span>
            </button>
          </div>
        </footer>
      </main>

      {/* Detail Modal for Surprises (Letters, Quizzes, Coupons, Videos) */}
      <DayModal day={selectedDay} onClose={() => setSelectedDay(null)} />
    </div>
  );
};

export default App;
