import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Pause, SkipForward, Volume2 } from "lucide-react";
import { fetchSurah } from "@/lib/api";
import { SurahDetail } from "@/lib/types";

const SurahReader = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const surahNo = parseInt(id || "1");

  const [surah, setSurah] = useState<SurahDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [playingVerse, setPlayingVerse] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const [selectedReciter, setSelectedReciter] = useState("1");

  const audioRef = useRef<HTMLAudioElement>(null);
  const verseRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => {
    setLoading(true);
    setSurah(null);
    setPlayingVerse(null);
    setIsPlaying(false);
    fetchSurah(surahNo)
      .then((data) => {
        setSurah(data);
        localStorage.setItem("lastSurah", String(surahNo));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [surahNo]);

  const scrollToVerse = useCallback((index: number) => {
    const el = verseRefs.current.get(index);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  const playChapterAudio = useCallback(() => {
    if (!surah || !audioRef.current) return;
    const reciterAudio = surah.audio[selectedReciter];
    if (!reciterAudio) return;
    audioRef.current.src = reciterAudio.url;
    audioRef.current.play();
    setIsPlaying(true);
    setPlayingVerse(0);
    scrollToVerse(0);
  }, [surah, selectedReciter, scrollToVerse]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else if (playingVerse !== null) {
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      playChapterAudio();
    }
  }, [isPlaying, playingVerse, playChapterAudio]);

  const handleAudioEnded = useCallback(() => {
    setIsPlaying(false);
    setPlayingVerse(null);
  }, []);

  // Simulate verse tracking during audio playback
  useEffect(() => {
    if (!isPlaying || !surah || playingVerse === null) return;
    const totalVerses = surah.totalAyah;
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (audio.duration && audio.duration > 0) {
        const progress = audio.currentTime / audio.duration;
        const estimatedVerse = Math.min(
          Math.floor(progress * totalVerses),
          totalVerses - 1
        );
        if (estimatedVerse !== playingVerse) {
          setPlayingVerse(estimatedVerse);
          scrollToVerse(estimatedVerse);
        }
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    return () => audio.removeEventListener("timeupdate", handleTimeUpdate);
  }, [isPlaying, surah, playingVerse, scrollToVerse]);

  const reciters = surah ? Object.entries(surah.audio).map(([key, val]) => ({
    id: key,
    name: val.reciter,
  })) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!surah) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Surah not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <header className="bg-primary text-primary-foreground sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => navigate("/")}
              className="p-2 rounded-lg hover:bg-primary-foreground/10 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="font-display text-xl font-bold truncate">
                  {surah.surahName}
                </h1>
                <span className="font-arabic text-xl opacity-90">
                  {surah.surahNameArabic}
                </span>
              </div>
              <p className="text-primary-foreground/60 text-xs mt-0.5">
                {surah.surahNameTranslation} · {surah.revelationPlace} · {surah.totalAyah} Ayahs
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Bismillah */}
      {surahNo !== 1 && surahNo !== 9 && (
        <div className="text-center py-8">
          <p className="font-arabic text-3xl text-primary">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</p>
          <p className="text-muted-foreground text-sm mt-2">In the name of Allah, the Most Compassionate, Most Merciful</p>
        </div>
      )}

      {/* Verses */}
      <main className="container mx-auto px-4 py-4 space-y-3">
        {surah.arabic1.map((arabic, i) => (
          <div
            key={i}
            ref={(el) => { if (el) verseRefs.current.set(i, el); }}
            className={`rounded-lg border border-border p-4 md:p-6 transition-all duration-300 ${
              playingVerse === i ? "verse-playing" : "bg-card"
            }`}
          >
            {/* Verse number */}
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-semibold text-primary">{i + 1}</span>
              </div>
              {playingVerse === i && isPlaying && (
                <div className="flex items-center gap-1 text-accent">
                  <Volume2 className="h-4 w-4 animate-pulse-glow" />
                  <span className="text-xs font-medium">Playing</span>
                </div>
              )}
            </div>

            {/* Arabic */}
            <p className="font-arabic text-2xl md:text-3xl leading-loose text-right text-foreground mb-4" dir="rtl">
              {arabic}
            </p>

            {/* English */}
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              {surah.english[i]}
            </p>
          </div>
        ))}
      </main>

      {/* Audio Player Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border backdrop-blur-lg bg-opacity-95 z-20 shadow-lg">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {surah.surahName} - {reciters.find(r => r.id === selectedReciter)?.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {playingVerse !== null ? `Ayah ${playingVerse + 1} of ${surah.totalAyah}` : "Tap play to listen"}
            </p>
          </div>

          <select
            value={selectedReciter}
            onChange={(e) => {
              setSelectedReciter(e.target.value);
              setIsPlaying(false);
              setPlayingVerse(null);
            }}
            className="text-xs bg-secondary text-secondary-foreground border border-border rounded-md px-2 py-1.5 max-w-[140px]"
          >
            {reciters.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      </div>

      <audio ref={audioRef} onEnded={handleAudioEnded} preload="none" />

      {/* Navigation */}
      <div className="container mx-auto px-4 py-4 flex justify-between mb-20">
        {surahNo > 1 && (
          <button
            onClick={() => navigate(`/surah/${surahNo - 1}`)}
            className="text-sm text-primary hover:underline"
          >
            ← Previous Surah
          </button>
        )}
        <div />
        {surahNo < 114 && (
          <button
            onClick={() => navigate(`/surah/${surahNo + 1}`)}
            className="text-sm text-primary hover:underline"
          >
            Next Surah →
          </button>
        )}
      </div>
    </div>
  );
};

export default SurahReader;
