import React, { useState, useEffect } from 'react';
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
  X
} from 'lucide-react';
import {
  CATHOLIC_BOOKS,
  fetchChaptersForBook,
  fetchVersesForChapter,
  searchBible,
  type BibleBook,
  type BibleChapter,
  type BibleVerse
} from '../data/bible.ts';
import { speechService } from '../lib/speech.ts';
import { db } from '../lib/firebase.ts';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import type { User } from 'firebase/auth';

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

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Favorites
  const [favoriteVerses, setFavoriteVerses] = useState<Array<{ id: string; bookName: string; chapter: number; verse: number; text: string }>>([]);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);

  // Audio speech
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copyToast, setCopyToast] = useState<string | null>(null);

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
  }, [user]);

  const loadFavorites = async () => {
    if (!user) {
      const local = localStorage.getItem('lumen_fav_verses');
      if (local) setFavoriteVerses(JSON.parse(local));
      return;
    }
    try {
      const snap = await getDocs(collection(db, 'users', user.uid, 'favorites'));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
      setFavoriteVerses(list);
    } catch {
      const local = localStorage.getItem(`lumen_fav_verses_${user.uid}`);
      if (local) setFavoriteVerses(JSON.parse(local));
    }
  };

  const handleSelectBook = async (book: BibleBook) => {
    setSelectedBook(book);
    setSelectedChapter(null);
    setLoading(true);
    try {
      const chs = await fetchChaptersForBook(book.id);
      setChapters(chs);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChapter = async (chap: BibleChapter) => {
    setSelectedChapter(chap);
    setLoading(true);
    speechService.stop();
    try {
      const vss = await fetchVersesForChapter(chap.id, selectedBook?.nombre, chap.numero);
      setVerses(vss);
    } finally {
      setLoading(false);
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
    if (!selectedBook || !selectedChapter) return;
    const existing = favoriteVerses.find(
      (f) =>
        f.bookName === selectedBook.nombre &&
        f.chapter === selectedChapter.numero &&
        f.verse === verse.numero
    );

    if (existing) {
      // Remove
      const updated = favoriteVerses.filter((f) => f.id !== existing.id);
      setFavoriteVerses(updated);
      if (user) {
        try {
          await deleteDoc(doc(db, 'users', user.uid, 'favorites', existing.id));
        } catch {}
      }
      localStorage.setItem('lumen_fav_verses', JSON.stringify(updated));
    } else {
      // Add
      const newFav = {
        id: 'fav_' + Date.now(),
        userId: user?.uid || 'guest',
        bookName: selectedBook.nombre,
        chapter: selectedChapter.numero,
        verse: verse.numero,
        text: verse.texto,
        createdAt: new Date().toISOString(),
      };
      const updated = [newFav, ...favoriteVerses];
      setFavoriteVerses(updated);
      if (user) {
        try {
          const ref = await addDoc(collection(db, 'users', user.uid, 'favorites'), newFav);
          newFav.id = ref.id;
        } catch {}
      }
      localStorage.setItem('lumen_fav_verses', JSON.stringify(updated));
      showToast('Versículo guardado en tus favoritos');
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
    setSearching(true);
    try {
      const results = await searchBible(searchQuery);
      setSearchResults(results);
    } finally {
      setSearching(false);
    }
  };

  const showToast = (msg: string) => {
    setCopyToast(msg);
    setTimeout(() => setCopyToast(null), 2500);
  };

  const handleCopyVerse = (text: string, refText: string) => {
    navigator.clipboard.writeText(`«${text}» (${refText}) - Biblia de Jerusalén`);
    showToast('Versículo copiado');
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

  const filteredBooks = CATHOLIC_BOOKS.filter((b) => b.testamento === testament);

  // Group books by category
  const categories = Array.from(new Set(filteredBooks.map((b) => b.categoria)));

  return (
    <div id="bible-container" className="min-h-screen pb-28 text-slate-100">
      {copyToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-slate-950 font-semibold px-4 py-2 rounded-full text-xs shadow-xl flex items-center gap-2">
          <Check className="w-4 h-4" /> {copyToast}
        </div>
      )}

      {/* --- 1. Top Hero Section with Holy Cross & Linen (Image 3) --- */}
      {!selectedChapter && (
        <div className="relative h-56 w-full overflow-hidden bg-slate-950">
          <img
            src="https://images.unsplash.com/photo-1520697830682-bbb6e85e2b0b?auto=format&fit=crop&w=1000&q=80"
            alt="Cruz y Lienzo Sagrado"
            className="w-full h-full object-cover object-center opacity-30 brightness-75 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/60 to-transparent"></div>

          {/* Top toolbar */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full border border-amber-500/20 text-xs text-amber-300 font-serif">
              <span>Biblia de Jerusalén (Católica)</span>
            </div>

            <button
              onClick={() => setShowFavoritesModal(true)}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-900/80 backdrop-blur-md rounded-full border border-slate-700 text-xs text-slate-300 hover:text-amber-300 transition-colors"
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
          <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-3 rounded-2xl sticky top-2 z-30 backdrop-blur-md shadow-md">
            <button
              id="btn-back-to-books"
              onClick={() => setSelectedChapter(null)}
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-amber-400 font-medium py-1 px-2 rounded-lg hover:bg-slate-800"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Libros</span>
            </button>

            <div className="text-center">
              <h2 className="text-sm font-serif font-bold text-amber-300">
                {selectedBook.nombre} {selectedChapter.numero}
              </h2>
              <span className="text-[10px] text-slate-400">Biblia de Jerusalén</span>
            </div>

            <div className="flex items-center gap-1">
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
                title="Escuchar capítulo"
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Chapter Verses List */}
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin"></div>
              <p className="text-xs text-slate-400 font-serif">Cargando Sagradas Escrituras...</p>
            </div>
          ) : (
            <div
              className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xl space-y-3"
              style={{ fontSize: `${fontSize}px` }}
            >
              {verses.map((v) => {
                const fav = isVerseFavorite(v.numero);
                return (
                  <div
                    key={v.id || v.numero}
                    className="group relative flex items-start gap-3 py-1.5 hover:bg-slate-800/30 rounded-xl px-2 transition-colors"
                  >
                    <span className="text-[11px] font-bold text-amber-400/80 select-none shrink-0 w-6 text-right pt-0.5 font-mono">
                      {v.numero}
                    </span>

                    <p className="flex-1 text-slate-200 leading-relaxed font-serif tracking-normal">
                      {v.texto}
                    </p>

                    {/* Quick actions on hover / mobile tap */}
                    <div className="shrink-0 flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleToggleFavorite(v)}
                        className={`p-1 rounded hover:bg-slate-800 transition-colors ${
                          fav ? 'text-amber-400' : 'text-slate-500 hover:text-amber-400'
                        }`}
                        title={fav ? 'Quitar favorito' : 'Marcar versículo favorito'}
                      >
                        {fav ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() =>
                          handleCopyVerse(v.texto, `${selectedBook.nombre} ${selectedChapter.numero}:${v.numero}`)
                        }
                        className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                        title="Copiar versículo"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Chapter Navigation footer */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handlePrevChapter}
              disabled={selectedChapter.numero <= 1}
              className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-slate-300 hover:text-white disabled:opacity-40 transition-colors"
            >
              ← Cap. {selectedChapter.numero - 1}
            </button>

            <span className="text-xs text-slate-400 font-serif">
              Capítulo {selectedChapter.numero} de {selectedBook.capitulosTotales}
            </span>

            <button
              onClick={handleNextChapter}
              disabled={selectedChapter.numero >= selectedBook.capitulosTotales}
              className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-slate-300 hover:text-white disabled:opacity-40 transition-colors"
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
                setSelectedBook(null);
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
                setSelectedBook(null);
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
              onChange={(e) => setSearchQuery(e.target.value)}
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
                    <p className="text-slate-300 font-serif leading-relaxed">«{r.texto}»</p>
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[75vh] flex flex-col shadow-2xl p-5 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-base font-serif font-bold text-amber-300">
                  {selectedBook.nombre}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedBook.capitulosTotales} Capítulos • Selecciona uno
                </p>
              </div>
              <button
                onClick={() => setSelectedBook(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-5 gap-2.5">
                {chapters.map((chap) => (
                  <button
                    key={chap.id}
                    id={`btn-chapter-${chap.numero}`}
                    onClick={() => handleSelectChapter(chap)}
                    className="h-12 rounded-xl bg-slate-800/80 hover:bg-amber-500 hover:text-slate-950 border border-slate-700/60 font-serif font-bold text-sm text-slate-200 transition-all flex items-center justify-center active:scale-95 shadow-sm"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full max-h-[80vh] flex flex-col shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-serif font-bold text-amber-300">
                  Versículos Favoritos Guardados
                </h3>
              </div>
              <button
                onClick={() => setShowFavoritesModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {favoriteVerses.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Aún no has marcado ningún versículo como favorito. Al leer un capítulo, toca el
                  ícono del marcador en cualquier versículo para guardarlo aquí.
                </div>
              ) : (
                favoriteVerses.map((fav) => (
                  <div
                    key={fav.id}
                    className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-400 font-serif">
                        {fav.bookName} {fav.chapter}:{fav.verse}
                      </span>
                      <button
                        onClick={() =>
                          handleCopyVerse(fav.text, `${fav.bookName} ${fav.chapter}:${fav.verse}`)
                        }
                        className="text-slate-500 hover:text-slate-200"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-slate-200 font-serif leading-relaxed">«{fav.text}»</p>
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
