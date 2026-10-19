import React, { useState, useEffect } from 'react';
import {
  X,
  Heart,
  Sparkles,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Gift,
  Film,
  Mail,
  HelpCircle,
  Ticket,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { CountdownDay, DayContentType } from '../types/countdown';


interface DayModalProps {
  day: CountdownDay | null;
  onClose: () => void;
}

export const DayModal: React.FC<DayModalProps> = ({ day, onClose }) => {
  // Quiz state
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  // Coupon state
  const [isScratched, setIsScratched] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Reset internal states whenever the open day changes
  useEffect(() => {
    setSelectedOption(null);
    setIsScratched(false);
    setCopiedCode(false);
  }, [day?.id]);

  // Lock body scroll and handle Escape key
  useEffect(() => {
    if (!day) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [day, onClose]);

  if (!day) return null;

  // Handle Quiz Selection
  const handleOptionSelect = (index: number) => {
    if (selectedOption !== null) return; // Prevent changing after pick
    setSelectedOption(index);

    if (day.quiz_data && index === day.quiz_data.correctIndex) {
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#f43f5e', '#fb7185', '#fda4af', '#fef08a'],
        });
      } catch (err) {
        console.warn('Confetti error:', err);
      }
    }
  };

  // Handle Coupon Scratch / Reveal
  const handleScratchReveal = () => {
    if (isScratched) return;
    setIsScratched(true);
    try {
      confetti({
        particleCount: 100,
        spread: 75,
        origin: { y: 0.55 },
        colors: ['#e11d48', '#f43f5e', '#fb7185', '#f59e0b', '#fbbf24'],
      });
    } catch (err) {
      console.warn('Confetti error:', err);
    }
  };

  // Handle Copy Coupon Code
  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.warn('Failed to copy code:', err);
    }
  };

  const renderBadgeIcon = (type: DayContentType) => {
    switch (type) {
      case 'letter':
        return <Mail className="w-3.5 h-3.5" />;
      case 'video':
        return <Film className="w-3.5 h-3.5" />;
      case 'quiz':
        return <HelpCircle className="w-3.5 h-3.5" />;
      case 'coupon':
        return <Ticket className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="relative w-full max-w-md max-h-[90vh] flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden border border-rose-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Decorative Header */}
        <div className="relative bg-gradient-to-l from-rose-500 via-pink-500 to-rose-400 p-5 text-white">
          {/* Close button */}
          <button
            onClick={onClose}
            type="button"
            className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors focus:outline-none"
            aria-label="סגירת חלון"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Badges row */}
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-xs">
              יום {day.day_number}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-700/30 text-rose-100">
              {renderBadgeIcon(day.type)}
              <span>
                {day.type === 'letter' && 'מכתב אהבה'}
                {day.type === 'video' && 'ברכת וידאו'}
                {day.type === 'quiz' && 'חידון זוגי'}
                {day.type === 'coupon' && 'קופון פינוק'}
              </span>
            </span>
          </div>

          {/* Title */}
          <h2 id="modal-title" className="text-xl font-bold drop-shadow-xs leading-snug">
            {day.title}
          </h2>

          {/* Sender badge if exists */}
          {day.sender_name && (
            <div className="inline-flex items-center gap-1.5 mt-2 text-xs text-rose-100 font-medium">
              <span>נשלח בהמון אהבה ע״י:</span>
              <strong className="text-white underline underline-offset-2">{day.sender_name}</strong>
            </div>
          )}
        </div>

        {/* Modal Body: Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-stone-700">
          {/* Main Description Content */}
          <p className="text-sm leading-relaxed text-stone-600 whitespace-pre-line font-normal">
            {day.content}
          </p>

          {/* Dynamic Content: LETTER */}
          {day.type === 'letter' && (
            <div className="space-y-4">
              {day.media_url && (
                <div className="relative rounded-2xl overflow-hidden border border-rose-100 shadow-sm max-h-56">
                  <img
                    src={day.media_url}
                    alt={day.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900/40 via-transparent to-transparent pointer-events-none" />
                </div>
              )}

              {/* Romantic Letter Postcard styling */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 relative shadow-2xs font-serif italic text-stone-800 text-sm leading-relaxed">
                <div className="text-amber-400 text-3xl font-serif leading-none mb-1 select-none">
                  “
                </div>
                <div className="px-2">
                  רגע לפני שאנחנו הופכים לאחד, רציתי להזכיר לך כמה את אהובה, מוערכת ומיוחדת. תמיד
                  לצידך בטוב וברע.
                </div>
                <div className="text-right mt-3 font-sans not-italic text-xs text-rose-600 font-bold flex items-center gap-1 justify-end">
                  <span>באהבה גדולה,</span>
                  <span>{day.sender_name || 'תומר'}</span>
                  <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 inline" />
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Content: VIDEO */}
          {day.type === 'video' && (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border-2 border-rose-200 shadow-md">
                {day.media_url ? (
                  <video
                    controls
                    playsInline
                    className="w-full h-full object-cover"
                    poster="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80"
                  >
                    <source src={day.media_url} type="video/mp4" />
                    הדפדפן שלך אינו תומך בניגון וידאו זה.
                  </video>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 text-white text-center">
                    <Film className="w-10 h-10 text-rose-400 mb-2 animate-pulse" />
                    <p className="text-xs">סרטון הברכה בטעינה...</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-center text-stone-400">
                🎥 הקליקי על כפתור הניגון לצפייה בסרטון המרגש
              </p>
            </div>
          )}

          {/* Dynamic Content: QUIZ */}
          {day.type === 'quiz' && day.quiz_data && (
            <div className="space-y-4 pt-1">
              <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-100">
                <span className="block text-xs font-bold text-rose-600 mb-1">
                  שאלה לכלה:
                </span>
                <p className="text-sm font-semibold text-stone-800">
                  {day.quiz_data.question}
                </p>
              </div>

              {/* Options list */}
              <div className="space-y-2">
                {day.quiz_data.options.map((option, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === day.quiz_data?.correctIndex;
                  const hasAnswered = selectedOption !== null;

                  let buttonStyles =
                    'border-stone-200 hover:border-rose-300 hover:bg-rose-50/40 text-stone-700 bg-white';

                  if (hasAnswered) {
                    if (isCorrect) {
                      buttonStyles =
                        'border-emerald-500 bg-emerald-50/80 text-emerald-900 font-semibold shadow-xs';
                    } else if (isSelected && !isCorrect) {
                      buttonStyles =
                        'border-rose-400 bg-rose-50 text-rose-900 line-through opacity-80';
                    } else {
                      buttonStyles = 'border-stone-200 bg-stone-50 text-stone-400 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={hasAnswered}
                      onClick={() => handleOptionSelect(idx)}
                      className={`w-full text-right p-3 rounded-xl border text-xs sm:text-sm transition-all duration-200 flex items-center justify-between gap-3 ${buttonStyles} ${
                        !hasAnswered ? 'cursor-pointer active:scale-[0.99]' : 'cursor-default'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center text-xs font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <span>{option}</span>
                      </div>

                      {hasAnswered && isCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                      {hasAnswered && isSelected && !isCorrect && (
                        <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Groom's Note revealed after answering */}
              {selectedOption !== null && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 mb-1">
                    <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                    <span>הערה מהחתן:</span>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                    {day.quiz_data.groomNote}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Dynamic Content: COUPON */}
          {day.type === 'coupon' && (
            <div className="space-y-4 pt-1">
              {!isScratched ? (
                /* Scratch / Tap to Reveal Area */
                <div
                  onClick={handleScratchReveal}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') handleScratchReveal();
                  }}
                  className="shimmer-foil relative cursor-pointer rounded-2xl p-6 text-center border-2 border-dashed border-rose-300 shadow-md hover:scale-[1.01] active:scale-[0.98] transition-all select-none group"
                >
                  <div className="w-12 h-12 mx-auto rounded-full bg-white/80 shadow-xs flex items-center justify-center text-rose-500 mb-2 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-rose-700 mb-1">
                    ✨ לחצי כאן כדי לגרד ולחשוף את השובר! ✨
                  </h4>
                  <p className="text-xs text-rose-600/90 font-medium">
                    ממתין לך פינוק מיוחד ששמור רק לך
                  </p>
                </div>
              ) : (
                /* Revealed Coupon Box */
                <div className="relative rounded-2xl bg-gradient-to-br from-rose-50 via-white to-pink-50 p-5 border-2 border-rose-300 shadow-md animate-in zoom-in-95 duration-300">
                  {/* Decorative stamp watermark */}
                  <div className="absolute top-2 left-2 rotate-[-12deg] px-2 py-0.5 rounded border border-rose-300 text-[10px] font-extrabold text-rose-500 uppercase tracking-widest bg-white/70">
                    APPROVED VIP
                  </div>

                  <div className="text-center space-y-3">
                    <div className="w-10 h-10 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                      <Gift className="w-5 h-5" />
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block mb-1">
                        שובר מתנה רשמי לכלה
                      </span>
                      <h4 className="text-base font-extrabold text-stone-800">
                        {day.title}
                      </h4>
                    </div>

                    {day.coupon_code && (
                      <div className="flex items-center justify-center gap-2 pt-1">
                        <div className="bg-white px-3 py-1.5 rounded-lg border border-rose-200 font-mono text-sm font-bold text-rose-600 tracking-wider shadow-2xs">
                          {day.coupon_code}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(day.coupon_code!)}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
                          title="העתקת קוד השובר"
                        >
                          {copiedCode ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>הועתק!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>העתקי</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    <div className="pt-2 border-t border-rose-200/60 text-stone-500 text-[11px]">
                      ❤️ ניתן למימוש אצל החתן בכל עת, ללא הגבלת תוקף!
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-50/90 border-t border-stone-100 flex items-center justify-between">
          <div className="text-xs text-stone-400 font-medium">
            הפתעה נשמרת לצפייה חוזרת
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-bold transition-colors"
          >
            סגירה
          </button>
        </div>
      </div>
    </div>
  );
};
