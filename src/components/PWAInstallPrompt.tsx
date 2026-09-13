import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, Smartphone, Check, Sparkles, HelpCircle } from 'lucide-react';
import { usePWAInstall } from '../lib/usePWAInstall.ts';

interface PWAInstallPromptProps {
  darkMode?: boolean;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ darkMode = true }) => {
  const { isInstalled, isInstallable, isIOS, install } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(() => {
    return sessionStorage.getItem('pan_vivo_pwa_dismissed') === 'true';
  });
  const [isMinimized, setIsMinimized] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  // If running standalone, completely suppress the prompt
  if (isInstalled) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('pan_vivo_pwa_dismissed', 'true');
  };

  const handleTriggerInstall = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome === 'accepted') {
        setJustInstalled(true);
        setTimeout(() => {
          setIsDismissed(true);
        }, 3000);
      }
    } else {
      // Fallback modal for iOS Safari or browsers without beforeinstallprompt
      setShowInstructionsModal(true);
    }
  };

  return (
    <>
      {/* Floating Pill / Banner if not dismissed */}
      {!isDismissed && (
        <aside
          aria-label="Sugerencia para instalar Pan Vivo"
          className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-40 transition-all duration-300"
        >
          {justInstalled ? (
            <div className="bg-emerald-950/90 border border-emerald-500/50 backdrop-blur-md rounded-2xl p-3.5 shadow-2xl flex items-center gap-3 text-emerald-200">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Check className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-white">¡Pan Vivo instalado con éxito!</p>
                <p className="text-[11px] text-emerald-300/80">Ya puedes abrirlo directamente desde tu pantalla de inicio.</p>
              </div>
            </div>
          ) : isMinimized ? (
            /* Minimized small pill */
            <button
              id="btn-pwa-install-minimized"
              onClick={() => setIsMinimized(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-full bg-[#1e140d]/95 hover:bg-[#2a1c12] text-amber-300 border border-amber-500/40 shadow-xl backdrop-blur-md text-xs font-semibold transition-transform hover:scale-105 ml-auto"
              title="Instalar aplicación Pan Vivo"
            >
              <Download className="w-4 h-4 text-amber-400 animate-bounce" />
              <span>Instalar App</span>
            </button>
          ) : (
            /* Non-intrusive floating card */
            <div
              className={`border backdrop-blur-md rounded-2xl p-3.5 shadow-2xl transition-all duration-300 relative overflow-hidden ${
                darkMode
                  ? 'bg-[#18100a]/95 border-amber-500/40 text-slate-100 shadow-amber-950/40'
                  : 'bg-[#fffaf3]/95 border-amber-400/60 text-stone-900 shadow-stone-400/40'
              }`}
            >
              {/* Subtle gold decorative glow */}
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />

              <div className="flex items-start gap-3">
                {/* App icon badge */}
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-amber-500/50 shrink-0 shadow-md bg-[#0c0805]">
                  <img
                    src="/pwa-192x192.png"
                    alt="Pan Vivo Icon"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>

                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-amber-500">
                      Aplicación Móvil
                    </span>
                    <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                  </div>
                  <h4 className="text-xs font-serif font-bold text-amber-300 truncate">
                    Instalar Pan Vivo en tu teléfono
                  </h4>
                  <p className="text-[11px] text-stone-400 line-clamp-1 mt-0.5">
                    Lecturas offline, rezo del Rosario y acceso directo rápido.
                  </p>
                </div>

                {/* Close / Dismiss */}
                <button
                  id="btn-pwa-dismiss"
                  onClick={handleDismiss}
                  className="absolute top-2.5 right-2.5 p-1 text-stone-400 hover:text-stone-200 rounded-lg hover:bg-white/10 transition-colors"
                  title="Cerrar sugerencia"
                  aria-label="Cerrar sugerencia"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="mt-3 pt-2.5 border-t border-amber-950/40 flex items-center justify-between gap-2">
                <button
                  id="btn-pwa-minimize"
                  onClick={() => setIsMinimized(true)}
                  className="text-[11px] text-stone-400 hover:text-stone-300 px-2 py-1 transition-colors"
                >
                  Más tarde
                </button>

                <button
                  id="btn-pwa-install-action"
                  onClick={handleTriggerInstall}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Instalar ahora</span>
                </button>
              </div>
            </div>
          )}
        </aside>
      )}

      {/* If dismissed, we still provide a tiny discreet floating button in the corner on mobile so the user can easily install whenever they wish */}
      {isDismissed && !isInstalled && (
        <button
          id="btn-pwa-reopen-install"
          onClick={() => setShowInstructionsModal(true)}
          className="fixed bottom-20 right-4 z-40 p-2.5 rounded-full bg-[#18100a]/90 border border-amber-500/40 text-amber-400 shadow-xl backdrop-blur-md hover:scale-110 active:scale-95 transition-all opacity-70 hover:opacity-100"
          title="Instalar Pan Vivo en tu dispositivo"
          aria-label="Instalar Pan Vivo en tu dispositivo"
        >
          <Download className="w-4 h-4" />
        </button>
      )}

      {/* Instructions Modal (For iOS Safari or browsers where automatic prompt requires guided action) */}
      {showInstructionsModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            className={`w-full max-w-sm rounded-3xl p-5 border shadow-2xl relative ${
              darkMode ? 'bg-[#140c07] border-amber-500/30 text-slate-100' : 'bg-[#fffaf3] border-amber-400 text-stone-900'
            }`}
          >
            {/* Close button */}
            <button
              onClick={() => setShowInstructionsModal(false)}
              className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-200 rounded-xl hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl overflow-hidden border border-amber-500/50 shadow-md bg-[#0c0805] shrink-0">
                <img src="/pwa-192x192.png" alt="Pan Vivo Icon" className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  Guía de Instalación
                </span>
                <h3 className="text-base font-serif font-bold text-amber-300">
                  Instalar Pan Vivo
                </h3>
              </div>
            </div>

            {isIOS ? (
              /* iOS Safari Instructions */
              <div className="space-y-3.5 text-xs text-stone-300 font-sans">
                <p className="text-[11px] text-amber-200/80">
                  En iPhone o iPad, Apple requiere instalar la aplicación a través del menú de Safari:
                </p>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-amber-950/30 border border-amber-900/40">
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 shrink-0">
                    <Share className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-amber-300 block">1. Toca el botón Compartir</strong>
                    <span className="text-[11px] text-stone-400">
                      Ubicado en la barra inferior de Safari (ícono de cuadrado con flecha hacia arriba).
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-amber-950/30 border border-amber-900/40">
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 shrink-0">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-amber-300 block">2. Selecciona «Agregar a inicio»</strong>
                    <span className="text-[11px] text-stone-400">
                      Desliza hacia abajo en las opciones y presiona «Añadir a pantalla de inicio».
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-amber-950/30 border border-amber-900/40">
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-amber-300 block">3. Pulsa «Agregar»</strong>
                    <span className="text-[11px] text-stone-400">
                      En la esquina superior derecha para confirmar. ¡Listo!
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* Android / Chromium / Desktop Instructions */
              <div className="space-y-3.5 text-xs text-stone-300 font-sans">
                <p className="text-[11px] text-amber-200/80">
                  Puedes añadir Pan Vivo a la pantalla de inicio de tu teléfono o escritorio para una experiencia nativa sin barras de navegación:
                </p>

                {isInstallable ? (
                  <div className="pt-2">
                    <button
                      onClick={async () => {
                        await install();
                        setShowInstructionsModal(false);
                      }}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 font-bold text-xs shadow-lg flex items-center justify-center gap-2 hover:opacity-95"
                    >
                      <Download className="w-4 h-4" />
                      <span>Abrir diálogo de instalación directa</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-3 p-2.5 rounded-xl bg-amber-950/30 border border-amber-900/40">
                      <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 shrink-0">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="text-amber-300 block">Menú del Navegador (⋮)</strong>
                        <span className="text-[11px] text-stone-400">
                          Toca los tres puntos en la esquina superior o inferior de tu navegador (Chrome, Edge, Samsung Internet).
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-2.5 rounded-xl bg-amber-950/30 border border-amber-900/40">
                      <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 shrink-0">
                        <Download className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="text-amber-300 block">«Instalar aplicación» o «Agregar a pantalla de inicio»</strong>
                        <span className="text-[11px] text-stone-400">
                          Selecciona esta opción para crear el ícono con acceso directo en tu dispositivo.
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setShowInstructionsModal(false)}
              className="mt-4 w-full py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
