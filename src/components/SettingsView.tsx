import React, { useState } from 'react';
import {
  User as UserIcon,
  LogOut,
  Globe,
  Sliders,
  Sparkles,
  Volume2,
  Trash2,
  Moon,
  Sun,
  Info,
  Check,
  Flame,
  ShieldCheck,
  LogIn,
  Smartphone,
  Download,
  CheckCircle2,
  Share,
  PlusSquare
} from 'lucide-react';
import { logoutUser } from '../lib/firebase.ts';
import { usePWAInstall } from '../lib/usePWAInstall.ts';
import type { User } from 'firebase/auth';

interface SettingsViewProps {
  user: User | null;
  onOpenAuth: () => void;
  fontSize: number;
  onUpdateFontSize: (size: number) => void;
  calendarRegion: string;
  onUpdateCalendarRegion: (reg: string) => void;
  prayerStyle: 'sacred' | 'minimal';
  onUpdatePrayerStyle: (st: 'sacred' | 'minimal') => void;
  audioEnabled: boolean;
  onUpdateAudioEnabled: (val: boolean) => void;
  darkMode?: boolean;
  onUpdateDarkMode?: (val: boolean) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  onOpenAuth,
  fontSize,
  onUpdateFontSize,
  calendarRegion,
  onUpdateCalendarRegion,
  prayerStyle,
  onUpdatePrayerStyle,
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

  const handleLogout = async () => {
    try { await logoutUser(); }
    catch (error) {
      console.error('No se pudo cerrar sesión:', error);
      setClearedNotice('No se pudo cerrar sesión. Reintenta.');
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
          Configuración personal, sincronización de cuenta y preferencias
        </p>
      </div>

      <div className="px-4 py-3 max-w-xl mx-auto space-y-4">
        {/* --- 1. Account & Cloud Sync Card (Image 4) --- */}
        <div className={`border rounded-3xl p-4 sm:p-5 shadow-xl overflow-hidden transition-colors duration-300 ${
          darkMode
            ? 'bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 border-amber-500/30'
            : 'bg-gradient-to-r from-amber-100/60 via-stone-50 to-stone-50 border-amber-300'
        }`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl border flex items-center justify-center shrink-0 ${
                darkMode ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-amber-500/20 border-amber-400 text-amber-700'
              }`}>
                <UserIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>

              <div className="min-w-0 flex-1">
                <span className={`text-[10px] uppercase font-bold tracking-wider block truncate ${
                  darkMode ? 'text-amber-400' : 'text-amber-700'
                }`}>
                  {user ? 'Cuenta Sincronizada' : 'Modo Peregrino'}
                </span>
                <h3 className={`text-base font-serif font-bold truncate ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                  {user ? user.displayName || user.email?.split('@')[0] || 'Fiel Cristiano' : 'Invitado'}
                </h3>
                <p className={`text-xs truncate ${darkMode ? 'text-slate-400' : 'text-stone-500'}`}>
                  {user?.email || 'Guardado localmente en este dispositivo'}
                </p>
              </div>
            </div>

            {user ? (
              <button
                id="btn-logout"
                onClick={handleLogout}
                className={`p-2.5 rounded-xl transition-colors shrink-0 ${
                  darkMode ? 'text-slate-400 hover:text-red-400 hover:bg-slate-800' : 'text-stone-500 hover:text-red-500 hover:bg-stone-200'
                }`}
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            ) : (
              <button
                id="btn-open-login"
                onClick={onOpenAuth}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-2 sm:py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all shrink-0 whitespace-nowrap"
              >
                <LogIn className="w-3.5 h-3.5 shrink-0" />
                <span>Iniciar Sesión</span>
              </button>
            )}
          </div>

          <div className={`mt-4 pt-3 border-t flex flex-wrap items-center justify-between gap-2 text-xs ${
            darkMode ? 'border-slate-800/80 text-slate-300' : 'border-stone-200 text-stone-600'
          }`}>
            <div className="flex items-center gap-1.5 text-emerald-500 text-[11px] sm:text-xs">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Base de Datos Firestore Activa</span>
            </div>
            <div className={`flex items-center gap-1 text-[11px] sm:text-xs ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>
              <Flame className="w-4 h-4 shrink-0" />
              <span>Sincronización multi-dispositivo</span>
            </div>
          </div>
        </div>

        {/* --- 2. Liturgia y Calendario --- */}
        <div className={`border rounded-3xl p-5 shadow-md space-y-4 transition-colors duration-300 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-stone-200'
        }`}>
          <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${
            darkMode ? 'text-amber-300' : 'text-amber-700'
          }`}>
            <Globe className="w-4 h-4 text-amber-500" />
            <span>Calendario Litúrgico Regional</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className={`text-xs font-medium block ${darkMode ? 'text-slate-200' : 'text-stone-800'}`}>Región Litúrgica</span>
              <span className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-stone-500'}`}>Adapta los santos y lecturas locales</span>
            </div>

            <select
              value="Colombia"
              disabled
              className={`border rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-amber-400 ${
                darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-stone-100 border-stone-300 text-stone-800'
              }`}
            >
              <option value="Colombia">Colombia</option>
            </select>
          </div>
        </div>

        {/* --- 3. Sagrada Biblia Settings (Image 4) --- */}
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

        {/* --- 4. Oración y Estilo (Image 4) --- */}
        <div className={`border rounded-3xl p-5 shadow-md space-y-4 transition-colors duration-300 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-stone-200'
        }`}>
          <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${
            darkMode ? 'text-amber-300' : 'text-amber-700'
          }`}>
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Oración y Asistencia</span>
          </div>

          {/* Visual Style */}
          <div className="flex items-center justify-between">
            <div>
              <span className={`text-xs font-medium block ${darkMode ? 'text-slate-200' : 'text-stone-800'}`}>Estilo Visual</span>
              <span className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-stone-500'}`}>Iconografía del Rosario y Devocionario</span>
            </div>

            <div className={`flex items-center p-1 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-stone-100 border border-stone-200'}`}>
              <button
                onClick={() => onUpdatePrayerStyle('sacred')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  prayerStyle === 'sacred'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : darkMode ? 'text-slate-400 hover:text-white' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Arte Sacro
              </button>
              <button
                onClick={() => onUpdatePrayerStyle('minimal')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  prayerStyle === 'minimal'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : darkMode ? 'text-slate-400 hover:text-white' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Minimalista
              </button>
            </div>
          </div>

          {/* Audio toggle */}
          <div className={`flex items-center justify-between pt-2 border-t ${darkMode ? 'border-slate-800' : 'border-stone-200'}`}>
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

        {/* --- 5. Instalación en Dispositivo (PWA) --- */}
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
