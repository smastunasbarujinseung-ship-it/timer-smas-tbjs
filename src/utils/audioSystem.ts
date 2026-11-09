/**
 * Web Audio API Engine for Official Competition Timer
 * SMAS Tunas Baru Jin Seung
 *
 * Fully synthesized in-browser: 100% offline, zero network latency,
 * guaranteed instant response on any device.
 */

class AudioSystem {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.8; // 0.0 to 1.0
  private currentAlarmNodes: { stop: () => void }[] = [];

  constructor() {
    // Lazy AudioContext initialization on first user interaction
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Unlock AudioContext on initial user gesture
   */
  public initOnUserGesture(): void {
    const ctx = this.getContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted) {
      this.stopAllSounds();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public getVolume(): number {
    return this.volume;
  }

  public stopAllSounds(): void {
    this.currentAlarmNodes.forEach((node) => {
      try {
        node.stop();
      } catch {
        // already stopped
      }
    });
    this.currentAlarmNodes = [];
  }

  /**
   * Normal Second Tick: Crisp, high-precision tournament ticking sound.
   */
  public playNormalTick(): void {
    if (this.isMuted || this.volume <= 0) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(this.volume * 0.45, now);
    masterGain.connect(ctx.destination);

    // High frequency crisp attack click
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(2200, now);
    osc1.frequency.exponentialRampToValueAtTime(600, now + 0.035);

    gain1.gain.setValueAtTime(0.8, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc1.connect(gain1);
    gain1.connect(masterGain);

    // Subtle wooden body resonator
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(420, now);
    gain2.gain.setValueAtTime(0.5, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc2.connect(gain2);
    gain2.connect(masterGain);

    osc1.start(now);
    osc1.stop(now + 0.045);
    osc2.start(now);
    osc2.stop(now + 0.07);
  }

  /**
   * Critical Countdown Tick: Played during the last 10 seconds.
   * High tension, urgent broadcast acoustic accent with pitch climbing on final 3 seconds.
   */
  public playCriticalTick(remainingSeconds: number): void {
    if (this.isMuted || this.volume <= 0) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(this.volume * 0.85, now);
    masterGain.connect(ctx.destination);

    // Frequency escalation for 3, 2, 1 seconds
    let baseFreq = 880; // A5
    if (remainingSeconds <= 3) {
      baseFreq = 1046.5; // C6
    }
    if (remainingSeconds === 1) {
      baseFreq = 1174.66; // D6
    }

    // Piercing tension ping
    const pingOsc = ctx.createOscillator();
    const pingGain = ctx.createGain();
    pingOsc.type = 'square';
    pingOsc.frequency.setValueAtTime(baseFreq, now);

    // Lowpass filter to avoid harshness while maintaining cutting edge
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2800, now);

    pingGain.gain.setValueAtTime(0.65, now);
    pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    pingOsc.connect(filter);
    filter.connect(pingGain);
    pingGain.connect(masterGain);

    // Sub-kick impact for chest presence on auditorium speakers
    const kickOsc = ctx.createOscillator();
    const kickGain = ctx.createGain();
    kickOsc.type = 'sine';
    kickOsc.frequency.setValueAtTime(180, now);
    kickOsc.frequency.exponentialRampToValueAtTime(50, now + 0.14);

    kickGain.gain.setValueAtTime(0.8, now);
    kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    kickOsc.connect(kickGain);
    kickGain.connect(masterGain);

    pingOsc.start(now);
    pingOsc.stop(now + 0.18);
    kickOsc.start(now);
    kickOsc.stop(now + 0.15);
  }

  /**
   * Final Time-Up Sound: Decisive national championship buzzer / alarm
   * + deep resonating brass gong.
   */
  public playTimeUpAlarm(): void {
    if (this.isMuted || this.volume <= 0) return;
    this.stopAllSounds();

    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(this.volume * 0.95, now);
    masterGain.connect(ctx.destination);

    // Double detuned sawtooth buzzer
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const buzzerGain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';

    osc1.frequency.setValueAtTime(261.63, now); // Middle C
    osc2.frequency.setValueAtTime(264.5, now); // Detuned chorus for massive authority

    const buzzerFilter = ctx.createBiquadFilter();
    buzzerFilter.type = 'lowpass';
    buzzerFilter.frequency.setValueAtTime(1400, now);

    // Pulsing siren-buzzer shape (beep-beep long blast)
    buzzerGain.gain.setValueAtTime(0.7, now);
    buzzerGain.gain.setValueAtTime(0.7, now + 0.35);
    buzzerGain.gain.setValueAtTime(0.2, now + 0.4);
    buzzerGain.gain.setValueAtTime(0.85, now + 0.45);
    buzzerGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

    osc1.connect(buzzerFilter);
    osc2.connect(buzzerFilter);
    buzzerFilter.connect(buzzerGain);
    buzzerGain.connect(masterGain);

    // Deep sub-bass gong resonance
    const gongOsc = ctx.createOscillator();
    const gongGain = ctx.createGain();
    gongOsc.type = 'sine';
    gongOsc.frequency.setValueAtTime(110, now); // A2
    gongOsc.frequency.exponentialRampToValueAtTime(65, now + 2.2);

    gongGain.gain.setValueAtTime(0.9, now);
    gongGain.gain.exponentialRampToValueAtTime(0.001, now + 2.4);

    gongOsc.connect(gongGain);
    gongGain.connect(masterGain);

    osc1.start(now);
    osc2.start(now);
    gongOsc.start(now);

    const stopTime = now + 2.5;
    osc1.stop(stopTime);
    osc2.stop(stopTime);
    gongOsc.stop(stopTime);

    this.currentAlarmNodes.push({
      stop: () => {
        try {
          osc1.stop();
          osc2.stop();
          gongOsc.stop();
        } catch {}
      },
    });
  }
}

export const audioSystem = new AudioSystem();
