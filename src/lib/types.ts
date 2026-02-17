export interface SurahSummary {
  surahName: string;
  surahNameArabic: string;
  surahNameArabicLong: string;
  surahNameTranslation: string;
  revelationPlace: string;
  totalAyah: number;
}

export interface SurahDetail {
  surahName: string;
  surahNameArabic: string;
  surahNameArabicLong: string;
  surahNameTranslation: string;
  revelationPlace: string;
  totalAyah: number;
  surahNo: number;
  audio: Record<string, { reciter: string; url: string; originalUrl: string }>;
  english: string[];
  arabic1: string[];
  arabic2: string[];
}
