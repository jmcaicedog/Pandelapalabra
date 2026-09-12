import React from 'react';
import { BookOpen, BookText, Plus, Calendar as CalendarIcon, Settings } from 'lucide-react';

export type TabType = 'liturgia' | 'biblia' | 'oraciones' | 'calendario' | 'ajustes';

interface BottomNavProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  return (
    <nav
      id="bottom-navigation-bar"
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#140e09]/95 backdrop-blur-md border-t border-amber-950/60 px-3 py-2 max-w-md mx-auto sm:max-w-lg md:max-w-xl transition-all"
    >
      <div className="flex items-center justify-between relative">
        {/* 1. Liturgia */}
        <button
          id="nav-tab-liturgia"
          onClick={() => onSelectTab('liturgia')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            currentTab === 'liturgia'
              ? 'text-amber-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className={`w-5 h-5 mb-0.5 ${currentTab === 'liturgia' ? 'text-amber-400 stroke-[2.4]' : ''}`} />
          <span className="text-[11px] tracking-tight">Liturgia</span>
        </button>

        {/* 2. Biblia */}
        <button
          id="nav-tab-biblia"
          onClick={() => onSelectTab('biblia')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            currentTab === 'biblia'
              ? 'text-amber-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookText className={`w-5 h-5 mb-0.5 ${currentTab === 'biblia' ? 'text-amber-400 stroke-[2.4]' : ''}`} />
          <span className="text-[11px] tracking-tight">Biblia</span>
        </button>

        {/* 3. Oraciones (Prominent center cross/plus button as in screenshots) */}
        <button
          id="nav-tab-oraciones"
          onClick={() => onSelectTab('oraciones')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            currentTab === 'oraciones'
              ? 'text-amber-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center -mt-4 shadow-lg transition-transform active:scale-95 ${
              currentTab === 'oraciones'
                ? 'bg-amber-500 text-slate-950 shadow-amber-500/25 ring-2 ring-amber-400/40'
                : 'bg-[#221911] text-amber-400 border border-amber-900/40 hover:bg-[#2b1f16]'
            }`}
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="text-[11px] tracking-tight mt-0.5">Oraciones</span>
        </button>

        {/* 4. Calendario */}
        <button
          id="nav-tab-calendario"
          onClick={() => onSelectTab('calendario')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            currentTab === 'calendario'
              ? 'text-amber-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CalendarIcon className={`w-5 h-5 mb-0.5 ${currentTab === 'calendario' ? 'text-amber-400 stroke-[2.4]' : ''}`} />
          <span className="text-[11px] tracking-tight">Calendario</span>
        </button>

        {/* 5. Ajustes */}
        <button
          id="nav-tab-ajustes"
          onClick={() => onSelectTab('ajustes')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            currentTab === 'ajustes'
              ? 'text-amber-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className={`w-5 h-5 mb-0.5 ${currentTab === 'ajustes' ? 'text-amber-400 stroke-[2.4]' : ''}`} />
          <span className="text-[11px] tracking-tight">Ajustes</span>
        </button>
      </div>
    </nav>
  );
};
