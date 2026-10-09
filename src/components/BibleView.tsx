import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  BookOpen,
  ArrowLeft,
  ChevronRight,
  Bookmark,
  BookmarkCheck,
  Volume2,
  VolumeX,
  Share2,
  Copy,
  Check,
  Type,
  X,
  AlignLeft,
  List
} from 'lucide-react';
import {
  CATHOLIC_BOOKS,
  fetchChaptersForBook,
  fetchVersesForChapter,
  searchBible,
  type BibleBook,
  type BibleChapter,
  type BibleVerse,
  type BibleSearchResult
} from '../data/bible.ts';
import { speechService } from '../lib/speech.ts';
import { db } from '../lib/firebase.ts';
import { collection, setDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { readStoredJson, writeStorage } from '../lib/storage.ts';
import { withTimeout } from '../lib/asyncUtils.ts';

type SavedVerse = { id: string; bookName: string; chapter: number; verse: number; text: string };
function isSavedVerse(value: unknown): value is SavedVerse {
  return !!value && typeof value === 'object' && 'id' in value && typeof value.id === 'string'
    && 'bookName' in value && typeof value.bookName === 'string'
    && 'chapter' in value && typeof value.chapter === 'number'
    && 'verse' in value && typeof value.verse === 'number'
    && 'text' in value && typeof value.text === 'string';
}

interface BibleViewProps {
  user: User | null;
  fontSize: number;
  onUpdateFontSize: (size: number) => void;
}

export const BibleView: React.FC<BibleViewProps> = ({ user, fontSize, onUpdateFontSize }) => {
  const [testament, setTestament] = useState<'NT' | 'AT'>('NT');
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [chapters, setChapters] = useState<BibleChapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<BibleChapter | null>(null);
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(false);
  const [readingLayout, setReadingLayout] = useState<'continuous' | 'list'>('continuous');
  const [selectedVerseNumber, setSelectedVerseNumber] = useState<number | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BibleSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Favorites
  const [favoriteVerses, setFavoriteVerses] = useState<SavedVerse[]>([]);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);

  // Audio speech
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const readingVersion = useRef(0);
  const searchVersion = useRef(0);
  const favoritesVersion = useRef(0);
  const favoriteSaving = useRef(false);
  useEffect(() => () => {
    readingVersion.current += 1;
    searchVersion.current += 1;
    favoritesVersion.current += 1;
  }, []);

  useEffect(() => {
    const unsub = speechService.subscribe(setIsSpeaking);
    return () => {
      unsub();
      speechService.stop();
    };
  }, []);

  // Load user favorites from firestore or local
  useEffect(() => {
    loadFavorites();
    return () => { favoritesVersion.current += 1; };
  }, [user]);

  const loadFavorites = async () => {
    const version = ++favoritesVersion.current;
    setFavoriteVerses([]);
    const key = user ? `lumen_fav_verses_${user.uid}` : 'lumen_fav_verses_guest';
    const local = () => readStoredJson(key, (v): v is SavedVerse[] => Array.isArray(v) && v.every(isSavedVerse)) || [];
    if (!user) {
      const saved = readStoredJson(key, (v): v is SavedVerse[] => Array.isArray(v) && v.every(isSavedVerse));
      if (saved !== null) setFavoriteVerses(saved);
      else {
        const legacy = readStoredJson('lumen_fav_verses', (v): v is SavedVerse[] =>
          Array.isArray(v) && v.every(isSavedVerse)) || [];
        // The legacy shared key can contain account data: migrate only explicit guests.
        const guests = legacy.filter(v => 'userId' in v && v.userId === 'guest');
        setFavoriteVerses(guests);
        writeStorage(key, JSON.stringify(guests));
      }
      return;
    }
    try {
      const snap = await withTimeout(getDocs(collection(db, 'users', user.uid, 'favorites')));
      const list = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
      if (!list.every(isSavedVerse)) throw new Error('Favoritos inválidos.');
      if (version !== favoritesVersion.current) return;
      setFavoriteVerses(list);
      writeStorage(key, JSON.stringify(list));
    } catch (error) {
      console.warn('No se pudieron sincronizar favoritos:', error);
      if (version === favoritesVersion.current) {
        setFavoriteVerses(local());
        showToast('Favoritos locales: no se pudo sincronizar con tu cuenta.');
      }
    }
  };

  const handleSelectBook = async (book: BibleBook) => {
    const version = ++readingVersion.current;
    setLoadError(null);
    setChapters([]);
    setVerses([]);
    speechService.stop();
    setSelectedBook(book);
    setSelectedChapter(null);
    setLoading(true);
    try {
      const chs = await fetchChaptersForBook(book.id);
      if (version === readingVersion.current) setChapters(chs);
    } catch (error) {
      console.warn('Libro no disponible:', error);
      if (version === readingVersion.current) setLoadError('No se pudo cargar el libro.');
    } finally {
      if (version === readingVersion.current) setLoading(false);
    }
  };

  const handleSelectChapter = async (chap: BibleChapter) => {
    const version = ++readingVersion.current;
    setLoadError(null);
    setVerses([]);
    setSelectedChapter(chap);
    setSelectedVerseNumber(null);
    setLoading(true);
    speechService.stop();
    try {
      const vss = await fetchVersesForChapter(chap.id, selectedBook?.nombre, chap.numero);
      if (version === readingVersion.current) setVerses(vss);
    } catch (error) {
      console.warn('Capítulo no disponible:', error);
      if (version === readingVersion.current) setLoadError('No se pudo cargar el capítulo. Selecciónalo de nuevo para reintentar.');
    } finally {
      if (version === readingVersion.current) setLoading(false);
    }
  };

  const handlePrevChapter = () => {
    if (!selectedChapter || selectedChapter.numero <= 1) return;
    const prev = chapters.find((c) => c.numero === selectedChapter.numero - 1);
    if (prev) handleSelectChapter(prev);
  };

  const handleNextChapter = () => {
    if (!selectedChapter) return;
    const next = chapters.find((c) => c.numero === selectedChapter.numero + 1);
    if (next) handleSelectChapter(next);
  };

  const handleToggleFavorite = async (verse: BibleVerse) => {
    if (!selectedBook || !selectedChapter || favoriteSaving.current) return;
    favoriteSaving.current = true;
    const version = favoritesVersion.current;
    const key = user ? `lumen_fav_verses_${user.uid}` : 'lumen_fav_verses_guest';
    try {
    const existing = favoriteVerses.find(
      (f) =>
        f.bookName === selectedBook.nombre &&
        f.chapter === selectedChapter.numero &&
        f.verse === verse.numero
    );

    if (existing) {
      // Remove
      const updated = favoriteVerses.filter((f) => f.id !== existing.id);
      if (user) {
        await withTimeout(deleteDoc(doc(db, 'users', user.uid, 'favorites', existing.id)));
      }
      if (!writeStorage(key, JSON.stringify(updated)) && !user) throw new Error('Almacenamiento no disponible.');
      if (version === favoritesVersion.current) setFavoriteVerses(updated);
    } else {
      // Add
      const newFav = {
        id: `verse_${selectedBook.id}_${selectedChapter.numero}_${verse.numero}`,
        userId: user?.uid || 'guest',
        bookName: selectedBook.nombre,
        chapter: selectedChapter.numero,
        verse: verse.numero,
        text: verse.texto,
        createdAt: new Date().toISOString(),
      };
      const updated = [newFav, ...favoriteVerses];
      if (user) {
        await withTimeout(setDoc(doc(db, 'users', user.uid, 'favorites', newFav.id), newFav));
      }
      if (!writeStorage(key, JSON.stringify(updated)) && !user) throw new Error('Almacenamiento no disponible.');
      if (version === favoritesVersion.current) {
        setFavoriteVerses(updated);
        showToast('Versículo guardado en tus favoritos');
      }
    }
    } catch (error) {
      console.error('Error al guardar favorito:', error);
      if (version === favoritesVersion.current) showToast('No se pudo guardar el cambio de favoritos.');
    } finally {
      favoriteSaving.current = false;
    }
  };

  const isVerseFavorite = (verseNum: number) => {
    return favoriteVerses.some(
      (f) =>
        f.bookName === selectedBook?.nombre &&
        f.chapter === selectedChapter?.numero &&
        f.verse === verseNum
    );
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const version = ++searchVersion.current;
    setLoadError(null);
    setSearchResults([]);
    setSearching(true);
    try {
      const results = await searchBible(searchQuery);
      if (version === searchVersion.current) setSearchResults(results);
    } catch (error) {
      console.warn('Búsqueda no disponible:', error);
      if (version === searchVersion.current) setLoadError('La búsqueda bíblica no está disponible. Reintenta más tarde.');
    } finally {
      if (version === searchVersion.current) setSearching(false);
    }
  };

  const showToast = (msg: string) => {
    setCopyToast(msg);
    setTimeout(() => setCopyToast(null), 2500);
  };

  const handleCopyVerse = async (text: string, refText: string) => {
    try {
      await navigator.clipboard.writeText(`«${text}» (${refText}) - Biblia de Jerusalén`);
      showToast('Versículo copiado');
    } catch (error) {
      console.warn('No se pudo copiar:', error);
      showToast('No se pudo copiar el versículo.');
    }
  };

  const handleSpeakChapter = () => {
    if (isSpeaking) {
      speechService.stop();
    } else {
      const text = `${selectedBook?.nombre}, capítulo ${selectedChapter?.numero}. ` +
        verses.map((v) => `${v.numero}. ${v.texto}`).join(' ');
      speechService.speak(text);
    }
  };

  const leaveBook = () => {
    readingVersion.current += 1;
    speechService.stop();
    setLoading(false);
    setLoadError(null);
    setSelectedBook(null);
    setSelectedChapter(null);
    setVerses([]);
  };

  const filteredBooks = CATHOLIC_BOOKS.filter((b) => b.testamento === testament);

  // Group books by category
  const categories = Array.from(new Set(filteredBooks.map((b) => b.categoria)));

  return (
    <div id="bible-container" className="min-h-screen pb-28 text-slate-100">
      {loadError && <p role="alert" className="p-4 text-sm text-amber-200">{loadError}</p>}
      {copyToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-slate-950 font-semibold px-4 py-2 rounded-full text-xs shadow-xl flex items-center gap-2">
          <Check className="w-4 h-4" /> {copyToast}
        </div>
      )}

      {/* --- 1. Top Hero Section with Holy Cross & Linen --- */}
      {!selectedChapter && (
        <div className="theme-dark-surface relative h-56 w-full overflow-hidden bg-slate-950">
          <div className="absolute inset-0 bg-gradient-to-b from-[#1c130b] via-[#140e08] to-[#0c0805]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.28),rgba(255,255,255,0))]"></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[440px] h-[200px] bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>

          {/* Top toolbar */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#17100a]/80 backdrop-blur-md rounded-full border border-amber-500/30 text-xs text-amber-300 font-serif shadow-md">
              <span>Biblia de Jerusalén (Católica)</span>
            </div>

            <button
              onClick={() => setShowFavoritesModal(true)}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#17100a]/80 backdrop-blur-md rounded-full border border-amber-900/40 text-xs text-slate-300 hover:text-amber-300 transition-colors shadow-md"
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-400" />
              <span>Favoritos ({favoriteVerses.length})</span>
            </button>
          </div>

          <div className="absolute bottom-4 left-4 right-4 text-center">
            <h1 className="text-2xl font-serif font-bold text-white tracking-tight drop-shadow-md">
              {testament === 'NT' ? 'Nuevo Testamento' : 'Antiguo Testamento'}
            </h1>
            <p className="text-xs text-amber-300/90 font-medium mt-1 flex items-center justify-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              {testament === 'NT' ? '27 Libros Canónicos' : '46 Libros Canónicos (73 en total)'}
            </p>
          </div>
        </div>
      )}

      {/* --- Reading View (Chapter Active) --- */}
      {selectedChapter && selectedBook ? (
        <div className="px-4 py-4 max-w-xl mx-auto space-y-4">
          {/* Header toolbar for Chapter reading */}
          <div className="flex items-center justify-between bg-[#140e09]/90 border border-amber-950/60 p-3 rounded-2xl sticky top-2 z-30 backdrop-blur-md shadow-lg">
            <button
              id="btn-back-to-books"
              onClick={() => {
                readingVersion.current += 1;
                speechService.stop();
                setLoading(false);
                setLoadError(null);
                setSelectedChapter(null);
                setSelectedVerseNumber(null);
              }}
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-amber-400 font-medium py-1 px-2 rounded-lg hover:bg-amber-950/40"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Libros</span>
            </button>

            <div className="text-center">
              <h2 className="text-sm font-serif font-bold text-amber-300">
                {selectedBook.nombre} {selectedChapter.numero}
              </h2>
              <span className="text-[10px] text-amber-200/60 font-serif">Biblia de Jerusalén</span>
            </div>

            <div className="flex items-center gap-1">
              {/* Toggle Continuous / List Layout */}
              <button
                onClick={() => setReadingLayout(readingLayout === 'continuous' ? 'list' : 'continuous')}
                className={`p-1.5 rounded-lg transition-colors ${
                  readingLayout === 'continuous'
                    ? 'text-amber-400 bg-amber-500/15 border border-amber-500/30'
                    : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800'
                }`}
                title={readingLayout === 'continuous' ? 'Modo Texto Continuo activo (toca para ver en lista)' : 'Modo Lista activo (toca para ver texto corrido)'}
              >
                {readingLayout === 'continuous' ? <AlignLeft className="w-4 h-4" /> : <List className="w-4 h-4" />}
              </button>

              {/* Font size button */}
              <button
                onClick={() => onUpdateFontSize(fontSize >= 26 ? 16 : fontSize + 2)}
                className="p-1.5 text-slate-400 hover:text-amber-300 rounded-lg hover:bg-slate-800"
                title={`Tamaño fuente: ${fontSize}px`}
              >
                <Type className="w-4 h-4" />
              </button>

              {/* Audio Listen */}
              <button
                onClick={handleSpeakChapter}
                className={`p-1.5 rounded-lg transition-colors ${
                  isSpeaking
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800'
                }`}
                title="Escuchar capítulo completo"
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Chapter Verses Section */}
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin"></div>
              <p className="text-xs text-slate-400 font-serif">Cargando Sagradas Escrituras...</p>
            </div>
          ) : readingLayout === 'continuous' ? (
            /* --- Continuous Prose Reading Mode (Versículos Seguidos / Texto Corrido) --- */
            <div
              className="bg-[#140e09]/80 border border-amber-950/60 rounded-2xl p-4 sm:p-6 shadow-xl"
              style={{ fontSize: `${fontSize}px` }}
            >
              <div className="leading-[1.65] text-[#ece4d8] font-serif tracking-normal text-left select-text">
                {verses.map((v) => {
                  const isSelected = selectedVerseNumber === v.numero;
                  const fav = isVerseFavorite(v.numero);
                  return (
                    <span
                      key={v.id || v.numero}
                      onClick={() => setSelectedVerseNumber(isSelected ? null : v.numero)}
                      className={`cursor-pointer transition-colors duration-150 rounded px-0.5 py-0.5 inline ${
                        isSelected
                          ? 'bg-amber-500/25 text-amber-100 ring-1 ring-amber-400/60 font-medium'
                          : fav
                          ? 'bg-amber-950/40 text-amber-200 border-b border-amber-500/50'
                          : 'hover:bg-amber-500/15'
                      }`}
                      title={`Versículo ${v.numero} • Toca para opciones`}
                    >
                      <sup className="font-sans font-bold text-amber-400 text-[0.68em] mr-1 ml-0.5 select-none align-baseline relative -top-1">
                        {v.numero}
                      </sup>
                      <span>{v.texto}</span>{' '}
                    </span>
                  );
                })}
              </div>
            </div>
          ) : (
            /* --- Compact List Mode --- */
            <div
              className="bg-[#140e09]/80 border border-amber-950/60 rounded-3xl p-4 sm:p-5 shadow-xl space-y-2"
              style={{ fontSize: `${fontSize}px` }}
            >
              {verses.map((v) => {
                const isSelected = selectedVerseNumber === v.numero;
                const fav = isVerseFavorite(v.numero);
                return (
                  <div
                    key={v.id || v.numero}
                    onClick={() => setSelectedVerseNumber(isSelected ? null : v.numero)}
                    className={`flex items-start gap-2.5 py-1.5 px-2.5 rounded-xl border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500/50'
                        : fav
                        ? 'bg-[#17110b] border-amber-900/40'
                        : 'bg-transparent hover:bg-amber-950/20 border-transparent hover:border-amber-950/40'
                    }`}
                  >
                    <span className="text-[11px] font-mono font-bold text-amber-400 select-none shrink-0 w-6 pt-0.5 text-right">
                      {v.numero}
                    </span>
                    <p className="flex-1 text-[#ece4d8] font-serif leading-relaxed">
                      {v.texto}
                    </p>
                    <div className="shrink-0 flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(v);
                        }}
                        className={`p-1 rounded hover:bg-slate-800 transition-colors ${
                          fav ? 'text-amber-400' : 'text-slate-500 hover:text-amber-400'
                        }`}
                        title={fav ? 'Quitar favorito' : 'Marcar versículo favorito'}
                      >
                        {fav ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyVerse(v.texto, `${selectedBook.nombre} ${selectedChapter.numero}:${v.numero}`);
                        }}
                        className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                        title="Copiar versículo"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Floating Action Pill for selected verse */}
          {selectedVerseNumber !== null && (() => {
            const activeVerse = verses.find((v) => v.numero === selectedVerseNumber);
            if (!activeVerse) return null;
            const fav = isVerseFavorite(activeVerse.numero);
            return (
              <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 max-w-sm w-[92%] bg-[#17110b]/95 backdrop-blur-md border border-amber-500/40 rounded-2xl shadow-2xl p-2.5 flex items-center justify-between text-xs animate-fade-in">
                <div className="flex items-center gap-2 pl-1 truncate">
                  <span className="font-serif font-bold text-amber-300">
                    {selectedBook.nombre} {selectedChapter.numero}:{activeVerse.numero}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleToggleFavorite(activeVerse)}
                    className={`px-2.5 py-1 rounded-xl flex items-center gap-1 font-medium transition-colors ${
                      fav
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 border border-amber-800/40'
                    }`}
                  >
                    {fav ? (
                      <BookmarkCheck className="w-3.5 h-3.5" />
                    ) : (
                      <Bookmark className="w-3.5 h-3.5" />
                    )}
                    <span>{fav ? 'Favorito' : 'Guardar'}</span>
                  </button>

                  <button
                    onClick={() =>
                      handleCopyVerse(
                        activeVerse.texto,
                        `${selectedBook.nombre} ${selectedChapter.numero}:${activeVerse.numero}`
                      )
                    }
                    className="p-1.5 rounded-xl bg-[#221810] hover:bg-[#2e2016] text-slate-300 hover:text-white border border-amber-900/30"
                    title="Copiar versículo"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      speechService.speak(
                        `${selectedBook.nombre}, capítulo ${selectedChapter.numero}, versículo ${activeVerse.numero}. ${activeVerse.texto}`
                      );
                    }}
                    className="p-1.5 rounded-xl bg-[#221810] hover:bg-[#2e2016] text-slate-300 hover:text-amber-300 border border-amber-900/30"
                    title="Escuchar este versículo"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setSelectedVerseNumber(null)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 ml-0.5"
                    title="Cerrar selección"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Chapter Navigation footer */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handlePrevChapter}
              disabled={selectedChapter.numero <= 1}
              className="px-4 py-2 bg-[#140e09] border border-amber-950/60 rounded-xl text-xs font-medium text-slate-300 hover:text-white disabled:opacity-40 transition-colors"
            >
              ← Cap. {selectedChapter.numero - 1}
            </button>

            <span className="text-xs text-amber-200/70 font-serif">
              Capítulo {selectedChapter.numero} de {selectedBook.capitulosTotales}
            </span>

            <button
              onClick={handleNextChapter}
              disabled={selectedChapter.numero >= selectedBook.capitulosTotales}
              className="px-4 py-2 bg-[#140e09] border border-amber-950/60 rounded-xl text-xs font-medium text-slate-300 hover:text-white disabled:opacity-40 transition-colors"
            >
              Cap. {selectedChapter.numero + 1} →
            </button>
          </div>
        </div>
      ) : (
        /* --- Catalog & Search View --- */
        <div className="px-4 py-4 max-w-xl mx-auto space-y-4">
          {/* Testament Selector Toggle Pills */}
          <div className="grid grid-cols-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
            <button
              id="tab-nuevo-testamento"
              onClick={() => {
                setTestament('NT');
                leaveBook();
              }}
              className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                testament === 'NT'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Nuevo Testamento (27)
            </button>
            <button
              id="tab-antiguo-testamento"
              onClick={() => {
                setTestament('AT');
                leaveBook();
              }}
              className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                testament === 'AT'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Antiguo Testamento (46)
            </button>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                searchVersion.current += 1;
                setSearching(false);
                setSearchResults([]);
                setSearchQuery(e.target.value);
              }}
              placeholder="Buscar en la Biblia católica (ej: amor, fe, perdón)..."
              className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl pl-10 pr-24 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400/80"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <button
              type="submit"
              disabled={searching}
              className="absolute right-2 top-1.5 bottom-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {searching ? 'Buscando...' : 'Buscar'}
            </button>
          </form>

          {/* Search Results if any */}
          {searchResults.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-amber-300">
                  Resultados para: «{searchQuery}» ({searchResults.length})
                </span>
                <button
                  onClick={() => setSearchResults([])}
                  className="text-[11px] text-slate-500 hover:text-white"
                >
                  Limpiar
                </button>
              </div>

              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {searchResults.map((r, i) => (
                  <div
                    key={i}
                    className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-400">
                        {r.libro} {r.capitulo}:{r.numero}
                      </span>
                      <button
                        onClick={() => handleCopyVerse(r.texto, `${r.libro} ${r.capitulo}:${r.numero}`)}
                        className="text-slate-500 hover:text-white p-1"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="reading-text text-slate-300 font-serif leading-relaxed">«{r.texto}»</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Categorized Books Grid (Image 3) */}
          <div className="space-y-5">
            {categories.map((cat) => {
              const catBooks = filteredBooks.filter((b) => b.categoria === cat);
              return (
                <div key={cat} className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-300/90 tracking-wide uppercase px-1">
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span>{cat}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {catBooks.map((book) => (
                      <button
                        key={book.id}
                        id={`btn-book-${book.abrev}`}
                        onClick={() => handleSelectBook(book)}
                        className={`p-3.5 rounded-2xl border text-left transition-all duration-200 group flex flex-col justify-between h-20 ${
                          selectedBook?.id === book.id
                            ? 'bg-amber-950/40 border-amber-500 shadow-md ring-1 ring-amber-500/30'
                            : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-base font-bold text-amber-300 font-serif tracking-tight">
                          {book.abrev}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-200 group-hover:text-white truncate">
                            {book.nombre}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {book.capitulosTotales} c.
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Chapter Selection Drawer / Modal */}
      {selectedBook && !selectedChapter && (
        <div
          onClick={leaveBook}
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#17110b] border border-amber-950/60 rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[85vh] sm:max-h-[80vh] flex flex-col shadow-2xl p-5 overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-amber-950/60 pb-3 mb-4 shrink-0">
              <div>
                <h3 className="text-base font-serif font-bold text-amber-300">
                  {selectedBook.nombre}
                </h3>
                <p className="text-xs text-amber-200/60">
                  {selectedBook.capitulosTotales} Capítulos • Selecciona uno
                </p>
              </div>
              <button
                onClick={leaveBook}
                className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-[#221810]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1.5 pb-24 overscroll-contain touch-pan-y">
              <div className="grid grid-cols-5 gap-2.5">
                {chapters.map((chap) => (
                  <button
                    key={chap.id}
                    id={`btn-chapter-${chap.numero}`}
                    onClick={() => handleSelectChapter(chap)}
                    className="h-12 rounded-xl bg-[#221810] hover:bg-amber-500 hover:text-slate-950 border border-amber-900/40 font-serif font-bold text-sm text-amber-100 transition-all flex items-center justify-center active:scale-95 shadow-sm"
                  >
                    {chap.numero}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Favorites Modal */}
      {showFavoritesModal && (
        <div
          onClick={() => setShowFavoritesModal(false)}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#17110b] border border-amber-950/60 rounded-3xl max-w-lg w-full max-h-[80vh] flex flex-col shadow-2xl p-6 overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-amber-950/60 pb-3 mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-serif font-bold text-amber-300">
                  Versículos Favoritos Guardados
                </h3>
              </div>
              <button
                onClick={() => setShowFavoritesModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-[#221810]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-4">
              {favoriteVerses.length === 0 ? (
                <div className="py-12 text-center text-amber-200/50 text-xs font-serif">
                  Aún no has marcado ningún versículo como favorito. Al leer un capítulo, toca cualquier versículo para guardarlo aquí.
                </div>
              ) : (
                favoriteVerses.map((fav) => (
                  <div
                    key={fav.id}
                    className="p-3.5 bg-[#140e09] border border-amber-950/60 rounded-2xl text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-400 font-serif">
                        {fav.bookName} {fav.chapter}:{fav.verse}
                      </span>
                      <button
                        onClick={() =>
                          handleCopyVerse(fav.text, `${fav.bookName} ${fav.chapter}:${fav.verse}`)
                        }
                        className="text-slate-500 hover:text-amber-300 transition-colors p-1"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="reading-text text-[#ece4d8] font-serif leading-relaxed">«{fav.text}»</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
