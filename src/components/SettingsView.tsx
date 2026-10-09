import React, { useState } from 'react';
import {
  Sliders,
  Sparkles,
  Volume2,
  Trash2,
  Moon,
  Sun,
  Info,
  Check,
  Smartphone,
  Download,
  CheckCircle2,
  Share,
  PlusSquare
} from 'lucide-react';
import { usePWAInstall } from '../lib/usePWAInstall.ts';

interface SettingsViewProps {
  fontSize: number;
  onUpdateFontSize: (size: number) => void;
  audioEnabled: boolean;
  onUpdateAudioEnabled: (val: boolean) => void;
  darkMode?: boolean;
  onUpdateDarkMode?: (val: boolean) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  fontSize,
  onUpdateFontSize,
  audioEnabled,
  onUpdateAudioEnabled,
  darkMode = true,
  onUpdateDarkMode,
}) => {
  const [clearedNotice, setClearedNotice] = useState<string | null>(null);
  const { isInstalled, isInstallable, isIOS, install } = usePWAInstall();
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  const handleClearBibleCache = () => {
    try {
    let count = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('lumen_bible_cap_')) {
        count++;
      }
    }
    // remove all bible cache
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith('lumen_bible_cap_')) localStorage.removeItem(k);
    });
    setClearedNotice(`Se limpiaron ${count} capítulos almacenados en caché local.`);
    setTimeout(() => setClearedNotice(null), 3500);
    } catch (error) {
      console.warn('No se pudo limpiar la caché:', error);
      setClearedNotice('No se pudo limpiar la caché local.');
    }
  };

  return (
    <div id="settings-view-container" className={`min-h-screen pb-28 transition-colors duration-300 ${darkMode ? 'text-slate-100' : 'text-stone-800'}`}>
      {clearedNotice && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-slate-950 font-semibold px-4 py-2 rounded-full text-xs shadow-xl flex items-center gap-2">
          <Check className="w-4 h-4" /> {clearedNotice}
        </div>
      )}

      {/* Header */}
      <div className="px-4 pt-6 pb-2 max-w-xl mx-auto">
        <h1 className={`text-2xl font-serif font-bold tracking-tight ${darkMode ? 'text-white' : 'text-stone-900'}`}>Ajustes</h1>
        <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-stone-600'}`}>
          Lectura, accesibilidad y preferencias
        </p>
      </div>

      <div className="px-4 py-3 max-w-xl mx-auto space-y-4">
        {/* Sagrada Biblia */}
        <div className={`border rounded-3xl p-5 shadow-md space-y-4 transition-colors duration-300 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-stone-200'
        }`}>
          <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${
            darkMode ? 'text-amber-300' : 'text-amber-700'
          }`}>
            <Sliders className="w-4 h-4 text-amber-500" />
            <span>Sagrada Biblia Católica</span>
          </div>

          {/* Font Size Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium ${darkMode ? 'text-slate-200' : 'text-stone-800'}`}>Tamaño de Fuente</span>
              <span className="text-xs font-mono text-amber-500 font-bold">{fontSize} px</span>
            </div>

            <input
              type="range"
              min="14"
              max="28"
              step="1"
              value={fontSize}
              onChange={(e) => onUpdateFontSize(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />

            <p
              className={`p-3 rounded-xl border font-serif leading-relaxed ${
                darkMode ? 'bg-slate-950/60 border-slate-800/80 text-slate-300' : 'bg-stone-50 border-stone-200 text-stone-700'
              }`}
              style={{ fontSize: `${fontSize}px` }}
            >
              «En el principio existía la Palabra y la Palabra estaba con Dios.» (Jn 1,1)
            </p>
          </div>

          {/* Clear Cache */}
          <div className={`pt-2 border-t flex items-center justify-between ${
            darkMode ? 'border-slate-800' : 'border-stone-200'
          }`}>
            <div>
              <span className={`text-xs font-medium block ${darkMode ? 'text-slate-200' : 'text-stone-800'}`}>Caché de la Biblia</span>
              <span className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-stone-500'}`}>Libera espacio de capítulos descargados</span>
            </div>

            <button
              onClick={handleClearBibleCache}
              className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors ${
                darkMode
                  ? 'bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpiar Caché</span>
            </button>
          </div>
        </div>

        {/* Oración y asistencia */}
        <div className={`border rounded-3xl p-5 shadow-md space-y-4 transition-colors duration-300 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-stone-200'
        }`}>
          <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${
            darkMode ? 'text-amber-300' : 'text-amber-700'
          }`}>
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Oración y Asistencia</span>
          </div>

          {/* Audio toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Volume2 className={`w-4 h-4 ${darkMode ? 'text-slate-400' : 'text-stone-500'}`} />
              <div>
                <span className={`text-xs font-medium block ${darkMode ? 'text-slate-200' : 'text-stone-800'}`}>Voz Asistida (TTS)</span>
                <span className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-stone-500'}`}>Lectura solemne en español</span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={audioEnabled}
                onChange={(e) => onUpdateAudioEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>
        </div>

        {/* Instalación en dispositivo */}
        <div className={`border rounded-3xl p-5 shadow-md space-y-3 transition-colors duration-300 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-stone-200'
        }`}>
          <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${
            darkMode ? 'text-amber-300' : 'text-amber-700'
          }`}>
            <Smartphone className="w-4 h-4 text-amber-500" />
            <span>Instalación en Dispositivo</span>
          </div>

          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <span className={`text-xs font-medium block ${darkMode ? 'text-slate-200' : 'text-stone-800'}`}>
                {isInstalled ? 'Aplicación Instalada' : 'Instalar Pan Vivo'}
              </span>
              <span className={`text-[11px] block mt-0.5 ${darkMode ? 'text-slate-400' : 'text-stone-500'}`}>
                {isInstalled
                  ? 'Pan Vivo está activo como aplicación en tu pantalla de inicio.'
                  : 'Añade el icono a tu pantalla de inicio para rezar sin barras del navegador.'}
              </span>
            </div>

            {isInstalled ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold shrink-0">
                <CheckCircle2 className="w-4 h-4" />
                <span>Instalada</span>
              </div>
            ) : isInstallable ? (
              <button
                onClick={() => install()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Instalar</span>
              </button>
            ) : isIOS ? (
              <button
                onClick={() => setShowIOSInstructions(!showIOSInstructions)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-all shrink-0"
              >
                <Share className="w-3.5 h-3.5" />
                <span>Cómo instalar</span>
              </button>
            ) : (
              <button
                onClick={() => setShowIOSInstructions(!showIOSInstructions)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-all shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Instrucciones</span>
              </button>
            )}
          </div>

          {showIOSInstructions && (
            <div className={`mt-3 pt-3 border-t text-xs space-y-2 font-sans ${
              darkMode ? 'border-slate-800 text-slate-300' : 'border-stone-200 text-stone-700'
            }`}>
              <p className="font-semibold text-amber-400">Pasos para instalar:</p>
              <div className="space-y-1.5 text-[11px]">
                <p className="flex items-center gap-1.5">
                  <Share className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>1. En Safari o Chrome, pulsa el botón <strong>Compartir</strong> o el menú de tres puntos (⋮).</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <PlusSquare className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>2. Selecciona <strong>«Añadir a pantalla de inicio»</strong> o <strong>«Instalar aplicación»</strong>.</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* --- 6. Apariencia & Acerca de --- */}
        <div className={`border rounded-3xl p-5 shadow-md space-y-3 transition-colors duration-300 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-stone-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {darkMode ? (
                <Moon className="w-4 h-4 text-amber-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
              <div>
                <span className={`text-xs font-medium block ${darkMode ? 'text-slate-200' : 'text-stone-800'}`}>
                  {darkMode ? 'Modo Oscuro Místico' : 'Modo Claro Cálido'}
                </span>
                <span className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-stone-500'}`}>
                  {darkMode
                    ? 'Tonalidad nocturna para la contemplación'
                    : 'Luz natural inspirada en pergamino sagrado'}
                </span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                id="toggle-dark-mode"
                type="checkbox"
                checked={darkMode}
                onChange={(e) => onUpdateDarkMode && onUpdateDarkMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          <div className={`pt-3 border-t text-center text-[11px] space-y-1 ${
            darkMode ? 'border-slate-800 text-slate-500' : 'border-stone-200 text-stone-500'
          }`}>
            <div className={`flex items-center justify-center gap-1.5 ${darkMode ? 'text-slate-400' : 'text-stone-600'}`}>
              <Info className="w-3.5 h-3.5 text-amber-500" />
              <span className={`font-serif font-bold ${darkMode ? 'text-amber-300/90' : 'text-amber-700'}`}>Pan Vivo v1.0.0</span>
            </div>
            <p>Liturgia Diaria • Biblia Católica (73 Libros) • Santo Rosario • Homilías con IA</p>
            <p className={darkMode ? 'text-slate-600' : 'text-stone-400'}>«Yo soy el pan vivo que ha bajado del cielo» (Jn 6, 51)</p>
          </div>
        </div>
      </div>
    </div>
  );
};
