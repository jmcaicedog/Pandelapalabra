import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ChevronRight,
  RotateCcw,
  Volume2,
  VolumeX,
  CheckCircle,
  Play,
  Heart,
  Shield,
  Sun,
  Flame,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  ROSARY_GROUPS,
  getTodayMysteries,
  COMMON_PRAYERS,
  CORONILLA_PRAYERS,
  LITANIES,
  type RosaryMysteryGroup
} from '../data/prayers.ts';
import { speechService } from '../lib/speech.ts';
import { updateUserPrayerStats } from '../lib/firebase.ts';
import type { User } from 'firebase/auth';

interface PrayersViewProps {
  user: User | null;
  onSelectTab?: (tab: string) => void;
  prayerStyle?: 'sacred' | 'minimal';
}

type PrayerCategory = 'rosario' | 'coronillas' | 'letanias' | 'devocionario';

export const PrayersView: React.FC<PrayersViewProps> = ({ user, prayerStyle = 'sacred' }) => {
  const [activeCategory, setActiveCategory] = useState<PrayerCategory>('rosario');
  const todayGroup = getTodayMysteries();

  // --- Active Rosary Interactive State ---
  const [isPrayingRosary, setIsPrayingRosary] = useState(false);
  const [activeMysteryGroup, setActiveMysteryGroup] = useState<RosaryMysteryGroup>(todayGroup);
  const [currentDecadeIndex, setCurrentDecadeIndex] = useState(0); // 0..4 (5 decades)
  // Step inside decade: 'intro' | 'padrenuestro' | 'avemaria' | 'gloria' | 'fatima'
  const [decadeStep, setDecadeStep] = useState<'intro' | 'padrenuestro' | 'avemaria' | 'gloria' | 'fatima'>('intro');
  const [beadCount, setBeadCount] = useState(1); // 1..10 for Ave María
  const [rosaryFinished, setRosaryFinished] = useState(false);

  // --- Active Coronilla State ---
  const [isPrayingCoronilla, setIsPrayingCoronilla] = useState(false);
  const [coronillaDecade, setCoronillaDecade] = useState(0); // 0..4
  const [coronillaBead, setCoronillaBead] = useState(1); // 1..10
  const [coronillaStep, setCoronillaStep] = useState<'intro' | 'padre_eterno' | 'decena' | 'trisagio'>('intro');
  const [coronillaFinished, setCoronillaFinished] = useState(false);

  // --- Selected Devocionario Prayer Modal ---
  const [selectedDevotion, setSelectedDevotion] = useState<{ title: string; text: string; subtitle?: string } | null>(null);

  // Audio Speech state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const savePrayerStats = (increment: number) => {
    setStatsError(null);
    updateUserPrayerStats(user?.uid || 'guest', increment).catch(error => {
      console.error('No se pudo registrar la oración:', error);
      setStatsError('La oración terminó, pero no se pudo confirmar el guardado de tus estadísticas.');
    });
  };

  useEffect(() => {
    const unsub = speechService.subscribe(setIsSpeaking);
    return () => {
      unsub();
      speechService.stop();
    };
  }, []);

  // Launch interactive Rosary
  const startRosary = (group: RosaryMysteryGroup) => {
    setActiveMysteryGroup(group);
    setCurrentDecadeIndex(0);
    setDecadeStep('intro');
    setBeadCount(1);
    setRosaryFinished(false);
    setIsPrayingRosary(true);
  };

  const handleNextRosaryBead = () => {
    if (decadeStep === 'intro') {
      setDecadeStep('padrenuestro');
    } else if (decadeStep === 'padrenuestro') {
      setDecadeStep('avemaria');
      setBeadCount(1);
    } else if (decadeStep === 'avemaria') {
      if (beadCount < 10) {
        setBeadCount((prev) => prev + 1);
      } else {
        setDecadeStep('gloria');
      }
    } else if (decadeStep === 'gloria') {
      setDecadeStep('fatima');
    } else if (decadeStep === 'fatima') {
      if (currentDecadeIndex < 4) {
        setCurrentDecadeIndex((prev) => prev + 1);
        setDecadeStep('intro');
        setBeadCount(1);
      } else {
        // Finished all 5 decades!
        setRosaryFinished(true);
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        savePrayerStats(1);
      }
    }
  };

  // Coronilla Handlers
  const startCoronilla = () => {
    setIsPrayingCoronilla(true);
    setCoronillaDecade(0);
    setCoronillaBead(1);
    setCoronillaStep('intro');
    setCoronillaFinished(false);
  };

  const handleNextCoronillaBead = () => {
    if (coronillaStep === 'intro') {
      setCoronillaStep('padre_eterno');
    } else if (coronillaStep === 'padre_eterno') {
      setCoronillaStep('decena');
      setCoronillaBead(1);
    } else if (coronillaStep === 'decena') {
      if (coronillaBead < 10) {
        setCoronillaBead((prev) => prev + 1);
      } else {
        if (coronillaDecade < 4) {
          setCoronillaDecade((prev) => prev + 1);
          setCoronillaStep('padre_eterno');
          setCoronillaBead(1);
        } else {
          setCoronillaStep('trisagio');
        }
      }
    } else if (coronillaStep === 'trisagio') {
      setCoronillaFinished(true);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      savePrayerStats(0);
    }
  };

  const currentMystery = activeMysteryGroup.mysteries[currentDecadeIndex];

  return (
    <div id="prayers-container" className="min-h-screen pb-28 text-slate-100">
      {statsError && <p role="alert" className="fixed top-5 left-4 right-4 z-[100] rounded-xl bg-slate-900 border border-amber-500 p-4 text-sm text-amber-200">{statsError}</p>}
      {/* Top Hero Banner with Sacred Art */}
      <div className="relative h-52 w-full overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1c130b] via-[#140e08] to-[#0c0805]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.28),rgba(255,255,255,0))]"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[440px] h-[200px] bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="absolute bottom-4 left-4 right-4 text-center">
          <h1 className="text-2xl font-serif font-bold text-white tracking-tight drop-shadow-md">
            Oración y Devocionario
          </h1>
          <p className="text-xs text-amber-300/90 font-medium mt-1">
            Santo Rosario, Coronillas y Plegarias Tradicionales
          </p>
        </div>
      </div>

      {/* Main Container */}
      <div className="px-4 py-4 max-w-xl mx-auto space-y-4">
        {/* Top Category Selectors (Image 6) */}
        <div className="grid grid-cols-4 p-1 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-semibold">
          <button
            id="tab-prayer-rosario"
            onClick={() => setActiveCategory('rosario')}
            className={`py-2 px-1 rounded-xl transition-all flex flex-col items-center justify-center ${
              activeCategory === 'rosario'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>📿</span>
            <span className="mt-0.5 text-[11px]">Rosario</span>
          </button>

          <button
            id="tab-prayer-coronillas"
            onClick={() => setActiveCategory('coronillas')}
            className={`py-2 px-1 rounded-xl transition-all flex flex-col items-center justify-center ${
              activeCategory === 'coronillas'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>✨</span>
            <span className="mt-0.5 text-[11px]">Coronillas</span>
          </button>

          <button
            id="tab-prayer-letanias"
            onClick={() => setActiveCategory('letanias')}
            className={`py-2 px-1 rounded-xl transition-all flex flex-col items-center justify-center ${
              activeCategory === 'letanias'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>📜</span>
            <span className="mt-0.5 text-[11px]">Letanías</span>
          </button>

          <button
            id="tab-prayer-devocionario"
            onClick={() => setActiveCategory('devocionario')}
            className={`py-2 px-1 rounded-xl transition-all flex flex-col items-center justify-center ${
              activeCategory === 'devocionario'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🙏</span>
            <span className="mt-0.5 text-[11px]">Devocionario</span>
          </button>
        </div>

        {/* ================= CATEGORY 1: EL SANTO ROSARIO ================= */}
        {activeCategory === 'rosario' && (
          <div className="space-y-4">
            {/* Banner: Misterios de Hoy (Image 6) */}
            <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/20 border border-amber-500/40 rounded-3xl p-5 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Misterios del Día: {todayGroup.days}</span>
                  </div>
                  <h2 className="text-xl font-serif font-bold text-white tracking-tight">
                    {todayGroup.title}
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 max-w-sm">
                    {todayGroup.description}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-amber-500/20 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">5 Decenas Interactivas</span>
                <button
                  id="btn-rezar-rosario-hoy"
                  onClick={() => startRosary(todayGroup)}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 active:scale-95 transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Rezar Rosario de Hoy</span>
                </button>
              </div>
            </div>

            {/* List of all 4 groups of Mysteries */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
                Todos los Misterios del Santo Rosario
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ROSARY_GROUPS.map((group) => {
                  const isToday = group.id === todayGroup.id;
                  return (
                    <div
                      key={group.id}
                      onClick={() => startRosary(group)}
                      className={`group relative overflow-hidden rounded-2xl border p-4 cursor-pointer transition-all duration-200 ${
                        isToday
                          ? 'bg-slate-900 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                          : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-400 block mb-0.5">
                            {group.days} {isToday && '• HOY'}
                          </span>
                          <h4 className="text-base font-serif font-bold text-white group-hover:text-amber-300 transition-colors">
                            {group.title}
                          </h4>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-transform group-hover:translate-x-1" />
                      </div>

                      <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                        {group.description}
                      </p>

                      <div className="mt-3 flex items-center justify-between text-[11px] text-amber-300/80 font-medium">
                        <span>Rezar 5 misterios</span>
                        <Play className="w-3 h-3" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= CATEGORY 2: CORONILLAS ================= */}
        {activeCategory === 'coronillas' && (
          <div className="space-y-4">
            {/* Coronilla de la Divina Misericordia Card */}
            <div className="bg-gradient-to-r from-red-950/30 via-slate-900 to-amber-950/30 border border-slate-800 rounded-3xl p-5 shadow-lg">
              <div className="flex items-center gap-2 text-xs font-semibold text-red-400 mb-1">
                <span>🔴 ⚪</span>
                <span>Hora de la Misericordia (15:00)</span>
              </div>

              <h2 className="text-xl font-serif font-bold text-white">
                {CORONILLA_PRAYERS.title}
              </h2>

              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {CORONILLA_PRAYERS.history}
              </p>

              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 my-3 text-xs text-amber-200/90 font-serif italic">
                «Padre Eterno, te ofrezco el Cuerpo y la Sangre, el Alma y la Divinidad de tu amadísimo Hijo, Nuestro Señor Jesucristo...»
              </div>

              <button
                id="btn-start-coronilla"
                onClick={startCoronilla}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 active:scale-95 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Rezar Coronilla Interactiva</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= CATEGORY 3: LETANÍAS ================= */}
        {activeCategory === 'letanias' && (
          <div className="space-y-3">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <h3 className="text-base font-serif font-bold text-amber-300">
                Letanías Lauretanas a la Santísima Virgen
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Tradicional invocación mariana para concluir el Santo Rosario.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl divide-y divide-slate-800/80 max-h-[60vh] overflow-y-auto">
              {LITANIES.map((lit, idx) => (
                <div
                  key={idx}
                  className="p-3 flex items-center justify-between text-xs hover:bg-slate-800/40 transition-colors"
                >
                  <span className="font-serif text-slate-200">{lit}</span>
                  <span className="text-amber-400 font-semibold italic text-[11px]">
                    Ruega por nosotros
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= CATEGORY 4: DEVOCIONARIO ================= */}
        {activeCategory === 'devocionario' && (
          <div className="grid grid-cols-1 gap-3">
            {/* 1. Ángelus */}
            <div
              onClick={() =>
                setSelectedDevotion({
                  title: 'El Ángelus',
                  subtitle: 'Oración tradicional al mediodía y a las 6:00',
                  text: COMMON_PRAYERS.angelus.map((a) => `V/. ${a.v}\nR/. ${a.r}`).join('\n\n') +
                    '\n\nOremos: Infunde, Señor, tu gracia en nuestras almas para que, habiendo conocido por la voz del Ángel la Encarnación de tu Hijo Jesucristo, por los méritos de su Pasión y de su Cruz, lleguemos a la gloria de su Resurrección. Por el mismo Jesucristo Nuestro Señor. Amén.',
                })
              }
              className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 p-4 rounded-2xl cursor-pointer transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-serif font-bold text-white">El Ángelus</h4>
                  <p className="text-xs text-slate-400">Meditación de la Encarnación (12:00 pm)</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </div>

            {/* 2. San Miguel Arcángel */}
            <div
              onClick={() =>
                setSelectedDevotion({
                  title: 'Oración a San Miguel Arcángel',
                  subtitle: 'Compuesta por el Papa León XIII',
                  text: COMMON_PRAYERS.sanMiguel,
                })
              }
              className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 p-4 rounded-2xl cursor-pointer transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-serif font-bold text-white">San Miguel Arcángel</h4>
                  <p className="text-xs text-slate-400">Protección y combate espiritual</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </div>

            {/* 3. La Salve */}
            <div
              onClick={() =>
                setSelectedDevotion({
                  title: 'Salve Regina (Dios te salve, Reina y Madre)',
                  subtitle: 'Plegaria filial a Nuestra Señora',
                  text: COMMON_PRAYERS.salveRegina,
                })
              }
              className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 p-4 rounded-2xl cursor-pointer transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-serif font-bold text-white">Salve Regina</h4>
                  <p className="text-xs text-slate-400">Cántico a la Reina del Cielo</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </div>

            {/* 4. Acto de Contrición */}
            <div
              onClick={() =>
                setSelectedDevotion({
                  title: 'Acto de Contrición',
                  subtitle: 'Para el examen de conciencia y confesión',
                  text: '«Señor mío Jesucristo, Dios y Hombre verdadero, Creador, Padre y Redentor mío; por ser Vos quien sois, Bondad infinita, y porque os amo sobre todas las cosas, me pesa de todo corazón haberos ofendido. También me pesa porque podéis castigarme con las penas del infierno. Ayudado de vuestra divina gracia, propongo firmemente nunca más pecar, confesarme y cumplir la penitencia que me fuere impuesta. Amén.»',
                })
              }
              className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 p-4 rounded-2xl cursor-pointer transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-serif font-bold text-white">Acto de Contrición</h4>
                  <p className="text-xs text-slate-400">Dolor sincero de los pecados</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </div>
          </div>
        )}
      </div>

      {/* ================= FULLSCREEN INTERACTIVE ROSARY MODAL ================= */}
      {isPrayingRosary && (
        <div
          id="interactive-rosary-modal"
          className="fixed inset-0 z-[75] bg-[#0c0805] flex flex-col text-slate-100 animate-fade-in overflow-hidden"
        >
          {/* Top Bar */}
          <div className="p-4 border-b border-amber-950/60 flex items-center justify-between bg-[#140e09]/95 backdrop-blur-md shrink-0">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                {activeMysteryGroup.title}
              </span>
              <h2 className="text-sm font-serif font-bold text-amber-200">
                Misterio {currentDecadeIndex + 1} de 5
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => speechService.toggle(
                  `${currentMystery.numberTitle}: ${currentMystery.name}. ${currentMystery.scriptureText}. Meditación: ${currentMystery.meditation}`
                )}
                className={`p-2 rounded-full transition-colors ${
                  isSpeaking ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-[#221810] text-amber-200 hover:text-white'
                }`}
                title="Voz asistida"
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <button
                id="btn-close-rosary"
                onClick={() => {
                  speechService.stop();
                  setIsPrayingRosary(false);
                }}
                className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-[#221810]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Progress Bar of the 5 Decades */}
          <div className="w-full bg-[#1c130b] h-1.5 shrink-0">
            <div
              className="bg-amber-500 h-1.5 transition-all duration-300"
              style={{
                width: `${((currentDecadeIndex * 12 + (decadeStep === 'avemaria' ? beadCount : decadeStep === 'intro' ? 0 : decadeStep === 'padrenuestro' ? 1 : 11)) / 60) * 100}%`,
              }}
            ></div>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:py-6 max-w-md mx-auto w-full overscroll-contain">
            {rosaryFinished ? (
              <div className="text-center space-y-4 py-8">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center mx-auto text-amber-400">
                  <CheckCircle className="w-9 h-9" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-amber-300">
                  ¡Santo Rosario Completado!
                </h3>
                <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
                  Has meditado y orado los 5 misterios. Tu fidelidad ha sido registrada en tu camino espiritual.
                </p>

                <div className="bg-[#140e09] border border-amber-950/60 rounded-2xl p-4 text-xs font-serif text-[#ece4d8] text-left">
                  <p className="font-bold text-amber-400 mb-1">Salve Regina</p>
                  <p className="italic leading-relaxed">{COMMON_PRAYERS.salveRegina}</p>
                </div>

                <button
                  onClick={() => {
                    setIsPrayingRosary(false);
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3 rounded-2xl text-xs shadow-lg shadow-amber-500/30 transition-colors"
                >
                  Concluir Oración
                </button>
              </div>
            ) : (
              <div className="space-y-4 pb-24">
                {/* Mystery Header Card */}
                <div className="bg-[#140e09] border border-amber-950/60 rounded-3xl p-5 shadow-xl text-center relative overflow-hidden">
                  {prayerStyle === 'sacred' && currentMystery.image && (
                    <div className="mb-4 rounded-2xl overflow-hidden max-h-44 w-full relative border border-amber-900/40 shadow-inner">
                      <img
                        src={currentMystery.image}
                        alt={currentMystery.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-44 object-cover object-center"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#140e09] via-transparent to-black/20" />
                    </div>
                  )}

                  <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wide">
                    {currentMystery.numberTitle}
                  </span>
                  <h3 className="text-base sm:text-lg font-serif font-bold text-white mt-1">
                    {currentMystery.name}
                  </h3>

                  <p className="text-xs font-serif text-amber-200/90 italic mt-2.5 bg-[#1b120a] p-3 rounded-xl border border-amber-900/40 leading-relaxed">
                    «{currentMystery.scriptureText}» ({currentMystery.scriptureRef})
                  </p>

                  <div className="mt-3 text-[11px] text-stone-300">
                    <span className="text-amber-400 font-semibold">Fruto del misterio: </span>
                    {currentMystery.fruit}
                  </div>
                </div>

                {/* Bead Tracker String Visual (10 Beads) */}
                {decadeStep === 'avemaria' && (
                  <div className="bg-[#140e09] border border-amber-950/60 rounded-2xl p-3 shadow-md">
                    <div className="flex items-center justify-between text-[11px] text-amber-200/70 mb-2">
                      <span>Cuenta Ave María</span>
                      <span className="font-bold text-amber-400 font-mono text-xs">
                        {beadCount} / 10
                      </span>
                    </div>

                    <div className="flex items-center justify-between px-1">
                      {Array.from({ length: 10 }).map((_, i) => {
                        const active = i + 1 <= beadCount;
                        return (
                          <div
                            key={i}
                            className={`w-6 h-6 rounded-full transition-all duration-300 flex items-center justify-center text-[10px] font-bold ${
                              active
                                ? 'bg-amber-400 text-slate-950 scale-110 shadow-md shadow-amber-400/40'
                                : 'bg-[#221810] text-amber-200/40 border border-amber-900/30'
                            }`}
                          >
                            {i + 1}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Current Active Prayer Text Card */}
                <div className="bg-[#140e09] border border-amber-950/60 rounded-2xl p-5 text-center shadow-lg">
                  <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                    {decadeStep === 'intro'
                      ? 'Meditación del Misterio'
                      : decadeStep === 'padrenuestro'
                      ? 'Padre Nuestro (1)'
                      : decadeStep === 'avemaria'
                      ? `Ave María (${beadCount} de 10)`
                      : decadeStep === 'gloria'
                      ? 'Gloria al Padre'
                      : 'Jaculatoria de Fátima'}
                  </span>

                  <p className="text-xs sm:text-sm text-[#ece4d8] font-serif leading-relaxed mt-2.5">
                    {decadeStep === 'intro'
                      ? currentMystery.meditation
                      : decadeStep === 'padrenuestro'
                      ? COMMON_PRAYERS.paterNoster
                      : decadeStep === 'avemaria'
                      ? COMMON_PRAYERS.aveMaria
                      : decadeStep === 'gloria'
                      ? COMMON_PRAYERS.gloria
                      : COMMON_PRAYERS.jaculatoriaFatima}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sticky Bottom Action Button */}
          {!rosaryFinished && (
            <div className="p-4 bg-[#140e09]/95 border-t border-amber-950/60 backdrop-blur-md shrink-0">
              <div className="max-w-md mx-auto w-full">
                <button
                  id="btn-next-rosary-bead"
                  onClick={handleNextRosaryBead}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold py-3.5 px-6 rounded-2xl text-sm shadow-xl shadow-amber-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <span>
                    {decadeStep === 'intro'
                      ? 'Comenzar Decena (Padre Nuestro)'
                      : decadeStep === 'padrenuestro'
                      ? 'Pasar a las Avemarías (1/10)'
                      : decadeStep === 'avemaria'
                      ? beadCount < 10
                        ? `Avanzar Cuenta (${beadCount + 1}/10)`
                        : 'Rezar Gloria al Padre'
                      : decadeStep === 'gloria'
                      ? 'Jaculatoria de Fátima'
                      : currentDecadeIndex < 4
                      ? `Siguiente Misterio (${currentDecadeIndex + 2} de 5)`
                      : 'Concluir Santo Rosario'}
                  </span>
                  <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= INTERACTIVE CORONILLA MODAL ================= */}
      {isPrayingCoronilla && (
        <div className="fixed inset-0 z-[75] bg-[#0c0805] flex flex-col text-slate-100 animate-fade-in overflow-hidden">
          <div className="p-4 border-b border-red-950/60 flex items-center justify-between bg-[#140e09]/95 backdrop-blur-md shrink-0">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-red-400">
                Divina Misericordia
              </span>
              <h2 className="text-sm font-serif font-bold text-red-200">
                Decena {coronillaDecade + 1} de 5
              </h2>
            </div>
            <button
              onClick={() => setIsPrayingCoronilla(false)}
              className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-[#221810]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:py-6 max-w-md mx-auto w-full overscroll-contain">
            {coronillaFinished ? (
              <div className="text-center space-y-4 py-8">
                <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center mx-auto text-red-400">
                  <CheckCircle className="w-9 h-9" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-red-300">
                  ¡Coronilla Completada!
                </h3>
                <p className="text-xs text-stone-300 max-w-xs mx-auto leading-relaxed">
                  «Jesús, en ti confío». Has ofrecido la Dolorosa Pasión de Cristo por los pecados del mundo entero.
                </p>
                <button
                  onClick={() => setIsPrayingCoronilla(false)}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-3 rounded-2xl text-xs shadow-lg shadow-red-600/30 transition-colors"
                >
                  Finalizar
                </button>
              </div>
            ) : (
              <div className="space-y-4 pb-24">
                {coronillaStep === 'decena' && (
                  <div className="bg-[#140e09] border border-red-950/60 rounded-2xl p-3 shadow-md">
                    <div className="flex items-center justify-between text-[11px] text-stone-300 mb-2">
                      <span>Cuenta de la Pasión</span>
                      <span className="font-bold text-red-400 font-mono text-xs">
                        {coronillaBead} / 10
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-1">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-6 h-6 rounded-full transition-all duration-300 flex items-center justify-center text-[10px] font-bold ${
                            i + 1 <= coronillaBead
                              ? 'bg-red-500 text-white scale-110 shadow-md shadow-red-500/40'
                              : 'bg-[#221810] text-red-200/40 border border-red-900/30'
                          }`}
                        >
                          {i + 1}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-[#140e09] border border-red-950/60 rounded-3xl p-6 text-center shadow-xl">
                  <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider">
                    {coronillaStep === 'intro'
                      ? 'Inicio'
                      : coronillaStep === 'padre_eterno'
                      ? 'Padre Eterno'
                      : coronillaStep === 'decena'
                      ? `Cuenta (${coronillaBead}/10)`
                      : 'Trisagio Final'}
                  </span>

                  <p className="text-sm text-[#ece4d8] font-serif leading-relaxed mt-3">
                    {coronillaStep === 'intro'
                      ? 'Señal de la Cruz, Padre Nuestro, Ave María y Credo de los Apóstoles.'
                      : coronillaStep === 'padre_eterno'
                      ? CORONILLA_PRAYERS.initial
                      : coronillaStep === 'decena'
                      ? CORONILLA_PRAYERS.decena
                      : CORONILLA_PRAYERS.closing}
                  </p>
                </div>
              </div>
            )}
          </div>

          {!coronillaFinished && (
            <div className="p-4 bg-[#140e09]/95 border-t border-red-950/60 backdrop-blur-md shrink-0">
              <div className="max-w-md mx-auto w-full">
                <button
                  onClick={handleNextCoronillaBead}
                  className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3.5 px-6 rounded-2xl text-sm shadow-xl shadow-red-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <span>
                    {coronillaStep === 'intro'
                      ? 'Comenzar Decenas'
                      : coronillaStep === 'padre_eterno'
                      ? 'Comenzar cuentas de la Pasión'
                      : coronillaStep === 'decena'
                      ? coronillaBead < 10
                        ? `Avanzar Cuenta (${coronillaBead + 1}/10)`
                        : coronillaDecade < 4
                        ? `Siguiente Decena (${coronillaDecade + 2}/5)`
                        : 'Rezar Trisagio Final'
                      : 'Completar Coronilla'}
                  </span>
                  <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Devotion detail modal */}
      {selectedDevotion && (
        <div
          onClick={() => setSelectedDevotion(null)}
          className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#17110b] border border-amber-950/60 rounded-3xl max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl relative p-6"
          >
            <div className="flex items-start justify-between mb-2 shrink-0">
              <div>
                <h3 className="text-lg font-serif font-bold text-amber-300">
                  {selectedDevotion.title}
                </h3>
                {selectedDevotion.subtitle && (
                  <p className="text-xs text-amber-200/60 mt-0.5">{selectedDevotion.subtitle}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedDevotion(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-[#221810]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mt-3 p-4 bg-[#140e09] rounded-2xl border border-amber-950/60 text-xs sm:text-sm font-serif text-[#ece4d8] leading-relaxed whitespace-pre-line">
              {selectedDevotion.text}
            </div>

            <button
              onClick={() => setSelectedDevotion(null)}
              className="w-full mt-4 bg-[#221810] hover:bg-[#2c1f15] text-amber-200 py-2.5 rounded-xl text-xs font-semibold border border-amber-900/40 transition-colors shrink-0"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
