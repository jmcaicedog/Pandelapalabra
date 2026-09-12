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
  Info,
  Check,
  Flame,
  ShieldCheck,
  LogIn
} from 'lucide-react';
import { logoutUser } from '../lib/firebase.ts';
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
}) => {
  const [clearedNotice, setClearedNotice] = useState<string | null>(null);

  const handleClearBibleCache = () => {
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
  };

  const handleLogout = async () => {
    await logoutUser();
  };

  return (
    <div id="settings-view-container" className="min-h-screen pb-28 text-slate-100">
      {clearedNotice && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-slate-950 font-semibold px-4 py-2 rounded-full text-xs shadow-xl flex items-center gap-2">
          <Check className="w-4 h-4" /> {clearedNotice}
        </div>
      )}

      {/* Header */}
      <div className="px-4 pt-6 pb-2 max-w-xl mx-auto">
        <h1 className="text-2xl font-serif font-bold text-white tracking-tight">Ajustes</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Configuración personal, sincronización de cuenta y preferencias
        </p>
      </div>

      <div className="px-4 py-3 max-w-xl mx-auto space-y-4">
        {/* --- 1. Account & Cloud Sync Card (Image 4) --- */}
        <div className="bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 border border-amber-500/30 rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <UserIcon className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                  {user ? 'Cuenta Sincronizada' : 'Modo Peregrino'}
                </span>
                <h3 className="text-base font-serif font-bold text-white">
                  {user ? user.displayName || user.email?.split('@')[0] || 'Fiel Cristiano' : 'Invitado'}
                </h3>
                <p className="text-xs text-slate-400 truncate max-w-[180px] sm:max-w-xs">
                  {user?.email || 'Guardado localmente en este dispositivo'}
                </p>
              </div>
            </div>

            {user ? (
              <button
                id="btn-logout"
                onClick={handleLogout}
                className="p-2.5 text-slate-400 hover:text-red-400 rounded-xl hover:bg-slate-800 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            ) : (
              <button
                id="btn-open-login"
                onClick={onOpenAuth}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Iniciar Sesión</span>
              </button>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Base de Datos Firestore Activa</span>
            </div>
            <div className="flex items-center gap-1 text-amber-400">
              <Flame className="w-4 h-4" />
              <span>Sincronización multi-dispositivo</span>
            </div>
          </div>
        </div>

        {/* --- 2. Liturgia y Calendario --- */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-md space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 uppercase tracking-wider">
            <Globe className="w-4 h-4 text-amber-400" />
            <span>Calendario Litúrgico Regional</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-200 block">Región Litúrgica</span>
              <span className="text-[11px] text-slate-400">Adapta los santos y lecturas locales</span>
            </div>

            <select
              value={calendarRegion}
              onChange={(e) => onUpdateCalendarRegion(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
            >
              <option value="Universal">Universal (Vaticano)</option>
              <option value="Colombia">Colombia</option>
              <option value="México">México</option>
              <option value="España">España</option>
              <option value="Argentina">Argentina</option>
              <option value="Chile">Chile</option>
            </select>
          </div>
        </div>

        {/* --- 3. Sagrada Biblia Settings (Image 4) --- */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-md space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 uppercase tracking-wider">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>Sagrada Biblia Católica</span>
          </div>

          {/* Font Size Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-200">Tamaño de Fuente</span>
              <span className="text-xs font-mono text-amber-400 font-bold">{fontSize} px</span>
            </div>

            <input
              type="range"
              min="14"
              max="28"
              step="1"
              value={fontSize}
              onChange={(e) => onUpdateFontSize(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />

            <p
              className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-slate-300 font-serif leading-relaxed"
              style={{ fontSize: `${fontSize}px` }}
            >
              «En el principio existía la Palabra y la Palabra estaba con Dios.» (Jn 1,1)
            </p>
          </div>

          {/* Clear Cache */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-200 block">Caché de la Biblia</span>
              <span className="text-[11px] text-slate-400">Libera espacio de capítulos descargados</span>
            </div>

            <button
              onClick={handleClearBibleCache}
              className="bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpiar Caché</span>
            </button>
          </div>
        </div>

        {/* --- 4. Oración y Estilo (Image 4) --- */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-md space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Oración y Asistencia</span>
          </div>

          {/* Visual Style */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-200 block">Estilo Visual</span>
              <span className="text-[11px] text-slate-400">Iconografía del Rosario y Devocionario</span>
            </div>

            <div className="flex items-center p-1 bg-slate-800 rounded-xl">
              <button
                onClick={() => onUpdatePrayerStyle('sacred')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  prayerStyle === 'sacred' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                }`}
              >
                Arte Sacro
              </button>
              <button
                onClick={() => onUpdatePrayerStyle('minimal')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  prayerStyle === 'minimal' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                }`}
              >
                Minimalista
              </button>
            </div>
          </div>

          {/* Audio toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2.5">
              <Volume2 className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-xs font-medium text-slate-200 block">Voz Asistida (TTS)</span>
                <span className="text-[11px] text-slate-400">Lectura solemne en español</span>
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

        {/* --- 5. Apariencia & Acerca de --- */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Moon className="w-4 h-4 text-amber-400" />
              <div>
                <span className="text-xs font-medium text-slate-200 block">Modo Oscuro Místico</span>
                <span className="text-[11px] text-slate-400">Diseñado para la contemplación y menor fatiga</span>
              </div>
            </div>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-400 font-semibold">
              Activo
            </span>
          </div>

          <div className="pt-3 border-t border-slate-800 text-center text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-slate-400">
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-serif font-bold text-amber-300/90">Lumen Católica v1.0.0</span>
            </div>
            <p>Liturgia Diaria • Biblia Católica (73 Libros) • Santo Rosario • Homilías con IA</p>
            <p className="text-slate-600">«Ad maiorem Dei gloriam»</p>
          </div>
        </div>
      </div>
    </div>
  );
};
