import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Heart, RefreshCw, ShieldCheck, ShieldAlert } from 'lucide-react';
import type { CountdownDay } from './types/countdown';
import { BRIDE_NAME, GROOM_NAME, WEDDING_DATE } from './config/constants';
import { fetchCountdownDays } from './lib/supabase';
import { HeaderCountdown } from './components/HeaderCountdown';
import { HebrewCalendarGrid } from './components/HebrewCalendarGrid';
import { AdminDashboard } from './components/AdminDashboard';
import { DayModal } from './components/DayModal';

const STORAGE_KEY = 'wedding_countdown_opened_days';

export const App: React.FC = () => {
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

  // View mode: 'bride' (Hebrew Calendar) or 'admin' (Groom / Developer Dashboard)
  const [viewMode, setViewMode] = useState<'bride' | 'admin'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('admin') === 'true' || params.get('view') === 'admin'
        ? 'admin'
        : 'bride';
    }
    return 'bride';
  });

  // Load countdown days
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      try {
        const data = await fetchCountdownDays();
        if (isMounted) {
          setDays(data);
        }
      } catch (err) {
        console.error('Failed to load countdown days:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

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

  // Switch to admin view and update URL parameter
  const handleSwitchToAdmin = () => {
    setViewMode('admin');
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('view', 'admin');
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Switch back to bride view and remove URL parameter
  const handleSwitchToBride = () => {
    setViewMode('bride');
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('view');
      url.searchParams.delete('admin');
      window.history.replaceState({}, '', url.toString());
    }
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

  // Preview mode toggle for Bride Calendar
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('preview') === 'true';
    }
    return false;
  });

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
        {viewMode === 'admin' ? (
          /* Admin / Developer Screen */
          <div className="pt-4">
            <AdminDashboard
              days={days}
              onOpenDayModal={(day) => setSelectedDay(day)}
              onBackToBrideView={handleSwitchToBride}
            />
          </div>
        ) : (
          /* Bride's Hebrew Calendar Screen */
          <>
            <HeaderCountdown
              brideName={BRIDE_NAME}
              groomName={GROOM_NAME}
              weddingDate={WEDDING_DATE}
              totalDays={days.length}
              openedDaysCount={openedDayIds.length}
              onOpenAdmin={handleSwitchToAdmin}
            />

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
            <section className="my-2">
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
                  onClick={handleSwitchToAdmin}
                  type="button"
                  className="hover:text-amber-700 text-stone-500 flex items-center gap-1 cursor-pointer font-semibold"
                >
                  <ShieldAlert className="w-3 h-3 text-amber-500" />
                  <span>פאנל מנהל</span>
                </button>
              </div>
            </footer>
          </>
        )}
      </main>

      {/* Detail Modal for Surprises (Letters, Quizzes, Coupons, Videos) */}
      <DayModal day={selectedDay} onClose={() => setSelectedDay(null)} />
    </div>
  );
};


export default App;
