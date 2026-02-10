/**
 * SoundEngine - Web Audio API synthesized sound effects for Number Friends.
 *
 * All sounds are generated procedurally using oscillators, noise buffers,
 * and gain envelopes. No audio files are required.
 *
 * The AudioContext is lazily created on the first sound call so that
 * browser autoplay policies (which require a user gesture) are respected.
 */

type MusicTrack = 'main_theme' | 'green_meadow' | 'crystal_caves' | 'volcanic_ridge' | 'sky_islands' | 'the_summit' | 'victory';

const MUSIC_PATHS: Partial<Record<MusicTrack, string>> = {
  main_theme: '/music/main_theme.mp3',
  green_meadow: '/music/gentle_garden.mp3',
  crystal_caves: '/music/cave_music.mp3',
  volcanic_ridge: '/music/epic_theme.mp3',
  sky_islands: '/music/sky_island.mp3',
  the_summit: '/music/final_section_music.mp3',
  victory: '/music/victory_music.mp3',
};

class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private volume: number = 0.5;

  // Music playback
  private musicEnabled: boolean = true;
  private musicVolume: number = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 0.15 : 0.35;
  private currentMusic: HTMLAudioElement | null = null;
  private currentMusicTrack: MusicTrack | null = null;
  private musicFadeInterval: ReturnType<typeof setInterval> | null = null;
  private pendingMusicTrack: MusicTrack | null = null;
  private interactionListenerAdded: boolean = false;

  // Track fade-out separately so it can be cancelled
  private fadeOutAudio: HTMLAudioElement | null = null;
  private fadeOutInterval: ReturnType<typeof setInterval> | null = null;

  // Cache of loaded Audio elements so tracks resume instead of restarting
  private musicCache: Map<MusicTrack, HTMLAudioElement> = new Map();

  /**
   * Lazily create and return the AudioContext.
   * If the context was suspended (common on mobile), resume it.
   */
  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // ------------------------------------------------------------------ state

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.stopMusic(false);
    } else if (this.currentMusicTrack && this.musicEnabled) {
      this.playMusic(this.currentMusicTrack);
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.stopMusic();
    } else if (this.currentMusicTrack) {
      this.playMusic(this.currentMusicTrack);
    }
  }

  isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.currentMusic) {
      this.currentMusic.volume = this.musicVolume;
    }
  }

  // ---------------------------------------------------------- music playback

  playMusic(track: MusicTrack, fadeIn: boolean = true): void {
    const path = MUSIC_PATHS[track];
    if (!path) return;

    // Already playing this track
    if (this.currentMusicTrack === track && this.currentMusic && !this.currentMusic.paused) {
      return;
    }

    // Pause (don't destroy) current music so it can be resumed later
    this.pauseCurrentMusic();

    this.currentMusicTrack = track;
    if (!this.musicEnabled || !this.enabled) return;

    // Check cache for an existing Audio element for this track
    let audio = this.musicCache.get(track);
    if (!audio) {
      audio = new Audio(path);
      audio.loop = true;
      this.musicCache.set(track, audio);
    }

    // Set volume for fade-in or immediate
    audio.volume = fadeIn ? 0 : this.musicVolume;
    this.currentMusic = audio;

    audio.play().then(() => {
      this.pendingMusicTrack = null;
      if (fadeIn) {
        // Fade in over 2 seconds
        let vol = audio!.volume;
        const targetVol = this.musicVolume;
        const step = targetVol / 40; // 40 steps over 2s
        this.musicFadeInterval = setInterval(() => {
          vol += step;
          if (vol >= targetVol) {
            vol = targetVol;
            if (this.musicFadeInterval) clearInterval(this.musicFadeInterval);
            this.musicFadeInterval = null;
          }
          if (this.currentMusic) this.currentMusic.volume = vol;
        }, 50);
      }
    }).catch(() => {
      // Autoplay blocked - remember the track and retry on first user interaction
      this.pendingMusicTrack = track;
      this.setupInteractionListener();
    });
  }

  /**
   * Pause the currently playing track (fade out briefly then pause).
   * The Audio element stays in the cache so it can resume from the same position.
   */
  private pauseCurrentMusic(): void {
    if (this.musicFadeInterval) {
      clearInterval(this.musicFadeInterval);
      this.musicFadeInterval = null;
    }

    // Kill any previously fading-out track immediately
    if (this.fadeOutInterval) {
      clearInterval(this.fadeOutInterval);
      this.fadeOutInterval = null;
    }
    if (this.fadeOutAudio) {
      this.fadeOutAudio.volume = 0;
      this.fadeOutAudio.pause();
      this.fadeOutAudio = null;
    }

    if (this.currentMusic && !this.currentMusic.paused) {
      const audio = this.currentMusic;
      this.fadeOutAudio = audio;
      let vol = audio.volume;
      const step = Math.max(vol / 10, 0.01); // ensure step > 0

      this.fadeOutInterval = setInterval(() => {
        vol -= step;
        if (vol <= 0) {
          vol = 0;
          if (this.fadeOutInterval) clearInterval(this.fadeOutInterval);
          this.fadeOutInterval = null;
          audio.pause();
          this.fadeOutAudio = null;
        }
        audio.volume = Math.max(0, vol);
      }, 50);
    }

    this.currentMusic = null;
  }

  private setupInteractionListener(): void {
    if (this.interactionListenerAdded) return;
    this.interactionListenerAdded = true;

    const handler = () => {
      this.interactionListenerAdded = false;
      document.removeEventListener('click', handler);
      document.removeEventListener('keydown', handler);
      document.removeEventListener('touchstart', handler);

      // Retry playing the pending track
      if (this.pendingMusicTrack && this.musicEnabled && this.enabled) {
        const track = this.pendingMusicTrack;
        this.pendingMusicTrack = null;
        this.currentMusic = null;
        this.currentMusicTrack = null;
        this.playMusic(track);
      }
    };

    document.addEventListener('click', handler, { once: false });
    document.addEventListener('keydown', handler, { once: false });
    document.addEventListener('touchstart', handler, { once: false });
  }

  stopMusic(clearTrack: boolean = true): void {
    if (this.musicFadeInterval) {
      clearInterval(this.musicFadeInterval);
      this.musicFadeInterval = null;
    }

    if (this.currentMusic) {
      // Fade out over 1 second then fully stop
      const audio = this.currentMusic;
      let vol = audio.volume;
      const step = vol / 20; // 20 steps over 1s

      const fadeOut = setInterval(() => {
        vol -= step;
        if (vol <= 0) {
          vol = 0;
          clearInterval(fadeOut);
          audio.pause();
          // Full stop: reset position and remove from cache
          audio.currentTime = 0;
        }
        audio.volume = Math.max(0, vol);
      }, 50);

      this.currentMusic = null;
    }

    if (clearTrack) {
      this.currentMusicTrack = null;
      // Clear the cache on full stop (e.g., game over) so tracks start fresh next game
      this.musicCache.forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
      this.musicCache.clear();
    }
  }

  getCurrentMusicTrack(): MusicTrack | null {
    return this.currentMusicTrack;
  }

  // ------------------------------------------------------ helper utilities

  /**
   * Create a GainNode wired to ctx.destination with the master volume applied.
   * The returned gain value is `baseGain * this.volume`.
   */
  private masterGain(ctx: AudioContext, baseGain: number): GainNode {
    const gain = ctx.createGain();
    gain.gain.value = baseGain * this.volume;
    gain.connect(ctx.destination);
    return gain;
  }

  /**
   * Create a white-noise AudioBuffer of the given duration (seconds).
   */
  private createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = Math.ceil(sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // --------------------------------------------------------- sound effects

  /**
   * Short soft click -- quick 800 Hz sine pop, 50 ms.
   */
  buttonClick(): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = this.masterGain(ctx, 0.3);

    osc.type = 'sine';
    osc.frequency.value = 800;

    gain.gain.setValueAtTime(0.3 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * Dice roll -- white noise through a bandpass filter with amplitude modulation, 150 ms.
   */
  diceRoll(): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const duration = 0.15;

    // White noise source
    const noiseBuffer = this.createNoiseBuffer(ctx, duration);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    // Bandpass filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    filter.Q.value = 5;

    // Amplitude modulation via an LFO on the gain
    const gain = this.masterGain(ctx, 0.4);
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();

    lfo.type = 'sine';
    lfo.frequency.value = 30; // rattle speed
    lfoGain.gain.value = 0.3 * this.volume;

    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);

    // Envelope: fade out
    gain.gain.setValueAtTime(0.4 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noiseSource.connect(filter);
    filter.connect(gain);

    lfo.start(now);
    lfo.stop(now + duration);
    noiseSource.start(now);
    noiseSource.stop(now + duration);
  }

  /**
   * Dice result -- bright ding: 1200 Hz + 1800 Hz sines, 200 ms exponential decay.
   */
  diceResult(): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const duration = 0.2;

    const gain = this.masterGain(ctx, 0.35);
    gain.gain.setValueAtTime(0.35 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 1200;
    osc1.connect(gain);
    osc1.start(now);
    osc1.stop(now + duration);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 1800;
    osc2.connect(gain);
    osc2.start(now);
    osc2.stop(now + duration);
  }

  /**
   * Move -- rising frequency sweep 400-600 Hz, triangle wave, 100 ms.
   */
  move(): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const duration = 0.1;

    const osc = ctx.createOscillator();
    const gain = this.masterGain(ctx, 0.3);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.linearRampToValueAtTime(600, now + duration);

    gain.gain.setValueAtTime(0.3 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    osc.start(now);
    osc.stop(now + duration);
  }

  /**
   * Land on special tile -- musical chime: 880 Hz then 1320 Hz sines, 300 ms total,
   * with a slight 50 ms delay before the second tone.
   */
  landOnSpecial(): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // First tone: 880 Hz
    const gain1 = this.masterGain(ctx, 0.3);
    gain1.gain.setValueAtTime(0.3 * this.volume, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 880;
    osc1.connect(gain1);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Second tone: 1320 Hz, starts 50 ms later
    const gain2 = this.masterGain(ctx, 0.3);
    gain2.gain.setValueAtTime(0.001, now);
    gain2.gain.setValueAtTime(0.3 * this.volume, now + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 1320;
    osc2.connect(gain2);
    osc2.start(now + 0.05);
    osc2.stop(now + 0.3);
  }

  /**
   * Mini-game start -- energetic ascending 3-note arpeggio: C5, E5, G5.
   * Each note 100 ms, with 50 ms gaps between.
   */
  minigameStart(): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const notes = [523, 659, 784]; // C5, E5, G5
    const noteDuration = 0.1;
    const gap = 0.05;

    notes.forEach((freq, i) => {
      const start = now + i * (noteDuration + gap);

      const osc = ctx.createOscillator();
      const gain = this.masterGain(ctx, 0.3);

      osc.type = 'sine';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0.3 * this.volume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + noteDuration);

      osc.connect(gain);
      osc.start(start);
      osc.stop(start + noteDuration);
    });
  }

  /**
   * Mini-game win -- victory jingle: C5-E5-G5-C6 major chord arpeggio.
   * Each note 150 ms with sustain (overlapping tails).
   */
  minigameWin(): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    const noteDuration = 0.15;
    const sustainDuration = 0.4; // long tail for sustain feel

    notes.forEach((freq, i) => {
      const start = now + i * noteDuration;

      const osc = ctx.createOscillator();
      const gain = this.masterGain(ctx, 0.3);

      osc.type = 'sine';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0.3 * this.volume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + sustainDuration);

      osc.connect(gain);
      osc.start(start);
      osc.stop(start + sustainDuration);
    });
  }

  /**
   * Mini-game lose -- sad trombone: E4 (330 Hz) descending to C4 (262 Hz),
   * 200 ms each, sawtooth wave.
   */
  minigameLose(): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const notes = [330, 262]; // E4, C4
    const noteDuration = 0.2;

    notes.forEach((freq, i) => {
      const start = now + i * noteDuration;

      const osc = ctx.createOscillator();
      const gain = this.masterGain(ctx, 0.25);

      osc.type = 'sawtooth';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0.25 * this.volume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + noteDuration);

      osc.connect(gain);
      osc.start(start);
      osc.stop(start + noteDuration);
    });
  }

  /**
   * Turn start -- subtle notification ding: 660 Hz sine, 100 ms, soft.
   */
  turnStart(): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const duration = 0.1;

    const osc = ctx.createOscillator();
    const gain = this.masterGain(ctx, 0.2);

    osc.type = 'sine';
    osc.frequency.value = 660;

    gain.gain.setValueAtTime(0.2 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    osc.start(now);
    osc.stop(now + duration);
  }

  /**
   * Victory -- extended celebration: five ascending notes from C5 to C6,
   * 100 ms each, with reverb-like overlapping decay tails.
   */
  victory(): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const notes = [523, 587, 659, 784, 1047]; // C5, D5, E5, G5, C6
    const noteDuration = 0.1;
    const tailDuration = 0.6; // reverb-like decay

    notes.forEach((freq, i) => {
      const start = now + i * noteDuration;

      const osc = ctx.createOscillator();
      const gain = this.masterGain(ctx, 0.3);

      osc.type = 'sine';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0.3 * this.volume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + tailDuration);

      osc.connect(gain);
      osc.start(start);
      osc.stop(start + tailDuration);

      // Add a quiet harmonic for richness
      const osc2 = ctx.createOscillator();
      const gain2 = this.masterGain(ctx, 0.1);

      osc2.type = 'sine';
      osc2.frequency.value = freq * 2; // octave above

      gain2.gain.setValueAtTime(0.1 * this.volume, start);
      gain2.gain.exponentialRampToValueAtTime(0.001, start + tailDuration * 0.7);

      osc2.connect(gain2);
      osc2.start(start);
      osc2.stop(start + tailDuration * 0.7);
    });
  }

  /**
   * Countdown tick -- 440 Hz sine, 50 ms for regular ticks.
   * The final tick (n === 0, i.e. "GO!") plays at 880 Hz, 100 ms.
   */
  countdown(n: number): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const isFinal = n === 0;
    const freq = isFinal ? 880 : 440;
    const duration = isFinal ? 0.1 : 0.05;
    const baseGain = isFinal ? 0.35 : 0.25;

    const osc = ctx.createOscillator();
    const gain = this.masterGain(ctx, baseGain);

    osc.type = 'sine';
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(baseGain * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    osc.start(now);
    osc.stop(now + duration);
  }

  /**
   * Timer warning -- urgent high beep: 1000 Hz square wave, 80 ms,
   * repeated twice with 80 ms gap.
   */
  timerWarning(): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const beepDuration = 0.08;
    const gap = 0.08;

    for (let i = 0; i < 2; i++) {
      const start = now + i * (beepDuration + gap);

      const osc = ctx.createOscillator();
      const gain = this.masterGain(ctx, 0.25);

      osc.type = 'square';
      osc.frequency.value = 1000;

      gain.gain.setValueAtTime(0.25 * this.volume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + beepDuration);

      osc.connect(gain);
      osc.start(start);
      osc.stop(start + beepDuration);
    }
  }
}

export const soundEngine = new SoundEngine();
