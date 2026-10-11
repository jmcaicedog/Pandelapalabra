import React, { useState, useEffect, useRef } from 'react';
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
  X,
  Check,
  BookmarkPlus
} from 'lucide-react';
import { getLiturgicalDay, fetchLiturgicalDay, type LiturgicalDay } from '../data/liturgy.ts';
import { shiftDate, isValidDateStr } from '../lib/dateUtils.ts';
import { useTodayDate } from '../lib/useTodayDate.ts';
import { withAbortTimeout } from '../lib/asyncUtils.ts';
import { ExpiringCache } from '../lib/cache.ts';
import { speechService } from '../lib/speech.ts';
import { saveNote } from '../lib/firebase.ts';
import type { User } from 'firebase/auth';
import { PanVivoLogo } from './PanVivoLogo.tsx';
import { SaintSource } from './SaintSource.tsx';

const reflectionClientCache = new ExpiringCache<string>(30, 60 * 60 * 1000);

interface LiturgyViewProps {
  user: User | null;
  initialDate?: string;
  onNavigateTab?: (tab: 'biblia' | 'oraciones' | 'calendario' | 'ajustes') => void;
}

export const LiturgyView: React.FC<LiturgyViewProps> = ({ user, initialDate, onNavigateTab }) => {
  const todayDateStr = useTodayDate();
  const tomorrowDateStr = shiftDate(todayDateStr, 1);
  const previousToday = useRef(todayDateStr);

  const [selectedDate, setSelectedDate] = useState(() => isValidDateStr(initialDate) ? initialDate : todayDateStr);
  const [dayData, setDayData] = useState<LiturgicalDay>(() => getLiturgicalDay(isValidDateStr(initialDate) ? initialDate : todayDateStr));
  const [syncingLiturgy, setSyncingLiturgy] = useState(false);
  useEffect(() => {
    const previous = previousToday.current;
    previousToday.current = todayDateStr;
    setSelectedDate(date => date === previous ? todayDateStr : date);
  }, [todayDateStr]);

  const currentCelebration = dayData;
  const reflectionRequest = useRef(0);
  const reflectionAbort = useRef<AbortController | null>(null);
  const selectedDateRef = useRef(selectedDate);
  selectedDateRef.current = selectedDate;
  useEffect(() => () => {
    reflectionRequest.current += 1;
    reflectionAbort.current?.abort();
  }, []);

  // If initialDate prop changes from navigation, sync it
  useEffect(() => {
    if (isValidDateStr(initialDate) && initialDate !== selectedDate) {
      setSelectedDate(initialDate);
    }
  }, [initialDate]);
  const [saintModalOpen, setSaintModalOpen] = useState(false);

  // Audio speech states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingSection, setCurrentPlayingSection] = useState<string | null>(null);

  // AI Reflection
  const [reflection, setReflection] = useState<string | null>(null);
  const [loadingReflection, setLoadingReflection] = useState(false);
  const [reflectionError, setReflectionError] = useState<string | null>(null);

  const [copiedNotification, setCopiedNotification] = useState(false);
  const [savedNotification, setSavedNotification] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

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
    reflectionRequest.current += 1;
    reflectionAbort.current?.abort();
    speechService.stop();
    setReflection(null);
    setReflectionError(null);
    setSaintModalOpen(false);
    setActionError(null);

    // 1. Immediate synchronous resolution (no delay)
    const initial = getLiturgicalDay(selectedDate);
    setDayData(initial);
    setLoadingReflection(true);

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
        if (isMounted) {
          setReflectionError('No se pudo cargar la liturgia. Reintenta la consulta.');
          setLoadingReflection(false);
        }
      })
      .finally(() => {
        if (isMounted) setSyncingLiturgy(false);
      });

    return () => {
      isMounted = false;
      reflectionRequest.current += 1;
    };
  }, [selectedDate]);

  const fetchReflection = async (data: LiturgicalDay) => {
    const requestId = ++reflectionRequest.current;
    reflectionAbort.current?.abort();
    const controller = new AbortController();
    reflectionAbort.current = controller;
    const isCurrent = () => requestId === reflectionRequest.current && data.date === selectedDateRef.current;
    if (data.readingsPending) {
      setReflection(null);
      setReflectionError('La reflexión estará disponible cuando se puedan cargar las lecturas completas.');
      setLoadingReflection(false);
      return;
    }

    const reflectionKey = data.date;
    const cached = reflectionClientCache.get(reflectionKey);
    if (cached) {
      setReflection(cached);
      setLoadingReflection(false);
      return;
    }

    setLoadingReflection(true);
    setReflectionError(null);
    try {
      const json = await withAbortTimeout(async signal => {
        const res = await fetch('/api/reflection', {
          signal, method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: data.date }),
        });
        if (!res.ok) {
          const failure = await res.json();
          throw new Error(failure?.code === 'generation_timeout'
            ? 'La generación tardó demasiado. Espera un minuto y vuelve a intentarlo.'
            : 'La reflexión no está disponible. Puedes reintentar o consultar Vatican News.');
        }
        return res.json();
      }, 125000, controller.signal);
      if (json.date !== data.date || typeof json.reflection !== 'string' || !json.reflection.trim() || json.fallback) {
        throw new Error('Respuesta de reflexión no disponible.');
      }
      if (!isCurrent()) return;
      setReflection(json.reflection);
      reflectionClientCache.set(reflectionKey, json.reflection);
    } catch (error) {
      if (!isCurrent()) return;
      console.warn('Reflexión no disponible:', error);
      setReflection(null);
      setReflectionError(error instanceof Error && error.message === 'La generación tardó demasiado. Espera un minuto y vuelve a intentarlo.'
        ? error.message : 'La reflexión no está disponible. Puedes reintentar o consultar Vatican News.');
    } finally {
      if (isCurrent()) setLoadingReflection(false);
    }
  };

  const retryReflection = async () => {
    const date = selectedDate;
    setSyncingLiturgy(true);
    try {
      const refreshed = await fetchLiturgicalDay(date);
      if (date !== selectedDateRef.current) return;
      setDayData(refreshed);
      await fetchReflection(refreshed);
    } catch (error) {
      console.warn('No se pudo reintentar la liturgia:', error);
      if (date === selectedDateRef.current) setReflectionError('No se pudo cargar la liturgia. Reintenta más tarde.');
    } finally {
      if (date === selectedDateRef.current) setSyncingLiturgy(false);
    }
  };

  const retryBiography = async () => {
    const date = selectedDate;
    setActionError(null);
    try {
      const refreshed = await fetchLiturgicalDay(date);
      if (date === selectedDateRef.current) setDayData(refreshed);
    } catch (error) {
      console.warn('No se pudo reintentar la biografía:', error);
      if (date === selectedDateRef.current) setActionError('No se pudo consultar la biografía.');
    }
  };

  const playAudio = (sectionId: string, textToPlay: string) => {
    if (sectionId !== 'reflection' && dayData.readingsPending) return;
    if (currentPlayingSection === sectionId && isPlaying) {
      speechService.stop();
      setCurrentPlayingSection(null);
    } else {
      setCurrentPlayingSection(sectionId);
      speechService.speak(textToPlay, () => setCurrentPlayingSection(null));
    }
  };

  const handleSaveToNotes = async () => {
    if (!reflection) return;
    const note = {
      id: 'note_' + Date.now(),
      userId: user?.uid || 'guest',
      title: `Reflexión - ${currentCelebration.title}`,
      content: `${currentCelebration.gospel.citation}\n\n${reflection}`,
      date: dayData.date,
      createdAt: new Date().toISOString(),
    };
    try {
    await saveNote(user?.uid || 'guest', note);
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 3000);
    } catch (error) {
      console.error('Error al guardar reflexión:', error);
      setActionError('No se pudo confirmar el guardado de la nota.');
    }
  };

  const handleShare = async () => {
    const text = `🕊️ Liturgia - ${currentCelebration.title}\n\n📖 Evangelio (${currentCelebration.gospel.citation}):\n${currentCelebration.gospel.text}${reflection ? `\n\n✨ Reflexión:\n${reflection}` : ''}\n\nReza con Pan Vivo.`;
    if (navigator.share) {
      try {
        await navigator.share({ title: currentCelebration.title, text });
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.warn('No se pudo compartir:', error);
          setActionError('No se pudo compartir el contenido.');
        }
      }
    } else {
      try {
      await navigator.clipboard.writeText(text);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2500);
      } catch (error) {
        console.warn('No se pudo copiar:', error);
        setActionError('No se pudo copiar el contenido.');
      }
    }
  };

  return (
    <div id="liturgy-container" className="min-h-screen pb-36 text-slate-100">
      {actionError && <p role="alert" className="fixed top-5 left-4 right-4 z-[100] rounded-xl bg-slate-900 border border-amber-500 p-4 text-sm text-amber-200">{actionError}</p>}
      {/* Top Hero Banner with Sacred Light & Pan Vivo Brand */}
      <div className="theme-dark-surface relative h-60 w-full overflow-hidden bg-slate-950">
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
              disabled={selectedDate === '1583-01-01'}
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
              disabled={selectedDate === '9999-12-31'}
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
                min="1583-01-01"
                max="9999-12-31"
                value={selectedDate}
                onChange={(e) => {
                  if (isValidDateStr(e.target.value)) setSelectedDate(e.target.value);
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
                Consultando las fuentes...
              </span>
            )}
          </div>

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
            Reflexión
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

          <p className="reading-text text-slate-300 mt-2 leading-relaxed whitespace-pre-line">
            {dayData.saint.fullBio || dayData.saint.shortBio}
          </p>
          <SaintSource verification={dayData.saintVerification} onRetry={retryBiography} />

          <div className="mt-3 flex items-center justify-between text-[11px] text-amber-400/90 font-medium">
            <span>Toca para abrir biografía y oración</span>
            <span className="text-slate-500 text-[10px]">Abrir →</span>
          </div>
        </div>

        {/* 2. Card: Primera Lectura */}
        <div
          id="card-primera-lectura"
          className="theme-readable-surface bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 shadow-md transition-colors"
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
              disabled={!!dayData.readingsPending}
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
            className="reading-text text-slate-200 leading-relaxed font-serif whitespace-pre-line"
          >
            {currentCelebration.firstReading.text}
          </p>

          {!dayData.readingsPending && <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-serif italic">Palabra de Dios</span>
          </div>}
        </div>

        {/* 3. Card: Salmo Responsorial */}
        <div
          id="card-salmo-responsorial"
          className="theme-readable-surface bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 shadow-md transition-colors"
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
              disabled={!!dayData.readingsPending}
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
            <p className="reading-text text-amber-300 font-serif font-medium italic">
              R/. {currentCelebration.psalm.response}
            </p>
          </div>

          <div
            className="reading-text space-y-2 text-slate-300 leading-relaxed font-serif whitespace-pre-line"
          >
            {currentCelebration.psalm.verses.map((verse, i) => (
              <p key={i}>{verse}</p>
            ))}
          </div>

        </div>

        {/* 3b. Card: Segunda Lectura (Domingos y Solemnidades) */}
        {currentCelebration.secondReading && (
          <div
            id="card-segunda-lectura"
            className="theme-readable-surface bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 shadow-md transition-colors"
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
              className="reading-text text-slate-200 leading-relaxed font-serif whitespace-pre-line"
            >
              {currentCelebration.secondReading.text}
            </p>

            <div className="mt-2 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-serif italic">Palabra de Dios</span>
            </div>
          </div>
        )}

        {/* 4. Card: Santo Evangelio (Golden Accent) */}
        <div
          id="card-evangelio"
          className="theme-readable-surface relative bg-gradient-to-b from-amber-950/30 to-slate-900 border border-amber-500/30 rounded-2xl p-4 shadow-lg"
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
              disabled={!!dayData.readingsPending}
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

          <div className="reading-text text-slate-100 leading-relaxed font-serif space-y-2 border-l border-amber-500/20 pl-3">
            <p className="whitespace-pre-line">{currentCelebration.gospel.text}</p>
          </div>

          {!dayData.readingsPending && <div className="mt-3 pt-2 border-t border-amber-500/20 flex items-center justify-between text-[11px] text-amber-300/80 font-serif">
            <span>Palabra del Señor</span>
            <span className="font-semibold text-amber-200">Gloria a ti, Señor Jesús</span>
          </div>}
        </div>

        {/* Shared daily reflection */}
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
                  Reflexión
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                id="btn-reload-reflection"
                onClick={retryReflection}
                disabled={loadingReflection || syncingLiturgy}
                className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors disabled:opacity-50"
                title="Reintentar carga de la reflexión compartida"
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
                title="Escuchar reflexión"
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
                Generando una reflexión sobre las lecturas...
              </p>
            </div>
          ) : reflectionError ? (
            <div role="alert" className="text-sm text-amber-200 space-y-3">
              <p>{reflectionError}</p>
              <a href="https://www.vaticannews.va/es/evangelio-de-hoy.html" target="_blank" rel="noopener noreferrer" className="underline">
                Consultar el evangelio de hoy en Vatican News (no corresponde necesariamente a la fecha seleccionada)
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="reading-text text-slate-200 font-serif leading-relaxed whitespace-pre-line bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80">
                {reflection}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
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
                <p className="reading-text whitespace-pre-line">{dayData.saint.fullBio}</p>
                <SaintSource verification={dayData.saintVerification} onRetry={retryBiography} />
              </div>

              <div className="bg-amber-950/20 border border-amber-500/20 rounded-2xl p-4">
                <h4 className="font-serif font-bold text-amber-300 text-xs tracking-wide uppercase mb-1">
                  Oración de Intercesión
                </h4>
                <p className="reading-text font-serif italic text-slate-200 leading-relaxed">
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

    </div>
  );
};
