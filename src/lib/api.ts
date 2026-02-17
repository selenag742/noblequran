import { SurahSummary, SurahDetail } from "./types";

const BASE_URL = "https://quranapi.pages.dev/api";

export async function fetchSurahList(): Promise<SurahSummary[]> {
  const res = await fetch(`${BASE_URL}/surah.json`);
  if (!res.ok) throw new Error("Failed to fetch surah list");
  return res.json();
}

export async function fetchSurah(surahNumber: number): Promise<SurahDetail> {
  const res = await fetch(`${BASE_URL}/${surahNumber}.json`);
  if (!res.ok) throw new Error(`Failed to fetch surah ${surahNumber}`);
  return res.json();
}
