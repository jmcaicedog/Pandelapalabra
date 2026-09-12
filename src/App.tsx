/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { subscribeToAuth, initializeUserRecord } from './lib/firebase.ts';
import { BottomNav, type TabType } from './components/BottomNav.tsx';
import { LiturgyView } from './components/LiturgyView.tsx';
import { BibleView } from './components/BibleView.tsx';
import { PrayersView } from './components/PrayersView.tsx';
import { CalendarView } from './components/CalendarView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import type { User } from 'firebase/auth';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('liturgia');
  const [targetLiturgyDate, setTargetLiturgyDate] = useState<string | undefined>(undefined);
  const [user, setUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // App settings state with localStorage persistence
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('lumen_font_size');
    return saved ? parseInt(saved, 10) : 18;
  });

  const [calendarRegion, setCalendarRegion] = useState<string>(() => {
    return localStorage.getItem('lumen_cal_region') || 'Universal';
  });

  const [prayerStyle, setPrayerStyle] = useState<'sacred' | 'minimal'>(() => {
    return (localStorage.getItem('lumen_prayer_style') as any) || 'sacred';
  });

  const [audioEnabled, setAudioEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('lumen_audio_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('lumen_dark_mode');
    return saved !== null ? saved === 'true' : true;
  });

  // Subscribe to Firebase Auth
  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await initializeUserRecord(currentUser);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateFontSize = (size: number) => {
    setFontSize(size);
    localStorage.setItem('lumen_font_size', size.toString());
  };

  const handleUpdateCalendarRegion = (reg: string) => {
    setCalendarRegion(reg);
    localStorage.setItem('lumen_cal_region', reg);
  };

  const handleUpdatePrayerStyle = (st: 'sacred' | 'minimal') => {
    setPrayerStyle(st);
    localStorage.setItem('lumen_prayer_style', st);
  };

  const handleUpdateAudioEnabled = (enabled: boolean) => {
    setAudioEnabled(enabled);
    localStorage.setItem('lumen_audio_enabled', enabled.toString());
  };

  const handleUpdateDarkMode = (val: boolean) => {
    setDarkMode(val);
    localStorage.setItem('lumen_dark_mode', val.toString());
  };

  const handleNavigateToLiturgyWithDate = (date?: string) => {
    if (date) {
      setTargetLiturgyDate(date);
    }
    setCurrentTab('liturgia');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      id="pan-vivo-app-root"
      className={`min-h-screen flex justify-center selection:bg-amber-500/30 selection:text-amber-200 transition-colors duration-300 ${
        darkMode ? 'bg-[#0c0805] text-slate-100' : 'bg-[#f4efe8] text-stone-900'
      }`}
    >
      {/* Mobile-centric frame shell */}
      <main
        className={`w-full max-w-md sm:max-w-lg md:max-w-xl min-h-screen border-x shadow-2xl relative flex flex-col transition-colors duration-300 ${
          darkMode ? 'bg-[#110c08] border-amber-950/40' : 'bg-[#faf7f2] border-stone-300'
        }`}
      >
        {/* Active Tab View */}
        <div className="flex-1">
          {currentTab === 'liturgia' && (
            <LiturgyView
              user={user}
              initialDate={targetLiturgyDate}
              onNavigateTab={(tab) => {
                setCurrentTab(tab);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}

          {currentTab === 'biblia' && (
            <BibleView
              user={user}
              fontSize={fontSize}
              onUpdateFontSize={handleUpdateFontSize}
            />
          )}

          {currentTab === 'oraciones' && (
            <PrayersView
              user={user}
              prayerStyle={prayerStyle}
              onSelectTab={(tab) => setCurrentTab(tab as TabType)}
            />
          )}

          {currentTab === 'calendario' && (
            <CalendarView
              user={user}
              onNavigateToLiturgy={handleNavigateToLiturgyWithDate}
            />
          )}

          {currentTab === 'ajustes' && (
            <SettingsView
              user={user}
              onOpenAuth={() => setAuthModalOpen(true)}
              fontSize={fontSize}
              onUpdateFontSize={handleUpdateFontSize}
              calendarRegion={calendarRegion}
              onUpdateCalendarRegion={handleUpdateCalendarRegion}
              prayerStyle={prayerStyle}
              onUpdatePrayerStyle={handleUpdatePrayerStyle}
              audioEnabled={audioEnabled}
              onUpdateAudioEnabled={handleUpdateAudioEnabled}
              darkMode={darkMode}
              onUpdateDarkMode={handleUpdateDarkMode}
            />
          )}
        </div>

        {/* Global Bottom Navigation */}
        <BottomNav
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />

        {/* Auth Modal for Firebase Login / Registration */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => setAuthModalOpen(false)}
        />
      </main>
    </div>
  );
}

