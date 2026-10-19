import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Heart,
  UploadCloud,
  CheckCircle2,
  X,
  FileVideo,
  FileImage,
  Loader2,
  ArrowRight,
  Send,
  PlusCircle,
} from 'lucide-react';

import { BRIDE_NAME, GROOM_NAME } from '../config/constants';
import { createSubmission, uploadMediaFile } from '../lib/supabase';
import type { DayContentType } from '../types/countdown';

interface SubmitGreetingProps {
  onBackToCountdown?: () => void;
}

export const SubmitGreeting: React.FC<SubmitGreetingProps> = ({
  onBackToCountdown,
}) => {
  const [senderName, setSenderName] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // Media upload state
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [isMediaVideo, setIsMediaVideo] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle media selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (e.g. 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage('הקובץ שנבחר גדול מדי. אנא בחרו קובץ עד 50MB.');
      return;
    }

    setErrorMessage(null);
    setMediaFile(file);

    const isVideo = file.type.startsWith('video/');
    setIsMediaVideo(isVideo);

    const previewUrl = URL.createObjectURL(file);
    setMediaPreviewUrl(previewUrl);
  };

  const handleRemoveMedia = () => {
    if (mediaPreviewUrl) {
      URL.revokeObjectURL(mediaPreviewUrl);
    }
    setMediaFile(null);
    setMediaPreviewUrl(null);
    setIsMediaVideo(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Submit greeting
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!senderName.trim()) {
      setErrorMessage('נא למלא ממי הברכה');
      return;
    }

    if (!content.trim()) {
      setErrorMessage('נא לכתוב ברכה או זיכרון');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      let uploadedUrl: string | undefined = undefined;

      // 1. Upload media if present
      if (mediaFile) {
        uploadedUrl = await uploadMediaFile(mediaFile);
      }

      // Determine content type: 'video' if video file, otherwise 'letter'
      const contentType: DayContentType = isMediaVideo ? 'video' : 'letter';

      // Fallback title if left blank
      const finalTitle = title.trim()
        ? title.trim()
        : `הפתעה מ-${senderName.trim()}`;

      // 2. Create submission (is_approved: false by default)
      await createSubmission({
        sender_name: senderName.trim(),
        title: finalTitle,
        content: content.trim(),
        type: contentType,
        media_url: uploadedUrl,
        is_approved: false,
        day_number: null,
        unlock_date: null,
      });

      // 3. Trigger celebration confetti & show success screen
      try {
        confetti({
          particleCount: 110,
          spread: 80,
          origin: { y: 0.55 },
          colors: ['#f43f5e', '#fb7185', '#fda4af', '#f59e0b', '#fbbf24'],
        });
      } catch (cErr) {
        console.warn('Confetti error:', cErr);
      }

      setSubmitSuccess(true);
    } catch (err) {
      console.error('Submission failed:', err);
      setErrorMessage('חלה שגיאה בעת שמירת הברכה. אנא נסו שוב.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form to submit another greeting
  const handleResetForAnother = () => {
    handleRemoveMedia();
    setSenderName('');
    setTitle('');
    setContent('');
    setSubmitSuccess(false);
    setErrorMessage(null);
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen text-stone-800 bg-rose-50/60 pb-12 pt-4 px-3 sm:px-4"
    >
      {/* Background ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-rose-200/30 blur-3xl animate-float" />
        <div className="absolute top-1/2 -left-32 w-96 h-96 rounded-full bg-pink-200/25 blur-3xl" />
      </div>

      <main className="relative z-10 max-w-md mx-auto">
        {/* Navigation link back to board */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={onBackToCountdown}
            className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-rose-600 transition-colors font-medium bg-white/80 px-3 py-1.5 rounded-full border border-stone-200/60 shadow-2xs cursor-pointer"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>ללוח הספירה לאחור</span>
          </button>

          <span className="text-[11px] font-semibold text-rose-600 bg-rose-100/90 px-2.5 py-1 rounded-full border border-rose-200/60">
            פורטל אורחים ✨
          </span>
        </div>

        {/* Success / Thank You Screen */}
        {submitSuccess ? (
          <div className="glass-panel rounded-3xl p-6 sm:p-8 text-center shadow-md border border-rose-100 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 shadow-xs">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-stone-800 mb-2">
              איזה כיף! הברכה נשלחה בהצלחה 🎉
            </h2>

            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-6">
              תודה רבה שהתרגשתם איתנו! הברכה שלכם תישמר ותשובץ באחד מימי הספירה
              לאחור המיוחדים לקראת החופה של {BRIDE_NAME} ו-{GROOM_NAME}.
            </p>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleResetForAnother}
                className="w-full py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <PlusCircle className="w-4 h-4" />
                <span>שליחת ברכה או הפתעה נוספת</span>
              </button>

              <button
                type="button"
                onClick={onBackToCountdown}
                className="w-full py-2.5 rounded-2xl bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold border border-stone-200 transition-colors cursor-pointer"
              >
                מעבר ללוח החתונה של הכלה
              </button>
            </div>
          </div>
        ) : (
          /* Submission Form */
          <div className="glass-panel rounded-3xl p-5 sm:p-6 shadow-md border border-rose-100">
            {/* Header */}
            <div className="text-center mb-5">
              <div className="inline-flex items-center gap-1 text-rose-500 mb-1">
                <Heart className="w-4 h-4 fill-rose-500" />
                <span className="text-xs font-bold">
                  המסע לחתונה של {BRIDE_NAME} & {GROOM_NAME}
                </span>
                <Heart className="w-4 h-4 fill-rose-500" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-stone-800 tracking-tight">
                שליחת הפתעה וברכה לכלה
              </h1>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                כתבו ברכה מרגשת, זיכרון משותף או צרפו תמונה/סרטון. הברכה תשובץ
                בהפתעה באחד הימים עד החופה! ✨
              </p>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center font-medium">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
              {/* Field 1: Sender Name */}
              <div>
                <label
                  htmlFor="sender_name"
                  className="block font-bold text-stone-700 mb-1"
                >
                  ממי הברכה? <span className="text-rose-500">*</span>
                </label>
                <input
                  id="sender_name"
                  type="text"
                  required
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="למשל: אמא / שירה ודנה / החברים מהצבא"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-xs sm:text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
                />
              </div>

              {/* Field 2: Title (Optional) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="title" className="font-bold text-stone-700">
                    כותרת קצרה
                  </label>
                  <span className="text-[11px] text-stone-400">אופציונלי</span>
                </div>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    senderName ? `הפתעה מ-${senderName}` : 'למשל: חיבוק ענק מהצפון'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-xs sm:text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
                />
              </div>

              {/* Field 3: Content */}
              <div>
                <label
                  htmlFor="content"
                  className="block font-bold text-stone-700 mb-1"
                >
                  הברכה או הזיכרון שלכם <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="content"
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="כתבו כאן את כל מה שבלב... סיפור מצחיק, מילים חמות או איחולים לשנים מאושרות יחד."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-xs sm:text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all resize-y"
                />
              </div>

              {/* Field 4: Media Upload */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-stone-700">
                    הוספת תמונה או סרטון
                  </label>
                  <span className="text-[11px] text-stone-400">אופציונלי</span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="media-file-input"
                />

                {!mediaPreviewUrl ? (
                  /* Custom Dropzone */
                  <label
                    htmlFor="media-file-input"
                    className="border-2 border-dashed border-rose-200 hover:border-rose-400 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-white/60 hover:bg-rose-50/50 transition-colors text-center"
                  >
                    <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-stone-700 text-xs">
                      לחצו כאן להעלאת תמונה או סרטון
                    </span>
                    <span className="text-[11px] text-stone-400">
                      תומך בתמונות (JPG, PNG) וסרטוני וידאו (MP4) עד 50MB
                    </span>
                  </label>
                ) : (
                  /* Preview Card */
                  <div className="relative rounded-2xl overflow-hidden border border-rose-200 bg-black/5 p-2 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleRemoveMedia}
                      className="absolute top-3 left-3 z-10 w-7 h-7 rounded-full bg-stone-900/80 hover:bg-stone-900 text-white flex items-center justify-center transition-colors shadow-sm"
                      title="הסרת קובץ"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="max-h-48 rounded-xl overflow-hidden flex items-center justify-center bg-black/80">
                      {isMediaVideo ? (
                        <video
                          src={mediaPreviewUrl}
                          controls
                          playsInline
                          className="max-h-48 w-full object-contain"
                        />
                      ) : (
                        <img
                          src={mediaPreviewUrl}
                          alt="תצוגה מקדימה"
                          className="max-h-48 w-full object-cover"
                        />
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-stone-600 px-1">
                      {isMediaVideo ? (
                        <FileVideo className="w-3.5 h-3.5 text-purple-600" />
                      ) : (
                        <FileImage className="w-3.5 h-3.5 text-rose-600" />
                      )}
                      <span className="truncate max-w-[220px]">
                        {mediaFile?.name}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>מעלה קובץ ושומר ברכה...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>שליחת הברכה לכלה ✨</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};
