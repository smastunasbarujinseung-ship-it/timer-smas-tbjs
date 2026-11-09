import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Volume2,
  VolumeX,
  Sliders,
  Tv,
  AlertTriangle,
  Award,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { SchoolCrest } from './components/SchoolCrest';
import { OperatorPanel } from './components/OperatorPanel';
import { FlagCelebration } from './components/FlagCelebration';
import {
  formatTime,
  getTimerStatus,
  calculateRemainingSeconds,
  TimerStatus,
} from './utils/timerEngine';
import { audioSystem } from './utils/audioSystem';

export default function App() {
  // Timer settings & states
  const [competitionTitle, setCompetitionTitle] = useState('LOMBA DEBAT KEBANGSAAN');
  const [initialDurationSeconds, setInitialDurationSeconds] = useState(120); // 2 minutes default
  const [remainingSeconds, setRemainingSeconds] = useState(120);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);

  // Audio states
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.85);

  // Fullscreen state & notices
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenNotice, setFullscreenNotice] = useState<string | null>(null);

  // Operator drawer & mode
  const [isOperatorOpen, setIsOperatorOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'OPERATOR' | 'DISPLAY'>('OPERATOR');

  // Merah Putih flag celebration on Reset
  const [showFlagCelebration, setShowFlagCelebration] = useState(false);

  // Timestamp tracking for drift-free precision
  const timerStartTimestampRef = useRef<number | null>(null);
  const elapsedOffsetRef = useRef<number>(0);
  const animFrameIdRef = useRef<number | null>(null);
  const lastTickSecondRef = useRef<number | null>(null);

  // Unlock Web Audio on any click
  const ensureAudioUnlocked = useCallback(() => {
    audioSystem.initOnUserGesture();
  }, []);

  // Sync remainingSeconds when initialDurationSeconds changes while idle (not time up)
  useEffect(() => {
    if (!isRunning && !isPaused && !isTimeUp) {
      setRemainingSeconds(initialDurationSeconds);
    }
  }, [initialDurationSeconds, isRunning, isPaused, isTimeUp]);

  // Track fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Master countdown tick loop using requestAnimationFrame + Date.now()
  useEffect(() => {
    if (!isRunning) {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      return;
    }

    if (timerStartTimestampRef.current === null) {
      timerStartTimestampRef.current = Date.now();
    }

    const tick = () => {
      const now = Date.now();
      const currentElapsedMs = now - (timerStartTimestampRef.current || now) + elapsedOffsetRef.current;
      const calculatedRemaining = calculateRemainingSeconds(initialDurationSeconds, currentElapsedMs);

      setRemainingSeconds(calculatedRemaining);

      // Trigger audio on whole-second transitions
      if (lastTickSecondRef.current !== calculatedRemaining) {
        lastTickSecondRef.current = calculatedRemaining;

        if (calculatedRemaining > 10) {
          audioSystem.playNormalTick();
        } else if (calculatedRemaining > 0) {
          audioSystem.playCriticalTick(calculatedRemaining);
        } else if (calculatedRemaining === 0) {
          // Time Up reached
          audioSystem.playTimeUpAlarm();
          setIsTimeUp(true);
          setRemainingSeconds(0);
          setIsRunning(false);
          setIsPaused(false);
          timerStartTimestampRef.current = null;
          elapsedOffsetRef.current = 0;
          return;
        }
      }

      if (calculatedRemaining > 0) {
        animFrameIdRef.current = requestAnimationFrame(tick);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
    };
  }, [isRunning, initialDurationSeconds]);

  // Timer controls
  const handleStart = () => {
    ensureAudioUnlocked();
    if (isTimeUp || remainingSeconds <= 0) {
      // Re-initialize if already at zero
      setRemainingSeconds(initialDurationSeconds);
      setIsTimeUp(false);
      elapsedOffsetRef.current = 0;
    }
    timerStartTimestampRef.current = Date.now();
    lastTickSecondRef.current = remainingSeconds;
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    if (!isRunning) return;
    if (timerStartTimestampRef.current) {
      elapsedOffsetRef.current += Date.now() - timerStartTimestampRef.current;
    }
    timerStartTimestampRef.current = null;
    setIsRunning(false);
    setIsPaused(true);
  };

  const handleResume = () => {
    ensureAudioUnlocked();
    timerStartTimestampRef.current = Date.now();
    lastTickSecondRef.current = remainingSeconds;
    setIsRunning(true);
    setIsPaused(false);
  };

  const handleReset = () => {
    ensureAudioUnlocked();
    // 1. Stop animation and reset timestamps
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    setIsRunning(false);
    setIsPaused(false);
    setIsTimeUp(false);
    timerStartTimestampRef.current = null;
    elapsedOffsetRef.current = 0;
    lastTickSecondRef.current = null;

    // 2. Stop all playing audios
    audioSystem.stopAllSounds();

    // 3. Reset to duration
    setRemainingSeconds(initialDurationSeconds);

    // 4. Trigger ceremonial Indonesian flag celebration
    setShowFlagCelebration(true);
  };

  // Fullscreen handlers
  const handleRequestFullscreen = async () => {
    ensureAudioUnlocked();
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
        setFullscreenNotice(null);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      setFullscreenNotice('Browser membatasi fullscreen otomatis. Silakan klik tombol sekali lagi.');
      setTimeout(() => setFullscreenNotice(null), 4000);
    }
  };

  const handleForceFullscreen = async () => {
    ensureAudioUnlocked();
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
      setFullscreenNotice('Mode Fullscreen diaktifkan.');
      setTimeout(() => setFullscreenNotice(null), 3000);
    } catch {
      setFullscreenNotice('Gagal mengaktifkan fullscreen. Gunakan tombol F11 pada keyboard atau klik layar.');
      setTimeout(() => setFullscreenNotice(null), 5000);
    }
  };

  // Audio handlers
  const handleToggleMute = () => {
    ensureAudioUnlocked();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioSystem.setMuted(nextMuted);
  };

  const handleChangeVolume = (vol: number) => {
    setVolume(vol);
    audioSystem.setVolume(vol);
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (isRunning) {
          handlePause();
        } else if (isPaused) {
          handleResume();
        } else {
          handleStart();
        }
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleReset();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        handleRequestFullscreen();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        handleToggleMute();
      } else if (e.key === 'o' || e.key === 'O') {
        e.preventDefault();
        setIsOperatorOpen((prev) => !prev);
      } else if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        setViewMode((v) => (v === 'OPERATOR' ? 'DISPLAY' : 'OPERATOR'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const timerStatus: TimerStatus = getTimerStatus(
    remainingSeconds,
    initialDurationSeconds,
    isRunning,
    isPaused,
    isTimeUp
  );
  const timeFormatted = formatTime(remainingSeconds);

  // Status visual cues
  const getStatusBadge = () => {
    switch (timerStatus) {
      case 'RUNNING':
        return (
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs md:text-sm font-bold tracking-wider uppercase bg-emerald-100/90 text-emerald-900 border border-emerald-400 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
            Waktu Berjalan
          </span>
        );
      case 'PAUSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs md:text-sm font-bold tracking-wider uppercase bg-amber-100/90 text-amber-900 border border-amber-400 shadow-xs">
            <Pause className="w-3.5 h-3.5 text-amber-700" />
            Timer Dijeda
          </span>
        );
      case 'CRITICAL_10S':
        return (
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs md:text-sm font-bold tracking-wider uppercase bg-amber-500 text-white border border-amber-600 shadow-md animate-dramatic-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-white" />
            10 Detik Terakhir!
          </span>
        );
      case 'CRITICAL_5S':
        return (
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs md:text-sm font-bold tracking-wider uppercase bg-red-600 text-white border border-red-700 shadow-lg animate-urgent-pulse">
            <AlertTriangle className="w-4 h-4 text-white" />
            5 Detik Kritis!
          </span>
        );
      case 'TIME_UP':
        return (
          <span className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm md:text-base font-extrabold tracking-widest uppercase bg-red-600 text-white border-2 border-amber-300 shadow-xl animate-urgent-pulse">
            Waktu Habis!
          </span>
        );
      case 'IDLE':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs md:text-sm font-bold tracking-wider uppercase bg-slate-100 text-slate-700 border border-slate-300 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            Timer Siap
          </span>
        );
    }
  };

  return (
    <div
      onClick={ensureAudioUnlocked}
      className="relative w-screen h-screen min-h-screen bg-[#FAF9F5] text-slate-900 flex flex-col justify-between overflow-hidden select-none"
    >
      {/* Background Architectural Golden Filigree Ornaments */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-40"
        aria-hidden="true"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(212, 175, 55, 0.08) 0%, transparent 65%),
            linear-gradient(to right, rgba(212, 175, 55, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(212, 175, 55, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 60px 60px, 60px 60px',
        }}
      />

      {/* Golden Corner Accents for 75" Flat Panel Frame */}
      <div className="pointer-events-none absolute top-3 left-3 w-16 h-16 border-t-2 border-l-2 border-[#D4AF37] opacity-60" />
      <div className="pointer-events-none absolute top-3 right-3 w-16 h-16 border-t-2 border-r-2 border-[#D4AF37] opacity-60" />
      <div className="pointer-events-none absolute bottom-3 left-3 w-16 h-16 border-b-2 border-l-2 border-[#D4AF37] opacity-60" />
      <div className="pointer-events-none absolute bottom-3 right-3 w-16 h-16 border-b-2 border-r-2 border-[#D4AF37] opacity-60" />

      {/* Merah Putih Flag Celebration Effect on Reset */}
      <FlagCelebration
        active={showFlagCelebration}
        onComplete={() => setShowFlagCelebration(false)}
      />

      {/* Floating Fullscreen Error / Notice */}
      {fullscreenNotice && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-2.5 bg-slate-900/90 text-amber-200 border border-amber-400 rounded-full text-xs md:text-sm font-semibold shadow-xl backdrop-blur-sm animate-in fade-in">
          {fullscreenNotice}
        </div>
      )}

      {/* =========================================================================
          BAGIAN ATAS (HEADER RESMI)
          Tulisan OFFICIAL COMPETITION TIMER · Nama SMAS TUNAS BARU JIN SEUNG · Garis Emas
          ========================================================================= */}
      <header className="relative z-10 w-full pt-4 md:pt-6 px-6 md:px-12 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left: Official School Crest & Brand Identity */}
          <div className="flex items-center gap-3 md:gap-4">
            <SchoolCrest size={64} className="w-14 h-14 md:w-16 md:h-16" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] md:text-xs tracking-[0.25em] uppercase font-bold text-amber-800/90 font-display">
                  Sistem Timer Resmi
                </span>
                <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span className="hidden sm:inline-block text-[10px] md:text-xs text-slate-500 tracking-wider uppercase font-semibold">
                  Tingkat Sekolah & Nasional
                </span>
              </div>
              <h1 className="text-base sm:text-lg md:text-2xl font-black font-brand tracking-wide text-slate-900 uppercase">
                SMAS TUNAS BARU JIN SEUNG
              </h1>
            </div>
          </div>

          {/* Center/Right: OFFICIAL COMPETITION TIMER Title & Quick Utility */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] md:text-xs uppercase font-extrabold tracking-[0.3em] text-amber-700 block font-display">
                Official
              </span>
              <span className="text-sm sm:text-base md:text-xl font-black tracking-wider uppercase font-brand text-slate-900">
                Competition Timer
              </span>
            </div>

            {/* Top Quick Action Buttons */}
            <div className="flex items-center gap-1.5 ml-2">
              <button
                type="button"
                onClick={handleToggleMute}
                className="p-2 md:p-2.5 rounded-xl bg-white/80 hover:bg-white border border-amber-200 text-slate-700 shadow-xs hover:border-amber-400 transition-colors"
                title={isMuted ? 'Aktifkan Suara' : 'Bisukan Suara'}
                aria-label={isMuted ? 'Aktifkan Suara' : 'Bisukan Suara'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-600" /> : <Volume2 className="w-4 h-4 text-emerald-700" />}
              </button>

              <button
                type="button"
                onClick={() => setViewMode((v) => (v === 'OPERATOR' ? 'DISPLAY' : 'OPERATOR'))}
                className={`p-2 md:p-2.5 rounded-xl border shadow-xs transition-colors ${
                  viewMode === 'DISPLAY'
                    ? 'bg-amber-600 text-white border-amber-700'
                    : 'bg-white/80 hover:bg-white border-amber-200 text-slate-700 hover:border-amber-400'
                }`}
                title={viewMode === 'DISPLAY' ? 'Kembali ke Mode Operator' : 'Mode Display Panggung'}
                aria-label="Ganti Mode Tampilan"
              >
                <Tv className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsOperatorOpen(true)}
                className="p-2 md:p-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-sm transition-all active:scale-95"
                title="Buka Pengaturan Operator"
                aria-label="Buka Pengaturan Operator"
              >
                <Sliders className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Elegant Gold Decorative Line with Center Diamond Finial */}
        <div className="relative mt-3 md:mt-4 max-w-7xl mx-auto flex items-center">
          <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-[#D4AF37]" />
          <div className="mx-3 flex items-center gap-1">
            <span className="w-2 h-2 rotate-45 bg-[#D4AF37]" />
            <span className="w-3 h-3 rotate-45 bg-gradient-to-br from-amber-300 to-amber-600 shadow-xs" />
            <span className="w-2 h-2 rotate-45 bg-[#D4AF37]" />
          </div>
          <div className="flex-1 h-[2px] bg-gradient-to-l from-transparent via-[#D4AF37] to-[#D4AF37]" />
        </div>
      </header>

      {/* =========================================================================
          BAGIAN TENGAH (STAGE UTAMA - OPTIMALISASI 75 INCI)
          Judul Perlombaan Aktif · Angka Timer Sangat Besar MM:SS · Status & Banner Waktu Habis
          ========================================================================= */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 md:px-8 py-2 max-w-7xl mx-auto w-full">
        {/* Active Competition Title Card */}
        <div className="mb-2 md:mb-4 text-center">
          <div className="inline-flex items-center gap-2 px-5 md:px-8 py-2 md:py-2.5 bg-white/95 border-2 border-[#D4AF37] rounded-2xl shadow-md">
            <Award className="w-4 h-4 md:w-5 md:h-5 text-amber-600 shrink-0" />
            <span
              className="text-base sm:text-xl md:text-3xl font-black uppercase tracking-wide text-slate-900 font-display text-wrap-balance"
              style={{ letterSpacing: '0.04em' }}
            >
              {competitionTitle}
            </span>
            <Award className="w-4 h-4 md:w-5 md:h-5 text-amber-600 shrink-0" />

            {/* Quick edit title button in Operator mode */}
            {viewMode === 'OPERATOR' && (
              <button
                type="button"
                onClick={() => setIsOperatorOpen(true)}
                className="ml-2 px-2.5 py-1 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors"
                title="Ubah Judul Perlombaan"
              >
                Ubah Judul
              </button>
            )}
          </div>
        </div>

        {/* Master Timer Card Container */}
        <div
          className={`relative w-full max-w-5xl mx-auto ${
            viewMode === 'DISPLAY' ? 'py-8 md:py-14' : 'py-6 md:py-10'
          } px-4 md:px-12 rounded-3xl bg-white border-2 transition-all duration-300 flex flex-col items-center justify-center ${
            timerStatus === 'TIME_UP'
              ? 'border-red-600 shadow-[0_25px_60px_rgba(220,38,38,0.35)] ring-4 ring-red-400/50'
              : timerStatus === 'CRITICAL_5S'
              ? 'border-red-500 shadow-[0_25px_60px_rgba(220,38,38,0.3)] ring-4 ring-amber-400/50'
              : timerStatus === 'CRITICAL_10S'
              ? 'border-amber-500 shadow-[0_20px_50px_rgba(217,119,6,0.25)] ring-2 ring-amber-300'
              : 'border-[#D4AF37]/80 shadow-[0_20px_50px_rgba(180,140,50,0.12)]'
          }`}
        >
          {/* Subtle Inner Gold Inset Frame */}
          <div className="pointer-events-none absolute inset-3 rounded-2xl border border-amber-300/40" />

          {/* THE GIANT COUNTDOWN NUMBERS (MAXIMIZED FOR 75 INCH IFP) */}
          <div
            className={`font-timer font-bold tracking-tight text-slate-950 flex items-center justify-center leading-none transition-transform duration-200 ${
              timerStatus === 'CRITICAL_5S'
                ? 'animate-urgent-pulse text-red-600'
                : timerStatus === 'CRITICAL_10S'
                ? 'animate-dramatic-pulse text-amber-900'
                : timerStatus === 'TIME_UP'
                ? 'text-red-600'
                : ''
            }`}
            style={{
              fontSize: viewMode === 'DISPLAY' ? 'clamp(6.5rem, 19vw, 17.5rem)' : 'clamp(5.5rem, 16vw, 15.5rem)',
              textShadow:
                timerStatus === 'TIME_UP' || timerStatus === 'CRITICAL_5S'
                  ? '0 8px 30px rgba(220, 38, 38, 0.25)'
                  : '0 8px 24px rgba(0, 0, 0, 0.08)',
            }}
          >
            <span>{timeFormatted.minutes}</span>
            <span className="relative -top-1 md:-top-3 px-1 md:px-4 opacity-70 animate-pulse">:</span>
            <span>{timeFormatted.seconds}</span>
          </div>

          {/* DRAMATIC WAKTU HABIS OVERLAY BANNER */}
          {timerStatus === 'TIME_UP' && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/95 rounded-3xl animate-banner-reveal p-6 border-4 border-red-600 shadow-2xl">
              <div className="flex items-center gap-3 text-red-600 mb-2">
                <AlertTriangle className="w-8 h-8 md:w-12 md:h-12 animate-bounce" />
                <span className="text-xs md:text-base font-extrabold tracking-[0.3em] uppercase text-red-700 font-display">
                  Pemberitahuan Resmi Dewan Juri
                </span>
                <AlertTriangle className="w-8 h-8 md:w-12 md:h-12 animate-bounce" />
              </div>

              <h2
                className="font-black text-red-600 font-display tracking-tight text-center leading-none"
                style={{ fontSize: 'clamp(3rem, 10vw, 7.5rem)' }}
              >
                WAKTU HABIS!
              </h2>

              <p className="mt-2 md:mt-3 text-sm md:text-xl font-bold text-slate-800 text-center font-body">
                Waktu penampilan untuk <span className="text-amber-800 font-extrabold">{competitionTitle}</span> telah berakhir.
              </p>

              <button
                type="button"
                onClick={handleReset}
                className="mt-5 px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-base font-bold rounded-2xl shadow-lg transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-5 h-5" />
                RESET UNTUK PESERTA BERIKUTNYA
              </button>
            </div>
          )}

          {/* Real-time Status Indicator Pill under Timer */}
          <div className="mt-3 md:mt-6 z-10">
            {getStatusBadge()}
          </div>
        </div>
      </main>

      {/* =========================================================================
          BAGIAN BAWAH (CONTROL DECK UTAMA)
          START · PAUSE · RESUME · RESET · FULLSCREEN · FORCE FULLSCREEN
          ========================================================================= */}
      <footer className="relative z-10 w-full pb-4 md:pb-6 px-6 md:px-12 shrink-0">
        <div
          className={`max-w-5xl mx-auto flex flex-wrap items-center justify-center transition-all ${
            viewMode === 'DISPLAY'
              ? 'gap-2 sm:gap-3 p-2 bg-white/70 backdrop-blur-md rounded-2xl border border-amber-300 shadow-sm'
              : 'gap-2.5 sm:gap-4 md:gap-6'
          }`}
        >
          {/* 1. START / RESUME BUTTON */}
          {!isRunning ? (
            isPaused ? (
              <button
                type="button"
                onClick={handleResume}
                className={`flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-extrabold rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 border border-emerald-500 cursor-pointer ${
                  viewMode === 'DISPLAY'
                    ? 'px-5 py-2.5 text-xs sm:text-sm'
                    : 'px-6 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base md:text-lg'
                }`}
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                <span>RESUME</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStart}
                className={`flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 border border-emerald-500 cursor-pointer ${
                  viewMode === 'DISPLAY'
                    ? 'px-6 py-2.5 text-xs sm:text-sm'
                    : 'px-8 sm:px-10 py-3.5 sm:py-4 text-sm sm:text-base md:text-lg'
                }`}
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                <span>START</span>
              </button>
            )
          ) : (
            /* 2. PAUSE BUTTON */
            <button
              type="button"
              onClick={handlePause}
              className={`flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 border border-amber-400 cursor-pointer ${
                viewMode === 'DISPLAY'
                  ? 'px-6 py-2.5 text-xs sm:text-sm'
                  : 'px-8 sm:px-10 py-3.5 sm:py-4 text-sm sm:text-base md:text-lg'
              }`}
            >
              <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              <span>PAUSE</span>
            </button>
          )}

          {/* 3. RESET BUTTON */}
          <button
            type="button"
            onClick={handleReset}
            className={`flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 border border-slate-700 cursor-pointer ${
              viewMode === 'DISPLAY'
                ? 'px-5 py-2.5 text-xs sm:text-sm'
                : 'px-6 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base md:text-lg'
            }`}
          >
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>RESET</span>
          </button>

          {/* 4. FULLSCREEN BUTTON (WAJIB) */}
          <button
            type="button"
            onClick={handleRequestFullscreen}
            className={`flex items-center gap-2 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white font-black rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 border border-amber-500 cursor-pointer ${
              viewMode === 'DISPLAY'
                ? 'px-5 py-2.5 text-xs sm:text-sm'
                : 'px-6 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base md:text-lg'
            }`}
          >
            <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>{isFullscreen ? 'KELUAR FULLSCREEN' : 'FULLSCREEN MODE'}</span>
          </button>

          {/* 5. FORCE FULLSCREEN BUTTON */}
          <button
            type="button"
            onClick={handleForceFullscreen}
            className={`flex items-center gap-1.5 bg-white hover:bg-amber-50 text-slate-800 font-bold rounded-2xl shadow-md border-2 border-[#D4AF37] transition-all active:scale-95 cursor-pointer ${
              viewMode === 'DISPLAY'
                ? 'px-4 py-2 text-xs sm:text-sm'
                : 'px-4 sm:px-5 py-3.5 sm:py-4 text-xs sm:text-sm md:text-base'
            }`}
            title="Paksa aktifkan layar penuh kembali jika keluar secara tidak sengaja"
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
            <span>FORCE FULLSCREEN</span>
          </button>

          {/* Return to Operator mode toggle if in Display mode */}
          {viewMode === 'DISPLAY' && (
            <button
              type="button"
              onClick={() => setViewMode('OPERATOR')}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs sm:text-sm rounded-2xl border border-amber-300 transition-all cursor-pointer"
              title="Kembali ke Mode Operator"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-700" />
              <span>MODE OPERATOR</span>
            </button>
          )}
        </div>

        {/* Footer Subtext Information */}
        <div className="mt-3 text-center">
          <p className="text-[11px] md:text-xs text-slate-500 font-body">
            Official Competition Countdown Timer · SMAS Tunas Baru Jin Seung · Layar 75" Interactive Flat Panel (16:9)
          </p>
        </div>
      </footer>

      {/* Operator Settings Modal / Drawer */}
      <OperatorPanel
        isOpen={isOperatorOpen}
        onClose={() => setIsOperatorOpen(false)}
        competitionTitle={competitionTitle}
        onSaveTitle={setCompetitionTitle}
        initialDurationSeconds={initialDurationSeconds}
        onSetDuration={(secs) => {
          setInitialDurationSeconds(secs);
          setRemainingSeconds(secs);
        }}
        isRunning={isRunning}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        volume={volume}
        onChangeVolume={handleChangeVolume}
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode((v) => (v === 'OPERATOR' ? 'DISPLAY' : 'OPERATOR'))}
      />
    </div>
  );
}
