import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  Plus,
  Bell,
  BellRing,
  Trash2,
  Sparkles,
  BookOpen,
  X,
  Flame,
  Check
} from 'lucide-react';
import { getLiturgicalDay, fetchLiturgicalDay, type LiturgicalDay } from '../data/liturgy.ts';
import { getTodayDateStr } from '../lib/dateUtils.ts';
import {
  getUserRoutines,
  saveUserRoutine,
  toggleRoutineCompleted,
  getUserNotes,
  saveNote,
  deleteNote,
  type SpiritualRoutine,
  type SpiritualNote
} from '../lib/firebase.ts';
import type { User } from 'firebase/auth';

interface CalendarViewProps {
  user: User | null;
  onNavigateToLiturgy?: (date?: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ user, onNavigateToLiturgy }) => {
  const [activeTab, setActiveTab] = useState<'calendario' | 'rutina' | 'notas'>('rutina');

  // Calendar State initialized dynamically to today's date
  const todayStr = getTodayDateStr();
  const todayDateObj = new Date();
  const [currentYear, setCurrentYear] = useState(() => todayDateObj.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => todayDateObj.getMonth());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => todayStr);

  // Routines State
  const [routines, setRoutines] = useState<SpiritualRoutine[]>([]);
  const [loadingRoutines, setLoadingRoutines] = useState(false);
  const [newRoutineModalOpen, setNewRoutineModalOpen] = useState(false);
  const [newRoutineTitle, setNewRoutineTitle] = useState('');
  const [newRoutineTime, setNewRoutineTime] = useState('07:00');
  const [newRoutineCategory, setNewRoutineCategory] = useState<'oracion' | 'lectura' | 'rosario' | 'meditacion'>('oracion');

  // Notes State
  const [notes, setNotes] = useState<SpiritualNote[]>([]);
  const [newNoteModalOpen, setNewNoteModalOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  // Notifications
  const [notificationsGranted, setNotificationsGranted] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationsGranted(Notification.permission === 'granted');
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoadingRoutines(true);
    try {
      const uid = user?.uid || 'guest';
      const [userRoutines, userNotes] = await Promise.all([
        getUserRoutines(uid),
        getUserNotes(uid),
      ]);
      setRoutines(userRoutines);
      setNotes(userNotes);
    } finally {
      setLoadingRoutines(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleToggleRoutine = async (routine: SpiritualRoutine) => {
    const isCompleted = routine.completedDates?.includes(todayStr);
    const updated = await toggleRoutineCompleted(user?.uid || 'guest', routine.id, !isCompleted);

    setRoutines((prev) =>
      prev.map((r) => (r.id === routine.id ? updated : r))
    );
    showToast(isCompleted ? 'Rutina desmarcada' : '¡Gloria a Dios! Rutina cumplida');
  };

  const handleCreateRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoutineTitle.trim()) return;

    const newR: SpiritualRoutine = {
      id: 'routine_' + Date.now(),
      userId: user?.uid || 'guest',
      title: newRoutineTitle.trim(),
      time: newRoutineTime,
      category: newRoutineCategory,
      enabled: true,
      completedDates: [],
    };

    await saveUserRoutine(user?.uid || 'guest', newR);
    setRoutines((prev) => [...prev, newR]);
    setNewRoutineTitle('');
    setNewRoutineModalOpen(false);
    showToast('Nueva rutina añadida');
  };

  const handleRequestNotifications = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        setNotificationsGranted(true);
        new Notification('Pan Vivo', {
          body: 'Recordatorios de oración activados para tus rutinas litúrgicas.',
          icon: '/favicon.ico',
        });
        showToast('Recordatorios y notificaciones activados con éxito');
      } else {
        showToast('Permiso de notificación no concedido por el navegador');
      }
    }
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;

    const newN: SpiritualNote = {
      id: 'note_' + Date.now(),
      userId: user?.uid || 'guest',
      title: noteTitle.trim(),
      content: noteContent.trim(),
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };

    await saveNote(user?.uid || 'guest', newN);
    setNotes((prev) => [newN, ...prev]);
    setNoteTitle('');
    setNoteContent('');
    setNewNoteModalOpen(false);
    showToast('Nota espiritual guardada');
  };

  const handleDeleteNote = async (id: string) => {
    await deleteNote(user?.uid || 'guest', id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
    showToast('Nota eliminada');
  };

  // Calendar Calculation
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Dom
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const [selectedDayData, setSelectedDayData] = useState<LiturgicalDay>(() => getLiturgicalDay(selectedCalendarDate));

  useEffect(() => {
    let isMounted = true;
    const initial = getLiturgicalDay(selectedCalendarDate);
    setSelectedDayData(initial);

    fetchLiturgicalDay(selectedCalendarDate)
      .then((canonical) => {
        if (isMounted && canonical) {
          setSelectedDayData(canonical);
        }
      })
      .catch((err) => {
        console.warn('Calendar liturgy fetch fallback:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCalendarDate]);

  const completedTodayCount = routines.filter((r) => r.completedDates?.includes(todayStr)).length;

  return (
    <div id="calendar-view-container" className="min-h-screen pb-28 text-slate-100">
      {toastMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-slate-950 font-semibold px-4 py-2 rounded-full text-xs shadow-xl flex items-center gap-2">
          <Check className="w-4 h-4" /> {toastMsg}
        </div>
      )}

      {/* Hero Banner */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1c130b] via-[#140e08] to-[#0c0805]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.28),rgba(255,255,255,0))]"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[440px] h-[200px] bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="absolute bottom-4 left-4 right-4 text-center">
          <h1 className="text-2xl font-serif font-bold text-white tracking-tight">
            Vida Espiritual y Calendario
          </h1>
          <p className="text-xs text-amber-300/90 font-medium mt-1">
            Liturgia, Horarios de Oración y Meditaciones
          </p>
        </div>
      </div>

      <div className="px-4 py-4 max-w-xl mx-auto space-y-4">
        {/* Top 3 Tabs (Image 5) */}
        <div className="grid grid-cols-3 p-1 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-semibold">
          <button
            id="tab-sub-calendario"
            onClick={() => setActiveTab('calendario')}
            className={`py-2 px-2 rounded-xl transition-all ${
              activeTab === 'calendario'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Calendario
          </button>

          <button
            id="tab-sub-rutina"
            onClick={() => setActiveTab('rutina')}
            className={`py-2 px-2 rounded-xl transition-all ${
              activeTab === 'rutina'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Rutina ({completedTodayCount}/{routines.length})
          </button>

          <button
            id="tab-sub-notas"
            onClick={() => setActiveTab('notas')}
            className={`py-2 px-2 rounded-xl transition-all ${
              activeTab === 'notas'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Notas ({notes.length})
          </button>
        </div>

        {/* ================= TAB 1: CALENDARIO LITÚRGICO ================= */}
        {activeTab === 'calendario' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
              {/* Calendar Month Header */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => {
                    if (currentMonth === 0) {
                      setCurrentMonth(11);
                      setCurrentYear((y) => y - 1);
                    } else {
                      setCurrentMonth((m) => m - 1);
                    }
                  }}
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  ←
                </button>

                <h3 className="text-base font-serif font-bold text-amber-300">
                  {monthNames[currentMonth]} {currentYear}
                </h3>

                <button
                  onClick={() => {
                    if (currentMonth === 11) {
                      setCurrentMonth(0);
                      setCurrentYear((y) => y + 1);
                    } else {
                      setCurrentMonth((m) => m + 1);
                    }
                  }}
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  →
                </button>
              </div>

              {/* Days of Week Header */}
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                <span>Dom</span>
                <span>Lun</span>
                <span>Mar</span>
                <span>Mié</span>
                <span>Jue</span>
                <span>Vie</span>
                <span>Sáb</span>
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1.5 text-center">
                {Array.from({ length: firstDayIndex }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-9"></div>
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const isSelected = selectedCalendarDate === dateStr;
                  const isToday = dateStr === todayStr;

                  return (
                    <button
                      key={dayNum}
                      onClick={() => setSelectedCalendarDate(dateStr)}
                      className={`h-9 rounded-xl text-xs font-semibold flex flex-col items-center justify-center relative transition-all active:scale-95 ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 shadow-md font-bold scale-105'
                          : isToday
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800/60 hover:bg-slate-800 text-slate-200'
                      }`}
                    >
                      <span>{dayNum}</span>
                      <span
                        className={`w-1 h-1 rounded-full mt-0.5 ${
                          isSelected ? 'bg-slate-950' : 'bg-emerald-400'
                        }`}
                      ></span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Day Detail Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  {selectedDayData.formattedDate}
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/30 text-emerald-300">
                  {selectedDayData.colorName}
                </span>
              </div>

              <h4 className="text-base font-serif font-bold text-white">
                {selectedDayData.title}
              </h4>

              <div className="text-xs text-slate-300 space-y-2 border-t border-slate-800/80 pt-2.5">
                <div>
                  <span className="text-amber-300 font-serif font-semibold text-xs">Santo del Día: </span>
                  <span className="font-bold text-slate-100">{selectedDayData.saint.name}</span>
                  {selectedDayData.saint.title && (
                    <p className="text-[11px] text-slate-400 font-serif italic mt-0.5">
                      {selectedDayData.saint.title}
                    </p>
                  )}
                  {selectedDayData.saint.patronage && (
                    <span className="inline-block mt-1 text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-full">
                      Patrono de {selectedDayData.saint.patronage}
                    </span>
                  )}
                </div>
                <div className="text-slate-300 pt-1 border-t border-slate-800/40 space-y-1 text-xs">
                  <p>
                    <strong className="text-amber-300 font-serif">1ª Lectura: </strong>
                    <span className="text-slate-200">{selectedDayData.firstReading.citation}</span>
                  </p>
                  <p>
                    <strong className="text-amber-300 font-serif">Salmo: </strong>
                    <span className="text-slate-200">{selectedDayData.psalm.citation}</span>
                  </p>
                  {selectedDayData.secondReading && (
                    <p>
                      <strong className="text-amber-300 font-serif">2ª Lectura: </strong>
                      <span className="text-slate-200">{selectedDayData.secondReading.citation}</span>
                    </p>
                  )}
                  <p>
                    <strong className="text-amber-300 font-serif">Evangelio: </strong>
                    <span className="text-slate-100 font-semibold">{selectedDayData.gospel.citation}</span>
                  </p>
                </div>
              </div>

              <button
                id="btn-ver-liturgia-completa"
                onClick={() => onNavigateToLiturgy && onNavigateToLiturgy(selectedCalendarDate)}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all mt-2"
              >
                <BookOpen className="w-4 h-4" />
                <span>Ver Liturgia Completa de este día</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= TAB 2: RUTINA Y RECORDATORIOS (Image 5) ================= */}
        {activeTab === 'rutina' && (
          <div className="space-y-4">
            {/* Header with Streak & Notification prompt */}
            <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 rounded-3xl p-5 shadow-lg flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold mb-1">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span>Racha Espiritual: 12 Días</span>
                </div>
                <h3 className="text-lg font-serif font-bold text-white">
                  Rutinas de Hoy ({completedTodayCount} de {routines.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  «Orad constantemente» (1 Tesalonicenses 5:17)
                </p>
              </div>

              <button
                onClick={handleRequestNotifications}
                className={`p-3 rounded-2xl border transition-all ${
                  notificationsGranted
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
                title={notificationsGranted ? 'Notificaciones activas' : 'Activar recordatorios'}
              >
                {notificationsGranted ? (
                  <BellRing className="w-5 h-5" />
                ) : (
                  <Bell className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Routines Checklist */}
            <div className="space-y-2.5">
              {routines.map((routine) => {
                const isCompleted = routine.completedDates?.includes(todayStr);

                return (
                  <div
                    key={routine.id}
                    onClick={() => handleToggleRoutine(routine)}
                    className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between ${
                      isCompleted
                        ? 'bg-amber-950/20 border-amber-500/40 opacity-90'
                        : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button className="text-amber-400 transition-transform active:scale-125">
                        {isCompleted ? (
                          <CheckCircle2 className="w-6 h-6 fill-amber-500 text-slate-950" />
                        ) : (
                          <Circle className="w-6 h-6 text-slate-500 hover:text-amber-400" />
                        )}
                      </button>

                      <div>
                        <h4
                          className={`text-sm font-serif font-bold transition-colors ${
                            isCompleted ? 'line-through text-slate-400' : 'text-slate-100'
                          }`}
                        >
                          {routine.title}
                        </h4>
                        <span className="text-xs text-amber-400/90 font-mono">
                          {routine.time} hrs
                        </span>
                      </div>
                    </div>

                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800/80 text-slate-400 capitalize">
                      {routine.category}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Add Routine Button */}
            <button
              onClick={() => setNewRoutineModalOpen(true)}
              className="w-full bg-slate-900 hover:bg-slate-850 border border-dashed border-slate-700 hover:border-amber-500/50 text-slate-300 hover:text-amber-300 py-3 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Programar Nueva Rutina Espiritual</span>
            </button>
          </div>
        )}

        {/* ================= TAB 3: NOTAS Y DIARIO ESPIRITUAL ================= */}
        {activeTab === 'notas' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Meditaciones Personales ({notes.length})
              </span>

              <button
                onClick={() => setNewNoteModalOpen(true)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva Nota</span>
              </button>
            </div>

            {notes.length === 0 ? (
              <div className="py-12 bg-slate-900 border border-slate-800 rounded-3xl text-center p-6 space-y-2">
                <Sparkles className="w-8 h-8 text-amber-400 mx-auto opacity-60" />
                <p className="text-sm font-serif font-bold text-slate-200">
                  Tu Diario Espiritual está en blanco
                </p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Guarda las reflexiones de la Santa Misa, propósitos de oración y momentos de meditación personal.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notes.map((n) => (
                  <div
                    key={n.id}
                    className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2 relative group shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-serif font-bold text-amber-300">
                        {n.title}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-mono">{n.date}</span>
                        <button
                          onClick={() => handleDeleteNote(n.id)}
                          className="text-slate-600 hover:text-red-400 p-1"
                          title="Eliminar nota"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 font-serif leading-relaxed whitespace-pre-line">
                      {n.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Nueva Rutina */}
      {newRoutineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setNewRoutineModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-serif font-bold text-amber-300 mb-4">
              Programar Rutina Espiritual
            </h3>

            <form onSubmit={handleCreateRoutine} className="space-y-3.5">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Nombre de la Rutina</label>
                <input
                  type="text"
                  required
                  value={newRoutineTitle}
                  onChange={(e) => setNewRoutineTitle(e.target.value)}
                  placeholder="Ej: Visita al Santísimo, Coronilla..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Hora del Recordatorio</label>
                  <input
                    type="time"
                    required
                    value={newRoutineTime}
                    onChange={(e) => setNewRoutineTime(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">Categoría</label>
                  <select
                    value={newRoutineCategory}
                    onChange={(e) => setNewRoutineCategory(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="oracion">Oración</option>
                    <option value="rosario">Santo Rosario</option>
                    <option value="lectura">Lectura Bíblica</option>
                    <option value="meditacion">Meditación</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition-colors mt-2"
              >
                Guardar Rutina
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Nueva Nota */}
      {newNoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setNewNoteModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-serif font-bold text-amber-300 mb-4">
              Nueva Nota Espiritual
            </h3>

            <form onSubmit={handleSaveNote} className="space-y-3.5">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Título</label>
                <input
                  type="text"
                  required
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Ej: Meditación del Evangelio, Agradecimiento..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Contenido / Reflexión</label>
                <textarea
                  required
                  rows={5}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Escribe lo que el Señor ha puesto en tu corazón hoy..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 leading-relaxed font-serif"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition-colors mt-2"
              >
                Guardar en mi Diario
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
