import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat, Download } from "lucide-react";
import { fetchSurah } from "@/lib/api";
import { SurahDetail } from "@/lib/types";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formatTime = (s: number) => {
  if (!s || !isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const SurahReader = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const surahNo = parseInt(id || "1");

  const [surah, setSurah] = useState<SurahDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [playingVerse, setPlayingVerse] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedReciter, setSelectedReciter] = useState("1");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [showTranslations, setShowTranslations] = useState({ english: true, urdu: true });

  const audioRef = useRef<HTMLAudioElement>(null);
  const verseRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => {
    setLoading(true);
    setSurah(null);
    setPlayingVerse(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    fetchSurah(surahNo)
      .then((data) => {
        setSurah(data);
        localStorage.setItem("lastSurah", String(surahNo));
        document.title = `${data.surahName} (${data.surahNameArabic}) — The Noble Quran`;
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
    } else if (playingVerse !== null && audioRef.current.src) {
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      playChapterAudio();
    }
  }, [isPlaying, playingVerse, playChapterAudio]);

  const handleAudioEnded = useCallback(() => {
    if (repeat && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setPlayingVerse(0);
      scrollToVerse(0);
    } else {
      setIsPlaying(false);
      setPlayingVerse(null);
    }
  }, [repeat, scrollToVerse]);

  const handleSeek = useCallback((value: number[]) => {
    if (audioRef.current && isFinite(value[0])) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  }, []);

  const skipForward = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, duration);
    }
  }, [duration]);

  const skipBack = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
    }
  }, []);

  // Time/verse tracking
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (surah && audio.duration > 0) {
        const progress = audio.currentTime / audio.duration;
        const estimated = Math.min(Math.floor(progress * surah.totalAyah), surah.totalAyah - 1);
        setPlayingVerse((prev) => {
          if (prev !== estimated) {
            scrollToVerse(estimated);
            return estimated;
          }
          return prev;
        });
      }
    };

    const onLoadedMetadata = () => setDuration(audio.duration);
    const onDurationChange = () => setDuration(audio.duration);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("durationchange", onDurationChange);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("durationchange", onDurationChange);
    };
  }, [surah, scrollToVerse]);

  // Volume sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume;
    }
  }, [volume, muted]);

  const reciters = surah
    ? Object.entries(surah.audio).map(([key, val]) => ({ id: key, name: val.reciter }))
    : [];

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
    <div className="min-h-screen bg-background pb-36">
      {/* Header */}
      <header className="bg-primary text-primary-foreground sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="p-2 rounded-lg hover:bg-primary-foreground/10 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="font-display text-xl font-bold truncate">{surah.surahName}</h1>
                <span className="font-arabic text-xl opacity-90">{surah.surahNameArabic}</span>
              </div>
              <p className="text-primary-foreground/60 text-xs mt-0.5">
                {surah.surahNameTranslation} · {surah.revelationPlace} · {surah.totalAyah} Ayahs
              </p>
            </div>

            {/* Translation toggles & Download */}
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <button
                onClick={() => setShowTranslations((p) => ({ ...p, english: !p.english }))}
                className={`px-2.5 py-1 rounded-full transition-colors ${
                  showTranslations.english
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-primary-foreground/5 text-primary-foreground/40"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setShowTranslations((p) => ({ ...p, urdu: !p.urdu }))}
                className={`px-2.5 py-1 rounded-full transition-colors ${
                  showTranslations.urdu
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-primary-foreground/5 text-primary-foreground/40"
                }`}
              >
                UR
              </button>
              {surah?.audio[selectedReciter] && (
                <a
                  href={surah.audio[selectedReciter].url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-full bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30 transition-colors"
                  title="Download audio"
                >
                  <Download className="h-3.5 w-3.5" />
                </a>
              )}
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

      {/* Mobile translation toggles */}
      <div className="sm:hidden flex items-center justify-center gap-2 py-3 text-xs">
        <button
          onClick={() => setShowTranslations((p) => ({ ...p, english: !p.english }))}
          className={`px-3 py-1.5 rounded-full border transition-colors ${
            showTranslations.english
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground border-border"
          }`}
        >
          English
        </button>
        <button
          onClick={() => setShowTranslations((p) => ({ ...p, urdu: !p.urdu }))}
          className={`px-3 py-1.5 rounded-full border transition-colors ${
            showTranslations.urdu
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground border-border"
          }`}
        >
          اردو
        </button>
        {surah?.audio[selectedReciter] && (
          <a
            href={surah.audio[selectedReciter].url}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-full border border-primary bg-primary/10 text-primary flex items-center gap-1 transition-colors hover:bg-primary/20"
          >
            <Download className="h-3 w-3" />
            Download
          </a>
        )}
      </div>

      {/* Verses */}
      <main className="container mx-auto px-4 py-4 space-y-3" role="main" aria-label={`Verses of ${surah.surahName}`}>
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
            <p className="font-arabic text-2xl md:text-3xl leading-loose text-right text-foreground mb-4" dir="rtl" lang="ar">
              {arabic}
            </p>

            {/* English */}
            {showTranslations.english && (
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-3">
                {surah.english[i]}
              </p>
            )}

            {/* Urdu */}
            {showTranslations.urdu && surah.urdu && surah.urdu[i] && (
              <p className="font-arabic text-base md:text-lg text-muted-foreground/80 leading-relaxed text-right" dir="rtl" lang="ur">
                {surah.urdu[i]}
              </p>
            )}
          </div>
        ))}
      </main>

      {/* Navigation */}
      <div className="container mx-auto px-4 py-4 flex justify-between">
        {surahNo > 1 ? (
          <button onClick={() => navigate(`/surah/${surahNo - 1}`)} className="text-sm text-primary hover:underline">
            ← Previous Surah
          </button>
        ) : <div />}
        {surahNo < 114 ? (
          <button onClick={() => navigate(`/surah/${surahNo + 1}`)} className="text-sm text-primary hover:underline">
            Next Surah →
          </button>
        ) : <div />}
      </div>

      {/* Enhanced Audio Player */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border z-20 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)]">
        {/* Progress bar */}
        <div className="container mx-auto px-4 pt-2">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="w-full cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5 px-0.5">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="container mx-auto px-4 pb-3 flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
          {/* Play controls */}
          <div className="flex items-center justify-between">
            <button onClick={skipBack} className="p-2 text-muted-foreground hover:text-foreground transition-colors" title="Back 10s">
              <SkipBack className="h-4 w-4" />
            </button>
            <button
              onClick={togglePlay}
              className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
            </button>
            <button onClick={skipForward} className="p-2 text-muted-foreground hover:text-foreground transition-colors" title="Forward 10s">
              <SkipForward className="h-4 w-4" />
            </button>
          </div>


            {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {surah.surahName} — {reciters.find((r) => r.id === selectedReciter)?.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {playingVerse !== null ? `Ayah ${playingVerse + 1} of ${surah.totalAyah}` : "Tap play to listen"}
            </p>
          </div>

          {/* Secondary controls */}
          <div className="flex items-center gap-1.5">
            {/* Repeat */}
            <button
              onClick={() => setRepeat((r) => !r)}
              className={`p-2 rounded-md transition-colors ${
                repeat ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
              }`}
              title="Repeat"
            >
              <Repeat className="h-4 w-4" />
            </button>

            {/* Volume */}
            <button
              onClick={() => setMuted((m) => !m)}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors hidden md:block"
              title={muted ? "Unmute" : "Mute"}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <div className="hidden md:block w-20">
              <Slider
                value={[muted ? 0 : volume]}
                max={1}
                step={0.01}
                onValueChange={(v) => { setVolume(v[0]); setMuted(false); }}
              />
            </div>

            {/* Reciter select */}
            <div className="sm:block">
              <Select
                value={selectedReciter}
                onValueChange={(value) => {
                  setSelectedReciter(value);
                  setIsPlaying(false);
                  setPlayingVerse(null);
                  setCurrentTime(0);
                  setDuration(0);
                }}
              >
                <SelectTrigger className="w-[140px] h-8 text-xs bg-secondary text-secondary-foreground border-border">
                  <SelectValue placeholder="Select reciter" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  {reciters.map((r) => (
                    <SelectItem key={r.id} value={r.id} className="text-xs">
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

        </div>
      </div>

      <audio ref={audioRef} onEnded={handleAudioEnded} preload="none" aria-label="Quran recitation audio" />
    </div>
  );
};

export default SurahReader;
