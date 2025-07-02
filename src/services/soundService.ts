class SoundService {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;
  private volume: number = 0.5;
  private initialized: boolean = false;

  constructor() {
    this.initializeAudio();
    this.updateSettings();
    this.attachGlobalFunction();
  }

  private initializeAudio() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.initialized = true;
    } catch (error) {
      // ...removed debug log...
      this.initialized = false;
    }
  }

  private attachGlobalFunction() {
    window.playLokalSound = (type: string) => {
      if (!this.initialized) {
        // ...removed debug log...
        return;
      }
      
      switch (type) {
        case 'new-order':
          this.playNewOrderChime();
          break;
        case 'ready':
          this.playOrderReadyChime();
          break;
        case 'billing':
          this.playBillPrintChime();
          break;
        case 'checkin':
          this.playCheckinChime();
          break;
        case 'checkout':
          this.playCheckoutChime();
          break;
        case 'error':
          this.playErrorSound();
          break;
        case 'success':
          this.playSuccessSound();
          break;
        case 'test':
          this.playTestSound();
          break;
        default:
          this.playSuccessSound();
      }
    };
  }

  updateSettings() {
    try {
      const stored = localStorage.getItem('lokalrestro_data');
      if (stored) {
        const data = JSON.parse(stored);
        const settings = data?.settings;
        if (settings) {
          this.enabled = settings.enableSounds !== false;
          this.volume = settings.soundVolume ? settings.soundVolume / 100 : 0.5;
          // ...removed debug log...
        }
      }
    } catch (error) {
      // ...removed debug log...
    }
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine') {
    if (!this.enabled || !this.audioContext || !this.initialized) {
      // ...removed debug log...
      return;
    }

    try {
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
      
      // ...removed debug log...
    } catch (error) {
      // ...removed debug log...
    }
  }

  private playSequence(notes: Array<{ frequency: number; duration: number; type?: OscillatorType }>) {
    if (!this.enabled || !this.initialized) {
      // ...removed debug log...
      return;
    }

    let currentTime = 0;
    notes.forEach(note => {
      setTimeout(() => {
        this.playTone(note.frequency, note.duration, note.type);
      }, currentTime * 1000);
      currentTime += note.duration + 0.05;
    });
  }

  playNewOrderChime() {
    // ...removed debug log...
    this.playSequence([
      { frequency: 523.25, duration: 0.2 },
      { frequency: 659.25, duration: 0.2 },
      { frequency: 783.99, duration: 0.3 }
    ]);
  }

  playOrderReadyChime() {
    // ...removed debug log...
    this.playSequence([
      { frequency: 880, duration: 0.3 },
      { frequency: 880, duration: 0.3 }
    ]);
  }

  playBillPrintChime() {
    // ...removed debug log...
    this.playSequence([
      { frequency: 1046.50, duration: 0.15 },
      { frequency: 1318.51, duration: 0.15 }
    ]);
  }

  playCheckinChime() {
    // ...removed debug log...
    this.playSequence([
      { frequency: 659.25, duration: 0.2 },
      { frequency: 783.99, duration: 0.2 },
      { frequency: 1046.50, duration: 0.3 }
    ]);
  }

  playCheckoutChime() {
    // ...removed debug log...
    this.playSequence([
      { frequency: 1046.50, duration: 0.2 },
      { frequency: 783.99, duration: 0.2 },
      { frequency: 659.25, duration: 0.3 }
    ]);
  }

  playErrorSound() {
    // ...removed debug log...
    this.playTone(200, 0.5, 'sawtooth');
  }

  playSuccessSound() {
    // ...removed debug log...
    this.playSequence([
      { frequency: 523.25, duration: 0.1 },
      { frequency: 659.25, duration: 0.1 },
      { frequency: 783.99, duration: 0.2 }
    ]);
  }

  playTestSound() {
    // ...removed debug log...
    this.playNewOrderChime();
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    // ...removed debug log...
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume / 100));
    // ...removed debug log...
  }

  playSound(type: 'new-order' | 'ready' | 'billing' | 'checkin' | 'checkout' | 'error' | 'success' | 'test') {
    if (window.playLokalSound) {
      window.playLokalSound(type);
    }
  }

  reinitialize() {
    this.initializeAudio();
    this.attachGlobalFunction();
  }
}

export const soundService = new SoundService();

declare global {
  interface Window {
    playLokalSound?: (type: string) => void;
  }
}
