import React, { useState, useMemo, useRef } from 'react';
import {
  Lock,
  Unlock,
  KeyRound,
  ArrowRight,
  PlusCircle,
  Clock,
  CalendarCheck2,
  AlertTriangle,
  FileText,
  Ticket,
  HelpCircle,
  Video,
  Trash2,
  Save,
  CheckCircle2,
  Eye,
  Sparkles,
  Search,
  X,
  UploadCloud,
} from 'lucide-react';
import type { CountdownDay, DayContentType, QuizData } from '../types/countdown';
import {
  ADMIN_PIN,
  calculateUnlockDate,
} from '../config/constants';

import {
  updateDayItem,
  deleteDayItem,
  createSubmission,
  uploadMediaFile,
} from '../lib/supabase';

interface AdminDashboardProps {
  days: CountdownDay[];
  onOpenDayModal: (day: CountdownDay) => void;
  onBackToBrideView: () => void;
  onRefreshData?: () => void;
}

const PIN_STORAGE_KEY = 'wedding_countdown_admin_authenticated';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  days,
  onOpenDayModal,
  onBackToBrideView,
  onRefreshData,
}) => {
  // Authentication state via sessionStorage
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(PIN_STORAGE_KEY) === 'true';
    }
    return false;
  });

  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Active tab: 'pending' (ממתינים לשיבוץ) or 'scheduled' (לוח הימים המשובץ)
  const [activeTab, setActiveTab] = useState<'pending' | 'scheduled'>('pending');

  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Editing items state: Map of id -> modified fields
  const [editingItems, setEditingItems] = useState<Record<number, Partial<CountdownDay>>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // New Content Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSender, setNewSender] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<DayContentType>('letter');
  const [newDayNumber, setNewDayNumber] = useState<number | ''>('');
  const [newUnlockDate, setNewUnlockDate] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [isMediaVideo, setIsMediaVideo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newQuizQuestion, setNewQuizQuestion] = useState('');
  const [newQuizOptions, setNewQuizOptions] = useState<string[]>(['', '', '', '']);
  const [newQuizCorrect, setNewQuizCorrect] = useState(0);
  const [newQuizGroomNote, setNewQuizGroomNote] = useState('');

  const showNotification = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Check PIN

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      showNotification('הקובץ שנבחר גדול מדי. אנא בחרו קובץ עד 50MB.');
      return;
    }

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

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === ADMIN_PIN) {
      setIsAuthenticated(true);
      sessionStorage.setItem(PIN_STORAGE_KEY, 'true');
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem(PIN_STORAGE_KEY);
  };

  // Group days into Scheduled vs Pending
  const { pendingDays, scheduledDays } = useMemo(() => {
    const pending: CountdownDay[] = [];
    const scheduled: CountdownDay[] = [];

    days.forEach((day) => {
      if (!day.is_approved || day.day_number === null || !day.unlock_date) {
        pending.push(day);
      } else {
        scheduled.push(day);
      }
    });

    // Sort scheduled by day_number ASC
    scheduled.sort((a, b) => (a.day_number || 0) - (b.day_number || 0));

    // Sort pending by id DESC (newest first)
    pending.sort((a, b) => b.id - a.id);

    return { pendingDays: pending, scheduledDays: scheduled };
  }, [days]);

  // Track conflicting day_numbers and unlock_dates among scheduled items
  const { duplicateDayNumbers, duplicateUnlockDates } = useMemo(() => {
    const dayCounts = new Map<number, number>();
    const dateCounts = new Map<string, number>();

    scheduledDays.forEach((d) => {
      if (d.day_number !== null) {
        dayCounts.set(d.day_number, (dayCounts.get(d.day_number) || 0) + 1);
      }
      if (d.unlock_date) {
        dateCounts.set(d.unlock_date, (dateCounts.get(d.unlock_date) || 0) + 1);
      }
    });

    const dupDays = new Set<number>();
    dayCounts.forEach((count, dNum) => {
      if (count > 1) dupDays.add(dNum);
    });

    const dupDates = new Set<string>();
    dateCounts.forEach((count, date) => {
      if (count > 1) dupDates.add(date);
    });

    return { duplicateDayNumbers: dupDays, duplicateUnlockDates: dupDates };
  }, [scheduledDays]);

  // Handle local edit changes
  const handleItemFieldChange = (
    id: number,
    field: keyof CountdownDay,
    value: any
  ) => {
    setEditingItems((prev) => {
      const current = prev[id] || {};
      const updated = { ...current, [field]: value };

      // Auto-date calculation if day_number changes
      if (field === 'day_number' && typeof value === 'number' && value >= 1 && value <= 29) {
        const autoDate = calculateUnlockDate(value);
        updated.unlock_date = autoDate;
      }

      return { ...prev, [id]: updated };
    });
  };

  // Save changes & approve
  const handleSaveAndApprove = async (day: CountdownDay) => {
    setSavingId(day.id);
    const edits = editingItems[day.id] || {};

    const dayNum =
      edits.day_number !== undefined ? edits.day_number : day.day_number;
    const unlockDate =
      edits.unlock_date !== undefined ? edits.unlock_date : day.unlock_date;

    const updates: Partial<CountdownDay> = {
      ...edits,
      day_number: dayNum,
      unlock_date: unlockDate,
      is_approved: true,
    };

    try {
      await updateDayItem(day.id, updates);
      showNotification(`יום ${dayNum || day.id} נשמר ואושר לפרסום! 🎉`);
      onRefreshData?.();
    } catch (err) {
      console.error(err);
      showNotification('שגיאה בשמירת הפריט.');
    } finally {
      setSavingId(null);
    }
  };

  // Demote to draft
  const handleDemoteToDraft = async (day: CountdownDay) => {
    setSavingId(day.id);
    try {
      await updateDayItem(day.id, { is_approved: false });
      showNotification(`הפריט הועבר לטיוטה בהצלחה.`);
      onRefreshData?.();
    } catch (err) {
      console.error(err);
      showNotification('שגיאה בעדכון הפריט.');
    } finally {
      setSavingId(null);
    }
  };

  // Delete item
  const handleDelete = async (id: number) => {
    if (!window.confirm('האם אתם בטוחים שברצונכם למחוק את הפריט הזה לצמיתות?')) {
      return;
    }
    setSavingId(id);
    try {
      await deleteDayItem(id);
      showNotification('הפריט נמחק בהצלחה.');
      onRefreshData?.();
    } catch (err) {
      console.error(err);
      showNotification('שגיאה במחיקת הפריט.');
    } finally {
      setSavingId(null);
    }
  };

  // Create new day item
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      alert('נא למלא כותרת ותוכן.');
      return;
    }

    setIsSubmitting(true);

    try {
      let uploadedUrl: string | undefined = undefined;

      if (mediaFile) {
        uploadedUrl = await uploadMediaFile(mediaFile);
      }

      let quizData: QuizData | undefined = undefined;
      if (newType === 'quiz' && newQuizQuestion.trim()) {
        quizData = {
          question: newQuizQuestion.trim(),
          options: newQuizOptions.map((o) => o.trim() || 'אפשרות'),
          correctIndex: newQuizCorrect,
          groomNote: newQuizGroomNote.trim() || 'כל הכבוד!',
        };
      }

      const payload: Partial<CountdownDay> = {
        title: newTitle.trim(),
        sender_name: newSender.trim() || 'החתן',
        content: newContent.trim(),
        type: newType,
        day_number: newDayNumber === '' ? null : Number(newDayNumber),
        unlock_date: newUnlockDate || (newDayNumber !== '' ? calculateUnlockDate(Number(newDayNumber)) : null),
        is_approved: newDayNumber !== '' && newUnlockDate !== '',
        media_url: uploadedUrl || newMediaUrl.trim() || undefined,
        coupon_code: newType === 'coupon' ? newCouponCode.trim() : undefined,
        quiz_data: quizData,
      };

      await createSubmission(payload);
      showNotification('הפריט החדש נוצר בהצלחה! ✨');
      setIsCreateModalOpen(false);
      // Reset form
      setNewTitle('');
      setNewSender('');
      setNewContent('');
      setNewType('letter');
      setNewDayNumber('');
      setNewUnlockDate('');
      setNewMediaUrl('');
      setNewCouponCode('');
      setNewQuizQuestion('');
      handleRemoveMedia();
      onRefreshData?.();
    } catch (err) {
      console.error(err);
      showNotification('שגיאה ביצירת הפריט.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Type Badge
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

  // ---------------- AUTHENTICATION SCREEN ----------------
  if (!isAuthenticated) {
    return (
      <div className="w-full min-h-[75vh] flex items-center justify-center p-4">
        <div className="glass-panel w-full max-w-sm rounded-3xl p-6 sm:p-7 text-center border border-rose-200/80 shadow-xl">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 to-rose-400 text-white flex items-center justify-center mb-3 shadow-sm">
            <Lock className="w-6 h-6" />
          </div>

          <h2 className="text-xl font-bold text-stone-800 mb-1">
            כניסת מנהל וחתן
          </h2>
          <p className="text-xs text-stone-500 mb-5 leading-relaxed">
            אזור זה מיועד לניהול ושיבוץ הברכות והתכנים. אנא הזינו את קוד ה-PIN.
          </p>

          <form onSubmit={handlePinSubmit} className="space-y-3.5">
            <div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  maxLength={10}
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError(false);
                  }}
                  placeholder="הזינו קוד PIN (ברירת מחדל: 1234)"
                  className={`w-full pr-10 pl-3 py-2.5 rounded-xl bg-white border text-center text-sm font-mono tracking-widest focus:outline-none transition-all ${
                    pinError
                      ? 'border-rose-400 ring-2 ring-rose-200'
                      : 'border-stone-200 focus:border-rose-400'
                  }`}
                  autoFocus
                />
              </div>
              {pinError && (
                <span className="block text-[11px] text-rose-500 font-bold mt-1.5">
                  קוד PIN שגוי. נסו שוב.
                </span>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              כניסה למערכת
            </button>

            <button
              type="button"
              onClick={onBackToBrideView}
              className="w-full py-2 text-stone-500 hover:text-stone-700 text-xs font-medium transition-colors cursor-pointer"
            >
              חזרה ללוח הספירה לאחור של הכלה
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Filter items in current tab
  const itemsToDisplay = (activeTab === 'pending' ? pendingDays : scheduledDays).filter(
    (item) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        (item.sender_name && item.sender_name.toLowerCase().includes(q)) ||
        item.content.toLowerCase().includes(q) ||
        (item.day_number && String(item.day_number).includes(q))
      );
    }
  );

  return (
    <div className="w-full pb-16">
      {/* Toast Notification */}
      {statusMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-stone-900/95 text-white text-xs px-4 py-2.5 rounded-full shadow-xl border border-stone-700 animate-in fade-in slide-in-from-bottom-2 duration-200 flex items-center gap-2 max-w-sm text-center">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Top Bar: Title & Back Button */}
      <div className="bg-stone-900 text-white p-3.5 rounded-2xl shadow-lg border border-stone-800 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-sm">
            🛠️
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">
              ניהול ושיבוץ תכנים
            </h1>
            <p className="text-[11px] text-stone-400">
              לוח בקרה לחתן ולמנהל
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLogout}
            title="התנתקות מפאנל מנהל"
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white text-xs transition-colors cursor-pointer"
          >
            <Unlock className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onBackToBrideView}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>חזרה לכלה</span>
          </button>
        </div>
      </div>

      {/* Top Stats Bar */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="glass-panel p-2.5 rounded-xl text-center border border-rose-100">
          <span className="block text-[11px] text-stone-500 font-medium">
            סך הכל פריטים
          </span>
          <span className="text-base sm:text-lg font-black text-stone-800">
            {days.length}
          </span>
        </div>

        <div className="glass-panel p-2.5 rounded-xl text-center border border-emerald-100 bg-emerald-50/30">
          <span className="block text-[11px] text-emerald-700 font-medium">
            משובצים בלוח
          </span>
          <span className="text-base sm:text-lg font-black text-emerald-700">
            {scheduledDays.length}
          </span>
        </div>

        <div className="glass-panel p-2.5 rounded-xl text-center border border-amber-100 bg-amber-50/30">
          <span className="block text-[11px] text-amber-700 font-medium">
            ממתינים לשיבוץ
          </span>
          <span className="text-base sm:text-lg font-black text-amber-700">
            {pendingDays.length}
          </span>
        </div>
      </div>

      {/* Add New Day / Content Button */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-98"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ הוספת יום / תוכן חדש ישירות למערכת</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="glass-panel p-1 rounded-xl mb-4 border border-rose-100 flex gap-1 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100/70'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>ממתינים לשיבוץ</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/30">
            {pendingDays.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('scheduled')}
          className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'scheduled'
              ? 'bg-rose-500 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100/70'
          }`}
        >
          <CalendarCheck2 className="w-3.5 h-3.5" />
          <span>לוח הימים המשובץ</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/30">
            {scheduledDays.length}
          </span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-3.5">
        <Search className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="חיפוש לפי כותרת, שם שולח, תוכן או מספר יום..."
          className="w-full pr-8 pl-3 py-2 bg-white rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-rose-400"
        />
      </div>

      {/* Cards List */}
      <div className="space-y-3.5">
        {itemsToDisplay.map((day) => {
          const edits = editingItems[day.id] || {};
          const currentDayNum =
            edits.day_number !== undefined ? edits.day_number : day.day_number;
          const currentUnlockDate =
            edits.unlock_date !== undefined ? edits.unlock_date : day.unlock_date;
          const currentTitle =
            edits.title !== undefined ? edits.title : day.title;
          const currentSender =
            edits.sender_name !== undefined ? edits.sender_name : day.sender_name;
          const currentContent =
            edits.content !== undefined ? edits.content : day.content;
          const currentType = edits.type !== undefined ? edits.type : day.type;

          const isDayDuplicate =
            currentDayNum !== null && duplicateDayNumbers.has(currentDayNum);
          const isDateDuplicate =
            currentUnlockDate !== null &&
            duplicateUnlockDates.has(currentUnlockDate);
          const isSaving = savingId === day.id;

          return (
            <div
              key={day.id}
              className={`rounded-2xl p-4 transition-all shadow-xs border ${
                activeTab === 'pending'
                  ? 'bg-amber-50/40 border-amber-200/80 hover:border-amber-300'
                  : 'bg-white border-rose-200/80 hover:border-rose-300'
              }`}
            >
              {/* Conflict Warnings */}
              {(isDayDuplicate || isDateDuplicate) && (
                <div className="mb-2.5 p-2 rounded-xl bg-amber-100/90 border border-amber-300 text-amber-900 text-[11px] font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>
                    שים לב: {isDayDuplicate ? `יום ${currentDayNum}` : ''}{' '}
                    {isDateDuplicate ? `תאריך ${currentUnlockDate}` : ''} כבר
                    משובץ לפריט נוסף במערכת!
                  </span>
                </div>
              )}

              {/* Card Header Row */}
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-6 h-6 rounded-lg bg-stone-100 flex items-center justify-center">
                    {renderTypeIcon(currentType)}
                  </span>
                  <span className="text-[11px] font-bold text-stone-500 uppercase">
                    {currentType === 'letter' && 'מכתב'}
                    {currentType === 'video' && 'וידאו'}
                    {currentType === 'quiz' && 'חידון'}
                    {currentType === 'coupon' && 'קופון'}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {/* Status Badge */}
                  {day.is_approved ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>מאושר</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      <Clock className="w-3 h-3" />
                      <span>ממתין לשיבוץ</span>
                    </span>
                  )}

                  {/* Preview Modal Button */}
                  <button
                    type="button"
                    onClick={() => onOpenDayModal({ ...day, ...edits })}
                    title="תצוגה מקדימה כפי שהכלה תראה"
                    className="p-1 rounded-lg hover:bg-stone-100 text-stone-500 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Media Preview if attached */}
              {day.media_url && (
                <div className="mb-2.5 rounded-xl overflow-hidden border border-stone-200 bg-black/5 max-h-36 flex items-center justify-center">
                  {currentType === 'video' ? (
                    <video
                      src={day.media_url}
                      controls
                      playsInline
                      className="max-h-36 w-full object-contain bg-black"
                    />
                  ) : (
                    <img
                      src={day.media_url}
                      alt={currentTitle}
                      className="max-h-36 w-full object-contain bg-black"
                    />
                  )}
                </div>
              )}

              {/* Editable Fields Grid */}
              <div className="space-y-2 text-xs">
                {/* Title & Sender */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 mb-0.5">
                      כותרת הפריט
                    </label>
                    <input
                      type="text"
                      value={currentTitle}
                      onChange={(e) =>
                        handleItemFieldChange(day.id, 'title', e.target.value)
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-stone-200 text-xs focus:outline-none focus:border-rose-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 mb-0.5">
                      שם השולח
                    </label>
                    <input
                      type="text"
                      value={currentSender || ''}
                      onChange={(e) =>
                        handleItemFieldChange(day.id, 'sender_name', e.target.value)
                      }
                      placeholder="החתן / אמא / חברות"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-stone-200 text-xs focus:outline-none focus:border-rose-400"
                    />
                  </div>
                </div>

                {/* Scheduling: Day Number & Unlock Date */}
                <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-white/70 border border-stone-200/70">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-600 mb-0.5">
                      מספר יום בלוח (1-29)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={currentDayNum ?? ''}
                      onChange={(e) => {
                        const val =
                          e.target.value === '' ? null : Number(e.target.value);
                        handleItemFieldChange(day.id, 'day_number', val);
                      }}
                      placeholder="לא משובץ"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-stone-200 text-xs font-bold text-rose-600 focus:outline-none focus:border-rose-400"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[10px] font-bold text-stone-600">
                        תאריך פתיחה
                      </label>
                      {currentDayNum && (
                        <button
                          type="button"
                          onClick={() => {
                            const autoDate = calculateUnlockDate(currentDayNum);
                            handleItemFieldChange(day.id, 'unlock_date', autoDate);
                          }}
                          className="text-[9px] text-rose-500 hover:underline font-semibold cursor-pointer"
                        >
                          חישוב אוטומטי
                        </button>
                      )}
                    </div>
                    <input
                      type="date"
                      value={currentUnlockDate ?? ''}
                      onChange={(e) =>
                        handleItemFieldChange(
                          day.id,
                          'unlock_date',
                          e.target.value || null
                        )
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-stone-200 text-xs focus:outline-none focus:border-rose-400"
                    />
                  </div>
                </div>

                {/* Content Textarea */}
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 mb-0.5">
                    תוכן הברכה / הטקסט
                  </label>
                  <textarea
                    rows={2}
                    value={currentContent}
                    onChange={(e) =>
                      handleItemFieldChange(day.id, 'content', e.target.value)
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-stone-200 text-xs focus:outline-none focus:border-rose-400 resize-y"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-3 pt-2.5 border-t border-stone-200/60 flex items-center justify-between gap-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleDelete(day.id)}
                  className="px-2.5 py-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>מחק</span>
                </button>

                <div className="flex items-center gap-2">
                  {day.is_approved && (
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleDemoteToDraft(day)}
                      className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      העבר לטיוטה
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleSaveAndApprove(day)}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs hover:shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>שמור ואשר פרסום</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {itemsToDisplay.length === 0 && (
          <div className="text-center py-10 text-stone-400 text-xs glass-panel rounded-2xl">
            לא נמצאו פריטים בלשונית זו.
          </div>
        )}
      </div>

      {/* ---------------- CREATE NEW CONTENT MODAL ---------------- */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden border border-rose-100 flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-l from-rose-500 to-pink-500 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4" />
                <span>הוספת תוכן / יום חדש</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleCreateSubmit} className="p-4 overflow-y-auto space-y-3 text-xs">
              {/* Type selector */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  סוג התוכן
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['letter', 'coupon', 'quiz', 'video'] as DayContentType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewType(t)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                        newType === t
                          ? 'bg-rose-500 text-white border-rose-500 shadow-2xs'
                          : 'bg-white text-stone-600 border-stone-200 hover:bg-rose-50'
                      }`}
                    >
                      {renderTypeIcon(t)}
                      <span>
                        {t === 'letter' && 'מכתב'}
                        {t === 'coupon' && 'קופון'}
                        {t === 'quiz' && 'חידון'}
                        {t === 'video' && 'וידאו'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Sender */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-stone-700 mb-0.5">
                    כותרת הפריט *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="למשל: מכתב אהבה סודי"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 focus:outline-none focus:border-rose-400"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-0.5">
                    שם השולח
                  </label>
                  <input
                    type="text"
                    value={newSender}
                    onChange={(e) => setNewSender(e.target.value)}
                    placeholder="החתן תומר"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 focus:outline-none focus:border-rose-400"
                  />
                </div>
              </div>

              {/* Scheduling: Day Number & Date */}
              <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-rose-50/50 border border-rose-100">
                <div>
                  <label className="block font-bold text-stone-700 mb-0.5">
                    יום בלוח (1-29)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={newDayNumber}
                    onChange={(e) => {
                      const v = e.target.value === '' ? '' : Number(e.target.value);
                      setNewDayNumber(v);
                      if (typeof v === 'number' && v >= 1 && v <= 29) {
                        setNewUnlockDate(calculateUnlockDate(v));
                      }
                    }}
                    placeholder="אופציונלי"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white focus:outline-none focus:border-rose-400 font-bold text-rose-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-0.5">
                    תאריך פתיחה
                  </label>
                  <input
                    type="date"
                    value={newUnlockDate}
                    onChange={(e) => setNewUnlockDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white focus:outline-none focus:border-rose-400"
                  />
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block font-bold text-stone-700 mb-0.5">
                  תוכן הברכה / ההודעה *
                </label>
                <textarea
                  required
                  rows={3}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="כתבו כאן את התוכן שיופיע בכרטיס..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 focus:outline-none focus:border-rose-400 resize-y"
                />
              </div>

              {/* Media Upload */}
              {(newType === 'letter' || newType === 'video') && (
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
                            className="max-h-48 w-full object-contain bg-black"
                          />
                        ) : (
                          <img
                            src={mediaPreviewUrl}
                            alt="Preview"
                            className="max-h-48 w-full object-contain bg-black"
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Coupon fields */}
              {newType === 'coupon' && (
                <div>
                  <label className="block font-bold text-stone-700 mb-0.5">
                    קוד קופון / שובר
                  </label>
                  <input
                    type="text"
                    value={newCouponCode}
                    onChange={(e) => setNewCouponCode(e.target.value)}
                    placeholder="למשל: SPA-MASSAGE-VIP"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 focus:outline-none focus:border-rose-400 font-mono"
                  />
                </div>
              )}

              {/* Quiz fields */}
              {newType === 'quiz' && (
                <div className="space-y-2 p-2.5 rounded-xl bg-indigo-50/50 border border-indigo-100">
                  <div>
                    <label className="block font-bold text-indigo-900 mb-0.5">
                      שאלת החידון
                    </label>
                    <input
                      type="text"
                      value={newQuizQuestion}
                      onChange={(e) => setNewQuizQuestion(e.target.value)}
                      placeholder="למשל: איפה הייתה הנשיקה הראשונה?"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-bold text-indigo-900">
                      4 אפשרויות תשובה (סמנו את הנכונה)
                    </label>
                    {newQuizOptions.map((opt, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <input
                          type="radio"
                          name="quizCorrect"
                          checked={newQuizCorrect === i}
                          onChange={() => setNewQuizCorrect(i)}
                          className="accent-indigo-600"
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const updated = [...newQuizOptions];
                            updated[i] = e.target.value;
                            setNewQuizOptions(updated);
                          }}
                          placeholder={`אפשרות ${i + 1}`}
                          className="flex-1 px-2 py-1 rounded-lg border border-indigo-200 bg-white text-xs"
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block font-bold text-indigo-900 mb-0.5">
                      הערת החתן (נחשפת לאחר המענה)
                    </label>
                    <input
                      type="text"
                      value={newQuizGroomNote}
                      onChange={(e) => setNewQuizGroomNote(e.target.value)}
                      placeholder="בדיוק! שרפנו את הפיצה..."
                      className="w-full px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      שומר...
                    </>
                  ) : (
                    'שמירת הפריט במערכת'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
