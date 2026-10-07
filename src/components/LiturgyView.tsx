import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Calendar,
  RefreshCw,
  Share2,
  BookOpen,
  MessageCircle,
  X,
  Send,
  Check,
  BookmarkPlus
} from 'lucide-react';
import { getLiturgicalDay, fetchLiturgicalDay, type LiturgicalDay } from '../data/liturgy.ts';
import { getTodayDateStr, getTomorrowDateStr } from '../lib/dateUtils.ts';
import { speechService } from '../lib/speech.ts';
import { saveNote } from '../lib/firebase.ts';
import type { User } from 'firebase/auth';
import { PanVivoLogo } from './PanVivoLogo.tsx';

const reflectionClientCache = new Map<string, { reflection: string; priestName: string }>();

interface LiturgyViewProps {
  user: User | null;
  initialDate?: string;
  onNavigateTab?: (tab: 'biblia' | 'oraciones' | 'calendario' | 'ajustes') => void;
}

export const LiturgyView: React.FC<LiturgyViewProps> = ({ user, initialDate, onNavigateTab }) => {
  const todayDateStr = getTodayDateStr();
  const tomorrowDateStr = getTomorrowDateStr();

  const shiftDate = (dateStr: string, days: number): string => {
    const parts = dateStr.split('-');
    const y = parseInt(parts[0], 10) || 2026;
    const m = parseInt(parts[1], 10) || 9;
    const d = parseInt(parts[2], 10) || 1;
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + days);
    const nextY = dt.getFullYear();
    const nextM = String(dt.getMonth() + 1).padStart(2, '0');
    const nextD = String(dt.getDate()).padStart(2, '0');
    return `${nextY}-${nextM}-${nextD}`;
  };

  const [selectedDate, setSelectedDate] = useState(() => initialDate || todayDateStr);
  const [dayData, setDayData] = useState<LiturgicalDay>(() => getLiturgicalDay(initialDate || todayDateStr));
  const [useAlternative, setUseAlternative] = useState(false);
  const [syncingLiturgy, setSyncingLiturgy] = useState(false);

  // Active celebration (allows switching between Fiesta and Feria if available for the day)
  const currentCelebration =
    useAlternative && dayData.alternativeCelebration
      ? dayData.alternativeCelebration
      : dayData;

  // If initialDate prop changes from navigation, sync it
  useEffect(() => {
    if (initialDate && initialDate !== selectedDate) {
      setSelectedDate(initialDate);
    }
  }, [initialDate]);
  const [expandedSection, setExpandedSection] = useState<'reading1' | 'psalm' | 'gospel' | null>(null);
  const [saintModalOpen, setSaintModalOpen] = useState(false);

  // Audio speech states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingSection, setCurrentPlayingSection] = useState<string | null>(null);

  // AI Reflection
  const [reflection, setReflection] = useState<string | null>(null);
  const [priestName, setPriestName] = useState('Padre Mateo');
  const [loadingReflection, setLoadingReflection] = useState(false);
  const [reflectionError, setReflectionError] = useState<string | null>(null);

  // Pastoral Counsel dialog
  const [counselOpen, setCounselOpen] = useState(false);
  const [counselQuery, setCounselQuery] = useState('');
  const [counselMessages, setCounselMessages] = useState<Array<{ role: 'user' | 'priest'; text: string }>>([]);
  const [counselLoading, setCounselLoading] = useState(false);

  const [copiedNotification, setCopiedNotification] = useState(false);
  const [savedNotification, setSavedNotification] = useState(false);

  // Sync speech state
  useEffect(() => {
    const unsub = speechService.subscribe((speaking) => {
      setIsPlaying(speaking);
      if (!speaking) setCurrentPlayingSection(null);
    });
    return () => {
      unsub();
      speechService.stop();
    };
  }, []);

  // Update day data when date changes with canonical remote synchronization
  useEffect(() => {
    let isMounted = true;
    setUseAlternative(false);

    // 1. Immediate synchronous resolution (no delay)
    const initial = getLiturgicalDay(selectedDate);
    setDayData(initial);
    if (initial.source !== 'local') fetchReflection(initial);
    else setLoadingReflection(true);

    // 2. Asynchronous canonical synchronization for any selected date
    setSyncingLiturgy(true);
    fetchLiturgicalDay(selectedDate)
      .then((canonical) => {
        if (isMounted && canonical) {
          setDayData(canonical);
          fetchReflection(canonical);
        }
      })
      .catch((err) => {
        console.warn('Liturgia remota no disponible, usando leccionario canónico local:', err);
      })
      .finally(() => {
        if (isMounted) setSyncingLiturgy(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

  const fetchReflection = async (data: LiturgicalDay) => {
    if (data.readingsPending) {
      setReflection(
        'La homilía de este día estará disponible cuando se publiquen las lecturas oficiales (aproximadamente tres meses antes de la fecha).'
      );
      setReflectionError(null);
      setLoadingReflection(false);
      return;
    }

    const cached = reflectionClientCache.get(data.formattedDate);
    if (cached) {
      setReflection(cached.reflection);
      if (cached.priestName) setPriestName(cached.priestName);
      setLoadingReflection(false);
      return;
    }

    setLoadingReflection(true);
    setReflectionError(null);
    try {
      const res = await fetch('/api/reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: data.formattedDate,
          liturgicalTitle: data.title,
          saint: data.saint.name,
          reading1: `${data.firstReading.citation} - ${data.firstReading.text}`,
          reading2: data.secondReading ? `${data.secondReading.citation} - ${data.secondReading.text}` : undefined,
          psalm: `${data.psalm.citation}. R/. ${data.psalm.response}`,
          gospel: data.gospel.text,
          gospelQuote: data.gospel.citation,
        }),
      });

      if (!res.ok) throw new Error('Error al conectar con la reflexión');
      const json = await res.json();
      if (!json.reflection) throw new Error(json.error || 'Respuesta de reflexión vacía');
      setReflection(json.reflection);
      if (json.priestName) setPriestName(json.priestName);
      reflectionClientCache.set(data.formattedDate, {
        reflection: json.reflection,
        priestName: json.priestName || 'Padre Mateo',
      });
    } catch {
      const fallbackText =
        `«La paz de Nuestro Señor Jesucristo esté con todos ustedes, queridos hermanos y hermanas en la fe.\n\nEn este día santo (${data.formattedDate}), la Palabra de Dios proclamada en la Sagrada Liturgia (${data.title}) nos interpela en lo más hondo del alma.\n\nEn el Santo Evangelio (${data.gospel.citation}), Jesús nos revela el corazón del Reino de Dios y nos invita a acoger su Palabra con fe sencilla y confiada. ${data.secondReading ? `Las lecturas de hoy, y en especial la Segunda Lectura (${data.secondReading.citation}), nos recuerdan que somos llamados a vivir enteramente para el Señor, en comunión de caridad fraterna.` : `La Primera Lectura (${data.firstReading.citation}) ilumina este mismo llamado a la fidelidad.`}\n\nLa verdadera fe se manifiesta en el perdón sincero, en desterrar el rencor y en saber que hemos recibido un perdón infinito de parte de Dios.\n\nPropósito para hoy: Renunciar de corazón a cualquier queja o resentimiento que llevemos guardado, rezar por aquella persona que nos cuesta perdonar y ofrecerle la paz.\n\nOremos: Señor Dios compasivo y misericordioso, enséñanos a perdonar como Tú nos has perdonado y haz que nuestro corazón descanse siempre en tu amor. Por la intercesión de ${data.saint.name}, escucha nuestra oración.\n\nQue la bendición de Dios todopoderoso, Padre, Hijo y Espíritu Santo, descienda sobre ustedes y sus familias, y permanezca para siempre. Amén.»`;
      setReflection(fallbackText);
      reflectionClientCache.set(data.formattedDate, {
        reflection: fallbackText,
        priestName: 'Padre Mateo',
      });
    } finally {
      setLoadingReflection(false);
    }
  };

  const playAudio = (sectionId: string, textToPlay: string) => {
    if (currentPlayingSection === sectionId && isPlaying) {
      speechService.stop();
      setCurrentPlayingSection(null);
    } else {
      setCurrentPlayingSection(sectionId);
      speechService.speak(textToPlay, () => setCurrentPlayingSection(null));
    }
  };

  const handleSendCounsel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!counselQuery.trim() || counselLoading) return;

    const userQ = counselQuery.trim();
    setCounselQuery('');
    setCounselMessages((prev) => [...prev, { role: 'user', text: userQ }]);
    setCounselLoading(true);

    try {
      const res = await fetch('/api/spiritual-counsel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userQ,
          context: `Evangelio del día: ${dayData.gospel.citation} - "${dayData.gospel.text}"`,
        }),
      });
      const data = await res.json();
      setCounselMessages((prev) => [
        ...prev,
        { role: 'priest', text: data.counsel || 'Que el Señor te conceda su paz y fortaleza.' },
      ]);
    } catch {
      setCounselMessages((prev) => [
        ...prev,
        {
          role: 'priest',
          text: 'Querido hermano: persevera en la oración diaria y acércate al sacramento de la Reconciliación y a la Santa Eucaristía, donde hallarás la paz que el mundo no puede dar. Te bendigo en el nombre del Padre, del Hijo y del Espíritu Santo. Amén.',
        },
      ]);
    } finally {
      setCounselLoading(false);
    }
  };

  const handleSaveToNotes = async () => {
    if (!reflection) return;
    const note = {
      id: 'note_' + Date.now(),
      userId: user?.uid || 'guest',
      title: `Homilía - ${currentCelebration.title}`,
      content: `${currentCelebration.gospel.citation}\n\n${reflection}`,
      date: dayData.date,
      createdAt: new Date().toISOString(),
    };
    await saveNote(user?.uid || 'guest', note);
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 3000);
  };

  const handleShare = async () => {
    const text = `🕊️ Liturgia - ${currentCelebration.title}\n\n📖 Evangelio (${currentCelebration.gospel.citation}):\n${currentCelebration.gospel.text}\n\n✨ Reflexión del ${priestName}:\n${reflection?.slice(0, 400)}...\n\nReza con Pan Vivo.`;
    if (navigator.share) {
      try {
        await navigator.share({ title: currentCelebration.title, text });
      } catch {}
    } else {
      navigator.clipboard.writeText(text);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2500);
    }
  };

  return (
    <div id="liturgy-container" className="min-h-screen pb-36 text-slate-100">
      {/* Top Hero Banner with Sacred Light & Pan Vivo Brand */}
      <div className="relative h-60 w-full overflow-hidden bg-slate-950">
        {/* Pure CSS Sacred Light & Altar Glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1c130b] via-[#140e08] to-[#0c0805]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.28),rgba(255,255,255,0))]"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[480px] h-[220px] bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top bar controls */}
        <div className="absolute top-3.5 left-4 right-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#17100a]/80 backdrop-blur-md rounded-2xl border border-amber-500/30 shadow-lg shadow-black/40">
            <PanVivoLogo size="sm" showSubtitle={false} />
          </div>

          {/* Quick toggle: Anterior / Hoy / Mañana / Siguiente + Calendario */}
          <div className="flex items-center gap-1 bg-[#17100a]/80 backdrop-blur-md p-1 rounded-2xl border border-amber-900/30 text-xs shadow-lg shadow-black/30">
            <button
              id="btn-date-prev"
              title="Día anterior"
              aria-label="Día anterior"
              onClick={() => setSelectedDate(shiftDate(selectedDate, -1))}
              className="p-1 rounded-xl text-slate-300 hover:text-white hover:bg-amber-500/20 transition-all active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              id="btn-date-today"
              onClick={() => setSelectedDate(todayDateStr)}
              className={`px-2.5 py-1 rounded-xl font-medium transition-all ${
                selectedDate === todayDateStr
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Hoy
            </button>
            <button
              id="btn-date-tomorrow"
              onClick={() => setSelectedDate(tomorrowDateStr)}
              className={`px-2.5 py-1 rounded-xl font-medium transition-all ${
                selectedDate === tomorrowDateStr
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Mañana
            </button>

            <button
              id="btn-date-next"
              title="Día siguiente"
              aria-label="Día siguiente"
              onClick={() => setSelectedDate(shiftDate(selectedDate, 1))}
              className="p-1 rounded-xl text-slate-300 hover:text-white hover:bg-amber-500/20 transition-all active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Native calendar date-picker wrapper */}
            <label
              title="Seleccionar otra fecha del año"
              className="relative p-1 rounded-xl text-amber-300 hover:text-amber-200 hover:bg-amber-500/20 cursor-pointer transition-all flex items-center justify-center"
            >
              <Calendar className="w-4 h-4" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) setSelectedDate(e.target.value);
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </label>
          </div>
        </div>

        {/* Liturgical Title & Date in Hero */}
        <div className="absolute bottom-3 left-4 right-4 text-center">
          <p className="text-xs uppercase tracking-wider text-amber-300/90 font-medium mb-1">
            {dayData.formattedDate}
          </p>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight drop-shadow-md">
            {currentCelebration.title}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium border ${
                currentCelebration.color === 'red'
                  ? 'bg-red-950/80 border-red-500/40 text-red-300'
                  : currentCelebration.color === 'purple'
                  ? 'bg-purple-950/80 border-purple-500/40 text-purple-300'
                  : currentCelebration.color === 'white'
                  ? 'bg-slate-800/80 border-amber-300/40 text-amber-200'
                  : 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  currentCelebration.color === 'red'
                    ? 'bg-red-400'
                    : currentCelebration.color === 'purple'
                    ? 'bg-purple-400'
                    : currentCelebration.color === 'white'
                    ? 'bg-amber-300'
                    : 'bg-emerald-400'
                }`}
              ></span>
              {currentCelebration.colorName}
            </span>

            {syncingLiturgy && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 border border-amber-500/30 text-amber-300 animate-pulse">
                Sincronizando leccionario canónico...
              </span>
            )}
          </div>

          {/* Alternative celebration selector (e.g. Fiesta vs Feria) */}
          {dayData.alternativeCelebration && (
            <div className="flex items-center justify-center gap-2 mt-2.5">
              <button
                type="button"
                onClick={() => setUseAlternative(false)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                  !useAlternative
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-700/60'
                }`}
              >
                Celebración principal
              </button>
              <button
                type="button"
                onClick={() => setUseAlternative(true)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                  useAlternative
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-700/60'
                }`}
              >
                Feria / Ordinario
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Fast-Navigation Bar for Liturgical Readings */}
      <div className="sticky top-0 z-20 px-4 py-2 bg-[#0e0a07]/95 backdrop-blur-md border-y border-amber-950/60 shadow-md">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => document.getElementById('card-primera-lectura')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-300 hover:border-amber-500/40 active:scale-95 transition-all text-[11px] font-medium"
          >
            1ª Lectura
          </button>
          <button
            onClick={() => document.getElementById('card-salmo-responsorial')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-300 hover:border-amber-500/40 active:scale-95 transition-all text-[11px] font-medium"
          >
            {currentCelebration.psalm.citation.split(':')[0].split(',')[0] || 'Salmo'}
          </button>
          {currentCelebration.secondReading && (
            <button
              onClick={() => document.getElementById('card-segunda-lectura')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 active:scale-95 transition-all text-[11px] font-semibold flex items-center gap-1"
            >
              <span>2ª Lectura</span>
              <span className="text-[9px] bg-amber-500 text-slate-950 px-1 rounded font-bold">Dom/Sol</span>
            </button>
          )}
          <button
            onClick={() => document.getElementById('card-evangelio')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-900 border border-amber-500/40 text-amber-300 hover:border-amber-300 active:scale-95 transition-all text-[11px] font-semibold"
          >
            Evangelio
          </button>
          <button
            onClick={() => document.getElementById('card-reflexion-sacerdotal')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-300 hover:border-amber-500/40 active:scale-95 transition-all text-[11px] font-medium"
          >
            Homilía
          </button>
        </div>
      </div>

      {/* Main Content Stream */}
      <div className="px-4 py-4 space-y-4 max-w-xl mx-auto">
        {/* Toast alerts */}
        {copiedNotification && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2 rounded-full text-xs font-medium shadow-lg flex items-center gap-2">
            <Check className="w-4 h-4" /> Liturgia copiada al portapapeles
          </div>
        )}
        {savedNotification && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-amber-600 text-slate-950 px-4 py-2 rounded-full text-xs font-semibold shadow-lg flex items-center gap-2">
            <Check className="w-4 h-4" /> Homilía guardada en tus notas de meditación
          </div>
        )}

        {/* 1. Card: Santo del Día */}
        <div
          id="card-santo-del-dia"
          onClick={() => setSaintModalOpen(true)}
          className="group relative bg-slate-900/80 hover:bg-slate-900 border border-slate-800/90 rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-md hover:border-amber-500/30"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5 text-xs text-amber-400 font-medium mb-1">
              <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center">
                <span className="text-sm">👤</span>
              </div>
              <span className="tracking-wide uppercase text-[11px]">Santo del Día</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
          </div>

          <h3 className="text-base font-serif font-bold text-slate-100 mt-1">
            {dayData.saint.name}
            <span className="block text-xs font-serif font-normal text-slate-400 mt-0.5">
              {dayData.saint.title}
            </span>
          </h3>

          <p className="text-xs text-slate-300 mt-2 line-clamp-2 leading-relaxed">
            {dayData.saint.shortBio}
          </p>

          <div className="mt-3 flex items-center justify-between text-[11px] text-amber-400/90 font-medium">
            <span>Toca para leer biografía y oración</span>
            <span className="text-slate-500 text-[10px]">Leer más →</span>
          </div>
        </div>

        {/* 2. Card: Primera Lectura */}
        <div
          id="card-primera-lectura"
          className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 shadow-md transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-slate-800 border border-slate-700 text-amber-300 text-xs font-bold flex items-center justify-center">
                1
              </span>
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Primera Lectura
              </span>
            </div>

            <button
              id="btn-audio-primera-lectura"
              onClick={() =>
                playAudio('reading1', `Primera Lectura. ${currentCelebration.firstReading.citation}. ${currentCelebration.firstReading.text}. Palabra de Dios. Te alabamos, Señor.`)
              }
              className={`p-2 rounded-full transition-all ${
                currentPlayingSection === 'reading1' && isPlaying
                  ? 'bg-amber-500 text-slate-950 scale-105'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-750'
              }`}
              title="Escuchar lectura"
            >
              {currentPlayingSection === 'reading1' && isPlaying ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
          </div>

          <p className="text-xs font-semibold text-amber-400 font-serif mb-2">
            {currentCelebration.firstReading.citation}
          </p>

          <p
            className={`text-xs sm:text-sm text-slate-200 leading-relaxed font-serif whitespace-pre-line ${
              expandedSection === 'reading1' ? '' : 'line-clamp-4'
            }`}
          >
            {currentCelebration.firstReading.text}
          </p>

          <div className="mt-2 flex items-center justify-between">
            <button
              onClick={() =>
                setExpandedSection(expandedSection === 'reading1' ? null : 'reading1')
              }
              className="text-[11px] text-amber-400/90 hover:text-amber-300 font-medium"
            >
              {expandedSection === 'reading1' ? 'Mostrar menos' : 'Toca para leer completo'}
            </button>
            <span className="text-[10px] text-slate-400 font-serif italic">Palabra de Dios</span>
          </div>
        </div>

        {/* 3. Card: Salmo Responsorial */}
        <div
          id="card-salmo-responsorial"
          className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 shadow-md transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">🎵</span>
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Salmo Responsorial
              </span>
            </div>

            <button
              id="btn-audio-salmo"
              onClick={() =>
                playAudio(
                  'psalm',
                  `Salmo Responsorial. ${currentCelebration.psalm.citation}. Respuesta: ${currentCelebration.psalm.response}. ${currentCelebration.psalm.verses.join('. ')}`
                )
              }
              className={`p-2 rounded-full transition-all ${
                currentPlayingSection === 'psalm' && isPlaying
                  ? 'bg-amber-500 text-slate-950 scale-105'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-750'
              }`}
              title="Escuchar salmo"
            >
              {currentPlayingSection === 'psalm' && isPlaying ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
          </div>

          <p className="text-xs font-semibold text-slate-400 mb-2">
            {currentCelebration.psalm.citation}
          </p>

          {/* Antiphon Callout */}
          <div className="bg-amber-950/30 border-l-2 border-amber-500 px-3 py-2 rounded-r-xl my-2">
            <p className="text-xs text-amber-300 font-serif font-medium italic">
              R/. {currentCelebration.psalm.response}
            </p>
          </div>

          <div
            className={`space-y-2 text-xs sm:text-sm text-slate-300 leading-relaxed font-serif whitespace-pre-line ${
              expandedSection === 'psalm' ? '' : 'line-clamp-3'
            }`}
          >
            {currentCelebration.psalm.verses.map((verse, i) => (
              <p key={i}>{verse}</p>
            ))}
          </div>

          <button
            onClick={() =>
              setExpandedSection(expandedSection === 'psalm' ? null : 'psalm')
            }
            className="mt-2 text-[11px] text-amber-400/90 hover:text-amber-300 font-medium"
          >
            {expandedSection === 'psalm' ? 'Mostrar menos' : 'Toca para leer estrofas completas'}
          </button>
        </div>

        {/* 3b. Card: Segunda Lectura (Domingos y Solemnidades) */}
        {currentCelebration.secondReading && (
          <div
            id="card-segunda-lectura"
            className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 shadow-md transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-slate-800 border border-slate-700 text-amber-300 text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Segunda Lectura
                </span>
                <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-full font-sans">
                  Domingos y Solemnidades
                </span>
              </div>

              <button
                id="btn-audio-segunda-lectura"
                onClick={() =>
                  playAudio(
                    'reading2',
                    `Segunda Lectura. ${currentCelebration.secondReading!.citation}. ${currentCelebration.secondReading!.text}. Palabra de Dios. Te alabamos, Señor.`
                  )
                }
                className={`p-2 rounded-full transition-all ${
                  currentPlayingSection === 'reading2' && isPlaying
                    ? 'bg-amber-500 text-slate-950 scale-105'
                    : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-750'
                }`}
                title="Escuchar segunda lectura"
              >
                {currentPlayingSection === 'reading2' && isPlaying ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
            </div>

            <p className="text-xs font-semibold text-amber-400 font-serif mb-2">
              {currentCelebration.secondReading.citation}
            </p>

            <p
              className={`text-xs sm:text-sm text-slate-200 leading-relaxed font-serif whitespace-pre-line ${
                expandedSection === 'reading2' ? '' : 'line-clamp-4'
              }`}
            >
              {currentCelebration.secondReading.text}
            </p>

            <div className="mt-2 flex items-center justify-between">
              <button
                onClick={() =>
                  setExpandedSection(expandedSection === 'reading2' ? null : 'reading2')
                }
                className="text-[11px] text-amber-400/90 hover:text-amber-300 font-medium"
              >
                {expandedSection === 'reading2' ? 'Mostrar menos' : 'Toca para leer completo'}
              </button>
              <span className="text-[10px] text-slate-400 font-serif italic">Palabra de Dios</span>
            </div>
          </div>
        )}

        {/* 4. Card: Santo Evangelio (Golden Accent) */}
        <div
          id="card-evangelio"
          className="relative bg-gradient-to-b from-amber-950/30 to-slate-900 border border-amber-500/30 rounded-2xl p-4 shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider font-serif">
                Santo Evangelio
              </span>
            </div>

            <button
              id="btn-audio-evangelio"
              onClick={() =>
                playAudio(
                  'gospel',
                  `Proclamación del Santo Evangelio según ${currentCelebration.gospel.citation}. ${currentCelebration.gospel.text}. Palabra del Señor. Gloria a ti, Señor Jesús.`
                )
              }
              className={`p-2 rounded-full transition-all ${
                currentPlayingSection === 'gospel' && isPlaying
                  ? 'bg-amber-400 text-slate-950 scale-105'
                  : 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/20'
              }`}
              title="Escuchar Evangelio"
            >
              {currentPlayingSection === 'gospel' && isPlaying ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
          </div>

          <p className="text-sm font-bold text-amber-200 font-serif mb-1">
            {currentCelebration.gospel.citation}
          </p>

          <p className="text-[11px] text-slate-400 italic mb-3">
            {currentCelebration.gospel.acclamation}
          </p>

          <div className="text-xs sm:text-sm text-slate-100 leading-relaxed font-serif space-y-2 border-l border-amber-500/20 pl-3">
            <p className="whitespace-pre-line">{currentCelebration.gospel.text}</p>
          </div>

          <div className="mt-3 pt-2 border-t border-amber-500/20 flex items-center justify-between text-[11px] text-amber-300/80 font-serif">
            <span>Palabra del Señor</span>
            <span className="font-semibold text-amber-200">Gloria a ti, Señor Jesús</span>
          </div>
        </div>

        {/* 5. Card: Reflexión Sacerdotal con IA (Padre Mateo) */}
        <div
          id="card-reflexion-sacerdotal"
          className="relative bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl overflow-hidden"
        >
          {/* Subtle warm glow inside */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-amber-300 font-serif block">
                  Reflexión Sacerdotal
                </span>
                <span className="text-[11px] text-slate-400 font-serif">
                  {priestName} • Guía Espiritual
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                id="btn-reload-reflection"
                onClick={() => fetchReflection(dayData)}
                disabled={loadingReflection}
                className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors disabled:opacity-50"
                title="Nueva meditación del sacerdote"
              >
                <RefreshCw className={`w-4 h-4 ${loadingReflection ? 'animate-spin text-amber-400' : ''}`} />
              </button>

              <button
                id="btn-listen-reflection"
                onClick={() => reflection && playAudio('reflection', reflection)}
                disabled={!reflection}
                className={`p-2 rounded-full transition-all ${
                  currentPlayingSection === 'reflection' && isPlaying
                    ? 'bg-amber-400 text-slate-950 scale-105'
                    : 'bg-slate-800 text-amber-400 hover:bg-slate-750'
                }`}
                title="Escuchar homilía del sacerdote"
              >
                {currentPlayingSection === 'reflection' && isPlaying ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {loadingReflection ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-8 h-8 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin"></div>
              <p className="text-xs text-slate-400 font-serif">
                El Padre Mateo está meditando la Palabra para ti...
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs sm:text-sm text-slate-200 font-serif leading-relaxed whitespace-pre-line bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80">
                {reflection}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <button
                  id="btn-ask-priest"
                  onClick={() => setCounselOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Pregúntale al Padre Mateo (Chat de Guía Espiritual)</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    id="btn-save-reflection"
                    onClick={handleSaveToNotes}
                    className="p-2 text-slate-400 hover:text-amber-300 rounded-lg hover:bg-slate-800 transition-colors"
                    title="Guardar en mis notas espirituales"
                  >
                    <BookmarkPlus className="w-4 h-4" />
                  </button>

                  <button
                    id="btn-share-liturgy"
                    onClick={handleShare}
                    className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                    title="Compartir reflexión y Evangelio"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Biografía y Oración del Santo del Día */}
      {saintModalOpen && (
        <div
          id="modal-santo-details"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl text-slate-100 relative">
            <button
              id="btn-close-saint-modal"
              onClick={() => setSaintModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-4">
              <span className="text-3xl mb-1 block">👤</span>
              <h2 className="text-xl font-serif font-bold text-amber-300">{dayData.saint.name}</h2>
              <p className="text-xs text-slate-400">{dayData.saint.title}</p>
              {dayData.saint.patronage && (
                <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[11px] bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  Patrono de: {dayData.saint.patronage}
                </span>
              )}
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed font-serif">
              <div>
                <h4 className="font-semibold text-white uppercase text-xs tracking-wider mb-1">
                  Vida y Testimonio
                </h4>
                <p>{dayData.saint.fullBio}</p>
              </div>

              <div className="bg-amber-950/20 border border-amber-500/20 rounded-2xl p-4">
                <h4 className="font-serif font-bold text-amber-300 text-xs tracking-wide uppercase mb-1">
                  Oración de Intercesión
                </h4>
                <p className="font-serif italic text-slate-200 leading-relaxed">
                  «{dayData.saint.prayer}»
                </p>
              </div>
            </div>

            <button
              onClick={() => setSaintModalOpen(false)}
              className="w-full mt-6 bg-slate-800 hover:bg-slate-750 text-slate-200 py-2.5 rounded-xl text-xs font-semibold"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Drawer/Modal: Diálogo Espiritual con el Padre Mateo */}
      {counselOpen && (
        <div
          id="modal-pastoral-counsel"
          onClick={() => setCounselOpen(false)}
          className="fixed inset-0 z-[75] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#17110b] border border-amber-950/60 rounded-t-3xl sm:rounded-3xl max-w-lg w-full h-[85vh] sm:h-[78vh] flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-amber-950/60 flex items-center justify-between bg-[#140e09] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 text-sm shadow-sm">
                  ✝️
                </div>
                <div>
                  <h3 className="text-sm font-serif font-bold text-amber-300">
                    Chat de Acompañamiento Espiritual
                  </h3>
                  <p className="text-[11px] text-amber-200/60 font-serif">Padre Mateo • Asistente Pastoral Católico (IA)</p>
                </div>
              </div>
              <button
                onClick={() => setCounselOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-[#221810]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs sm:text-sm">
              <div className="bg-[#221810] border border-amber-900/30 p-3.5 rounded-2xl rounded-tl-none max-w-[90%] text-[#ece4d8] font-serif shadow-sm">
                <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-1">Padre Mateo</p>
                «¡La paz del Señor esté contigo! Este es un espacio de diálogo y consejería católica. Puedes hacerme preguntas sobre las lecturas de hoy, dudas de fe, consejos para tu oración o cómo vivir el Evangelio en tu vida diaria.»
              </div>

              {/* Sugerencias rápidas si aún no ha enviado mensajes */}
              {counselMessages.length === 0 && (
                <div className="pt-2 space-y-1.5">
                  <p className="text-[11px] text-amber-200/50 font-serif px-1">Preguntas sugeridas:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      '¿Cómo aplicar el Evangelio de hoy a mi vida?',
                      'Siento desánimo en mi oración, ¿qué me aconseja?',
                      '¿Cómo prepararme para una buena confesión?',
                    ].map((promptText, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setCounselQuery(promptText);
                        }}
                        className="text-left text-xs bg-[#221810]/70 hover:bg-[#2c1f15] border border-amber-900/30 rounded-xl px-3 py-1.5 text-amber-200/80 hover:text-amber-100 transition-colors"
                      >
                        {promptText}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {counselMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`p-3.5 rounded-2xl max-w-[88%] leading-relaxed shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-amber-500 text-slate-950 font-medium rounded-br-none'
                        : 'bg-[#221810] border border-amber-900/30 text-[#ece4d8] font-serif rounded-tl-none whitespace-pre-line'
                    }`}
                  >
                    {msg.role !== 'user' && (
                      <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-1">Padre Mateo</p>
                    )}
                    {msg.text}
                  </div>
                </div>
              ))}

              {counselLoading && (
                <div className="flex justify-start">
                  <div className="p-3 bg-[#221810] border border-amber-900/30 rounded-2xl rounded-tl-none text-amber-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce"></span>
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce delay-150"></span>
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce delay-300"></span>
                    <span className="text-xs font-serif">El Padre Mateo está respondiendo...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form
              onSubmit={handleSendCounsel}
              className="p-3 pb-8 sm:pb-3 border-t border-amber-950/60 bg-[#140e09] flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={counselQuery}
                onChange={(e) => setCounselQuery(e.target.value)}
                placeholder="Escribe tu consulta o inquietud espiritual..."
                className="flex-1 bg-[#1c130b] border border-amber-900/40 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#ece4d8] placeholder-stone-500 focus:outline-none focus:border-amber-400/80"
              />
              <button
                type="submit"
                disabled={!counselQuery.trim() || counselLoading}
                className="p-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl disabled:opacity-40 transition-colors shadow-sm"
                title="Enviar consulta"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
