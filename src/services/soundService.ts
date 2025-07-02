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
      console.warn('Audio context not supported:', error);
      this.initialized = false;
    }
  }

  private attachGlobalFunction() {
    window.playLokalSound = (type: string) => {
      if (!this.initialized) {
        console.log('Sound service not initialized, skipping sound');
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
          console.log('Sound settings updated:', { enabled: this.enabled, volume: this.volume });
        }
      }
    } catch (error) {
      console.warn('Failed to load sound settings:', error);
    }
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine') {
    if (!this.enabled || !this.audioContext || !this.initialized) {
      console.log('Sound disabled or audio context unavailable');
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
      
      console.log('Playing tone:', { frequency, duration, enabled: this.enabled, volume: this.volume });
    } catch (error) {
      console.warn('Failed to play sound:', error);
    }
  }

  private playSequence(notes: Array<{ frequency: number; duration: number; type?: OscillatorType }>) {
    if (!this.enabled || !this.initialized) {
      console.log('Sound disabled or not initialized, skipping sequence');
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
    console.log('Playing new order chime');
    this.playSequence([
      { frequency: 523.25, duration: 0.2 },
      { frequency: 659.25, duration: 0.2 },
      { frequency: 783.99, duration: 0.3 }
    ]);
  }

  playOrderReadyChime() {
    console.log('Playing order ready chime');
    this.playSequence([
      { frequency: 880, duration: 0.3 },
      { frequency: 880, duration: 0.3 }
    ]);
  }

  playBillPrintChime() {
    console.log('Playing bill print chime');
    this.playSequence([
      { frequency: 1046.50, duration: 0.15 },
      { frequency: 1318.51, duration: 0.15 }
    ]);
  }

  playCheckinChime() {
    console.log('Playing checkin chime');
    this.playSequence([
      { frequency: 659.25, duration: 0.2 },
      { frequency: 783.99, duration: 0.2 },
      { frequency: 1046.50, duration: 0.3 }
    ]);
  }

  playCheckoutChime() {
    console.log('Playing checkout chime');
    this.playSequence([
      { frequency: 1046.50, duration: 0.2 },
      { frequency: 783.99, duration: 0.2 },
      { frequency: 659.25, duration: 0.3 }
    ]);
  }

  playErrorSound() {
    console.log('Playing error sound');
    this.playTone(200, 0.5, 'sawtooth');
  }

  playSuccessSound() {
    console.log('Playing success sound');
    this.playSequence([
      { frequency: 523.25, duration: 0.1 },
      { frequency: 659.25, duration: 0.1 },
      { frequency: 783.99, duration: 0.2 }
    ]);
  }

  playTestSound() {
    console.log('Playing test sound');
    this.playNewOrderChime();
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    console.log('Sound enabled set to:', enabled);
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume / 100));
    console.log('Sound volume set to:', this.volume);
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
