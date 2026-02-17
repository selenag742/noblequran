import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, BookOpen, MapPin } from "lucide-react";
import { fetchSurahList } from "@/lib/api";
import { SurahSummary } from "@/lib/types";
import { Input } from "@/components/ui/input";

const Index = () => {
  const [surahs, setSurahs] = useState<SurahSummary[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSurahList()
      .then(setSurahs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const lastSurah = localStorage.getItem("lastSurah");

  const filtered = surahs.filter(
    (s) =>
      s.surahName.toLowerCase().includes(search.toLowerCase()) ||
      s.surahNameTranslation.toLowerCase().includes(search.toLowerCase()) ||
      s.surahNameArabic.includes(search)
  );

  return (
    <div className="min-h-screen bg-background islamic-pattern">
      {/* Hero Header */}
      <header className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 opacity-50">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8vw] font-arabic leading-none select-none">
            ﷽
          </div>
        </div>
        <div className="relative container mx-auto px-4 py-16 md:py-36 text-center">
          {/* <h1 className="font-display text-4xl md:text-5xl font-bold mb-3 tracking-tight">
            The Noble Quran
          </h1>
          <p className="font-arabic text-2xl md:text-3xl mb-2 opacity-90">القرآن الكريم</p>
          <p className="text-primary-foreground/70 text-sm md:text-base max-w-md mx-auto">
            Read, listen, and reflect upon the words of Allah
          </p> */}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="max-w-xl mx-auto mb-8 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search surahs by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>

        {/* Continue Reading */}
        {lastSurah && !search && (
          <button
            onClick={() => navigate(`/surah/${lastSurah}`)}
            className="mx-auto mb-8 flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-accent-foreground font-medium text-sm hover:opacity-90 transition-opacity"
          >
            <BookOpen className="h-4 w-4" />
            Continue reading Surah {lastSurah}
          </button>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {/* Surah Grid */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((surah, i) => (
              <button
                key={i}
                onClick={() => navigate(`/surah/${i + 1}`)}
                className="surah-card-hover bg-card rounded-lg border border-border p-4 text-left flex items-center gap-4 animate-fade-in"
                style={{ animationDelay: `${Math.min(i * 20, 400)}ms`, opacity: 0 }}
              >
                {/* Number Badge */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary">
                    {surahs.indexOf(surah) + 1}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-medium text-foreground truncate">
                      {surah.surahName}
                    </h3>
                    <span className="font-arabic text-lg text-primary flex-shrink-0">
                      {surah.surahNameArabic}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{surah.surahNameTranslation}</span>
                    <span>·</span>
                    <span className="flex items-center gap-0.5">
                      <MapPin className="h-3 w-3" />
                      {surah.revelationPlace}
                    </span>
                    <span>·</span>
                    <span>{surah.totalAyah} Ayahs</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12">
            No surahs found matching "{search}"
          </p>
        )}
      </main>
    </div>
  );
};

export default Index;
