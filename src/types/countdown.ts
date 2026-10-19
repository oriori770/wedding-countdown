export type DayContentType = 'letter' | 'video' | 'quiz' | 'coupon';

export interface QuizData {
  question: string;
  options: string[];
  correctIndex: number;
  groomNote: string; // Revealed after answering
}

export interface CountdownDay {
  id: number;
  day_number: number | null;
  unlock_date: string | null; // ISO Date format: 'YYYY-MM-DD'
  is_approved?: boolean;
  created_at?: string;
  hebrew_date?: string; // e.g., "א' כסלו", "כ״ט כסלו"
  civil_date?: string; // e.g., "11.11", "09.12"
  day_of_week?: string; // e.g., "יום רביעי", "שבת"
  title: string;
  type: DayContentType;
  content: string;
  sender_name?: string; // e.g., "דוד", "אמא", "חברות מהלימודים"
  media_url?: string; // Optional image or video URL
  quiz_data?: QuizData; // Required if type === 'quiz'
  coupon_code?: string; // Optional text shown inside a scratch/reveal box if type === 'coupon'
}
