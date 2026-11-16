import { GROOM_NAME, getDayMetadata } from '../config/constants';
import type { CountdownDay } from '../types/countdown';

/**
 * Removes leading and trailing emojis or symbols from a sender name
 * to allow natural and grammatically sound sentence embedding in Hebrew.
 * Example: "אמא האוהבת 🌸" -> "אמא האוהבת"
 */
export function cleanSenderDisplayName(senderName?: string): string {
  if (!senderName) return '';
  const cleaned = senderName
    .replace(
      /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu,
      ''
    )
    .trim();
  return cleaned || senderName.trim();
}

/**
 * Checks whether the given sender string refers to the groom.
 */
export function isGroomSender(senderName?: string): boolean {
  if (!senderName) return false;
  const lower = senderName.trim().toLowerCase();
  if (lower.includes('חתן')) return true;
  if (GROOM_NAME && lower.includes(GROOM_NAME.toLowerCase())) return true;
  return false;
}

/**
 * Returns dynamic and natural Hebrew redemption text for a gift / coupon.
 * - If from the groom: "❤️ ניתן למימוש אצל החתן בכל עת, ללא הגבלת תוקף!"
 * - If from someone else: "❤️ ניתן למימוש אצל [שם השולח] בכל עת, ללא הגבלת תוקף!"
 * - If no sender is specified: "❤️ ניתן למימוש בכל עת, ללא הגבלת תוקף!"
 */
export function getCouponRedemptionText(senderName?: string): string {
  if (!senderName || !senderName.trim()) {
    return '❤️ ניתן למימוש בכל עת, ללא הגבלת תוקף!';
  }

  const trimmed = senderName.trim();

  // If the sender is the groom
  if (isGroomSender(trimmed)) {
    return '❤️ ניתן למימוש אצל החתן בכל עת, ללא הגבלת תוקף!';
  }

  const cleanName = cleanSenderDisplayName(trimmed);

  // If name already starts with preposition "אצל"
  if (cleanName.startsWith('אצל ')) {
    return `❤️ ניתן למימוש ${cleanName} בכל עת, ללא הגבלת תוקף!`;
  }

  return `❤️ ניתן למימוש אצל ${cleanName} בכל עת, ללא הגבלת תוקף!`;
}

/**
 * Returns a dynamic label for the note revealed after answering a quiz.
 * - Groom: "הערה מהחתן:"
 * - Someone else: "הערה מ-[שם השולח]:"
 */
export function getQuizNoteLabel(senderName?: string): string {
  if (!senderName || !senderName.trim()) {
    return 'הערה מהחתן:';
  }

  const trimmed = senderName.trim();
  if (isGroomSender(trimmed)) {
    return 'הערה מהחתן:';
  }

  const cleanName = cleanSenderDisplayName(trimmed);
  return `הערה מ-${cleanName}:`;
}

/**
 * Checks if a specific day is unlocked according to its unlock_date
 * compared to today's date (at 00:00:00).
 */
export function isDayUnlocked(day: CountdownDay, isPreviewMode: boolean = false): boolean {
  if (isPreviewMode) return true;
  if (!day.unlock_date) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, month, dayNum] = day.unlock_date.split('-').map(Number);
  const unlockDate = new Date(year, month - 1, dayNum, 0, 0, 0, 0);

  return today.getTime() >= unlockDate.getTime();
}

/**
 * Constructs the full list of 30 days of the countdown (0-29),
 * merging available database days with calculated metadata defaults.
 */
export function getAllCalendarDays(days: CountdownDay[]): CountdownDay[] {
  return Array.from({ length: 30 }).map((_, index) => {
    const dayNumber = index;
    const existingDay = days.find((d) => d.day_number === dayNumber);
    const metadata = getDayMetadata(dayNumber);

    return (
      existingDay || {
        id: -(dayNumber + 1),
        day_number: dayNumber,
        title: 'נעול',
        type: 'letter',
        content: '',
        unlock_date: metadata.unlock_date,
        hebrew_date: metadata.hebrew_date || '',
        civil_date: metadata.civil_date || '',
        day_of_week: metadata.day_of_week || '',
      }
    );
  });
}

/**
 * Returns all unlocked days that haven't been opened/viewed yet.
 */
export function getAllUnopenedUnlockedDays(
  days: CountdownDay[],
  openedDayIds: number[],
  isPreviewMode: boolean = false
): CountdownDay[] {
  const allDays = getAllCalendarDays(days);
  return allDays.filter(
    (day) => isDayUnlocked(day, isPreviewMode) && !openedDayIds.includes(day.id)
  );
}

/**
 * Returns the latest (newest) unlocked day that hasn't been viewed yet.
 * If today has an unviewed day, or if earlier days are pending, returns the most relevant day.
 */
export function getLatestUnopenedUnlockedDay(
  days: CountdownDay[],
  openedDayIds: number[],
  isPreviewMode: boolean = false
): CountdownDay | null {
  const unopened = getAllUnopenedUnlockedDays(days, openedDayIds, isPreviewMode);
  if (unopened.length === 0) return null;
  // Pick the newest unlocked day among the unopened ones
  return unopened[unopened.length - 1];
}
