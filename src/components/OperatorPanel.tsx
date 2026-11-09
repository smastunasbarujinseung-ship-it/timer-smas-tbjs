import React, { useState } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Check,
  Clock,
  Sparkles,
  Sliders,
  Tv,
} from 'lucide-react';
import { TIME_PRESETS, COMPETITION_TITLE_PRESETS, parseTimeToSeconds } from '../utils/timerEngine';
import { audioSystem } from '../utils/audioSystem';
import { SchoolCrest } from './SchoolCrest';

interface OperatorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  competitionTitle: string;
  onSaveTitle: (newTitle: string) => void;
  initialDurationSeconds: number;
  onSetDuration: (seconds: number) => void;
  isRunning: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  volume: number;
  onChangeVolume: (vol: number) => void;
  viewMode: 'OPERATOR' | 'DISPLAY';
  onToggleViewMode: () => void;
}

export const OperatorPanel: React.FC<OperatorPanelProps> = ({
  isOpen,
  onClose,
  competitionTitle,
  onSaveTitle,
  initialDurationSeconds,
  onSetDuration,
  isRunning,
  isMuted,
  onToggleMute,
  volume,
  onChangeVolume,
  viewMode,
  onToggleViewMode,
}) => {
  const [inputTitle, setInputTitle] = useState(competitionTitle);
  const [customMinutes, setCustomMinutes] = useState(Math.floor(initialDurationSeconds / 60));
  const [customSeconds, setCustomSeconds] = useState(initialDurationSeconds % 60);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Sync inputs if initial values change
  React.useEffect(() => {
    setInputTitle(competitionTitle);
  }, [competitionTitle]);

  React.useEffect(() => {
    setCustomMinutes(Math.floor(initialDurationSeconds / 60));
    setCustomSeconds(initialDurationSeconds % 60);
  }, [initialDurationSeconds]);

  const handleSaveTitle = (titleToSave?: string) => {
    const finalTitle = (titleToSave || inputTitle).trim() || 'LOMBA DEBAT KEBANGSAAN';
    onSaveTitle(finalTitle);
    showNotice('Judul berhasil disimpan!');
  };

  const handleSetCustomTime = () => {
    if (isRunning) {
      showNotice('Jeda (Pause) atau Reset timer sebelum mengubah durasi!');
      return;
    }
    const secs = parseTimeToSeconds(customMinutes, customSeconds);
    if (secs <= 0) {
      showNotice('Durasi waktu harus lebih dari 0 detik!');
      return;
    }
    onSetDuration(secs);
    showNotice(`Durasi waktu disimpan: ${Math.floor(secs / 60)} menit ${secs % 60} detik`);
  };

  const handleSelectPresetTime = (secs: number) => {
    if (isRunning) {
      showNotice('Jeda (Pause) atau Reset timer sebelum mengubah durasi!');
      return;
    }
    setCustomMinutes(Math.floor(secs / 60));
    setCustomSeconds(secs % 60);
    onSetDuration(secs);
    showNotice(`Waktu diatur ke preset: ${Math.floor(secs / 60)}m ${secs % 60}s`);
  };

  const showNotice = (msg: string) => {
    setSaveSuccessNotice(msg);
    setTimeout(() => setSaveSuccessNotice(null), 3000);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="operator-modal-title"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-[#FAF9F5] border-2 border-[#D4AF37] rounded-2xl shadow-2xl p-6 sm:p-8 text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-amber-200">
          <div className="flex items-center gap-3">
            <SchoolCrest size={40} className="w-10 h-10 shrink-0" />
            <div>
              <h2 id="operator-modal-title" className="text-xl font-bold font-display text-slate-900 tracking-tight">
                Panel Kontrol & Pengaturan Operator
              </h2>
              <p className="text-xs text-slate-500 font-body">
                SMAS Tunas Baru Jin Seung · Konfigurasi Judul, Durasi, Audio & Tampilan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onToggleViewMode}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                viewMode === 'DISPLAY'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white border border-amber-300 text-slate-700 hover:bg-amber-50'
              }`}
              title="Ganti Mode Tampilan"
            >
              <Tv className="w-4 h-4 text-amber-500" />
              <span>{viewMode === 'DISPLAY' ? 'Mode Display Aktif' : 'Pindah ke Mode Display'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Tutup Panel Pengaturan"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Temporary Notification Banner */}
        {saveSuccessNotice && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-sm flex items-center gap-2 shadow-xs animate-in fade-in duration-150">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{saveSuccessNotice}</span>
          </div>
        )}

        <div className="mt-6 space-y-8">
          {/* SECTION 1: JUDUL PERLOMBAAN */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="comp-title-input" className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                Judul Perlombaan Aktif
              </label>
              <span className="text-xs text-slate-500">
                Akan ditampilkan langsung di atas timer countdown
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                id="comp-title-input"
                type="text"
                value={inputTitle}
                onChange={(e) => setInputTitle(e.target.value)}
                placeholder="Contoh: LOMBA DEBAT KEBANGSAAN"
                className="flex-1 px-4 py-3 bg-white border-2 border-amber-300 focus:border-amber-600 focus:ring-2 focus:ring-amber-200 outline-none rounded-xl text-base font-semibold text-slate-900 shadow-inner"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveTitle()}
                  className="px-5 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-95 whitespace-nowrap"
                >
                  SIMPAN JUDUL
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleSaveTitle();
                    onClose();
                  }}
                  className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-95 whitespace-nowrap"
                >
                  TAMPILKAN TIMER
                </button>
              </div>
            </div>

            {/* Quick title presets */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Pilihan Judul Cepat:
              </p>
              <div className="flex flex-wrap gap-2">
                {COMPETITION_TITLE_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setInputTitle(preset);
                      handleSaveTitle(preset);
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all text-left ${
                      competitionTitle === preset
                        ? 'bg-amber-100 border-amber-400 text-amber-950 font-bold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-amber-300 hover:bg-amber-50/50'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 2: PENGATURAN WAKTU COUNTDOWN */}
          <div className="space-y-4 pt-4 border-t border-amber-200">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                Durasi Waktu Countdown
              </label>
              {isRunning && (
                <span className="text-xs px-2.5 py-1 bg-amber-100 text-amber-900 font-medium rounded-full border border-amber-300">
                  Timer Sedang Berjalan (Pause dahulu untuk edit)
                </span>
              )}
            </div>

            {/* Presets Grid */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Pilihan Preset Waktu:
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
                {TIME_PRESETS.map((preset) => {
                  const isSelected = initialDurationSeconds === preset.seconds;
                  return (
                    <button
                      key={preset.seconds}
                      type="button"
                      disabled={isRunning}
                      onClick={() => handleSelectPresetTime(preset.seconds)}
                      className={`py-2 px-1 text-xs font-bold rounded-xl border text-center transition-all ${
                        isSelected
                          ? 'bg-amber-600 border-amber-700 text-white shadow-sm ring-2 ring-amber-300'
                          : isRunning
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          : 'bg-white text-slate-700 border-amber-200 hover:border-amber-400 hover:bg-amber-50'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Minutes & Seconds Inputs */}
            <div className="p-4 bg-white border border-amber-200 rounded-xl space-y-3">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label htmlFor="custom-minutes" className="text-xs font-bold text-slate-600 uppercase">
                    Menit:
                  </label>
                  <input
                    id="custom-minutes"
                    type="number"
                    min="0"
                    max="99"
                    value={customMinutes}
                    disabled={isRunning}
                    onChange={(e) => setCustomMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-20 px-3 py-2 bg-[#FAF9F5] border border-amber-300 focus:border-amber-600 rounded-lg text-center font-bold text-lg text-slate-900"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label htmlFor="custom-seconds" className="text-xs font-bold text-slate-600 uppercase">
                    Detik:
                  </label>
                  <input
                    id="custom-seconds"
                    type="number"
                    min="0"
                    max="59"
                    value={customSeconds}
                    disabled={isRunning}
                    onChange={(e) => setCustomSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                    className="w-20 px-3 py-2 bg-[#FAF9F5] border border-amber-300 focus:border-amber-600 rounded-lg text-center font-bold text-lg text-slate-900"
                  />
                </div>

                {/* Quick adjustments */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={isRunning}
                    onClick={() => setCustomSeconds((s) => Math.min(59, s + 10))}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-amber-100 border border-slate-300 text-xs font-bold rounded-lg transition-colors"
                  >
                    +10s
                  </button>
                  <button
                    type="button"
                    disabled={isRunning}
                    onClick={() => setCustomMinutes((m) => m + 1)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-amber-100 border border-slate-300 text-xs font-bold rounded-lg transition-colors"
                  >
                    +1m
                  </button>
                  <button
                    type="button"
                    disabled={isRunning}
                    onClick={() => setCustomMinutes((m) => Math.max(0, m - 1))}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-amber-100 border border-slate-300 text-xs font-bold rounded-lg transition-colors"
                  >
                    -1m
                  </button>
                </div>

                <button
                  type="button"
                  disabled={isRunning}
                  onClick={handleSetCustomTime}
                  className={`ml-auto px-6 py-2.5 font-bold text-sm rounded-xl transition-all shadow-md active:scale-95 ${
                    isRunning
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-amber-600 hover:bg-amber-700 text-white'
                  }`}
                >
                  SET WAKTU
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 3: KONTROL AUDIO DAN SOUND EFFECT */}
          <div className="space-y-4 pt-4 border-t border-amber-200">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-amber-600" />
                Sistem Audio & Efek Suara
              </label>
              <button
                type="button"
                onClick={onToggleMute}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  isMuted
                    ? 'bg-rose-100 border-rose-300 text-rose-800'
                    : 'bg-emerald-100 border-emerald-300 text-emerald-800'
                }`}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span>{isMuted ? 'SOUND OFF (Bisu)' : 'SOUND ON (Aktif)'}</span>
              </button>
            </div>

            <div className="p-4 bg-white border border-amber-200 rounded-xl space-y-4">
              {/* Volume Slider */}
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-600 uppercase w-20">Volume:</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(volume * 100)}
                  onChange={(e) => onChangeVolume(parseInt(e.target.value) / 100)}
                  className="flex-1 accent-amber-600 cursor-pointer"
                  disabled={isMuted}
                />
                <span className="text-sm font-bold text-slate-800 w-12 text-right">
                  {Math.round(volume * 100)}%
                </span>
              </div>

              {/* Sound Test Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase mr-2">
                  Uji Audio:
                </span>
                <button
                  type="button"
                  onClick={() => audioSystem.playNormalTick()}
                  disabled={isMuted}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-amber-100 border border-slate-300 hover:border-amber-400 rounded-xl text-xs font-bold text-slate-800 flex items-center gap-1.5 transition-colors active:scale-95 disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 text-amber-700" />
                  TEST SOUND (Detik Normal)
                </button>
                <button
                  type="button"
                  onClick={() => audioSystem.playCriticalTick(5)}
                  disabled={isMuted}
                  className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl text-xs font-bold text-amber-900 flex items-center gap-1.5 transition-colors active:scale-95 disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 text-amber-700" />
                  TEST COUNTDOWN (10s Kritis)
                </button>
                <button
                  type="button"
                  onClick={() => audioSystem.playTimeUpAlarm()}
                  disabled={isMuted}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-xl text-xs font-bold text-rose-900 flex items-center gap-1.5 transition-colors active:scale-95 disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 text-rose-700" />
                  TEST WAKTU HABIS (Buzzer)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer controls */}
        <div className="mt-8 pt-4 border-t border-amber-200 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Tip: Tekan tombol <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-[11px] font-mono">Spasi</kbd> untuk Start/Pause, <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-[11px] font-mono">R</kbd> untuk Reset, <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-[11px] font-mono">F</kbd> untuk Fullscreen.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-95"
          >
            Tutup Panel
          </button>
        </div>
      </div>
    </div>
  );
};
