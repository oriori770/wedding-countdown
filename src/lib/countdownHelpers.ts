import { GROOM_NAME } from '../config/constants';

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
