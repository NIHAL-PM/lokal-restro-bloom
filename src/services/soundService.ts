
class SoundService {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;
  private volume: number = 0.5;

  constructor() {
    this.initializeAudio();
    this.updateSettings();
  }

  private initializeAudio() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Audio context not supported:', error);
    }
  }

  updateSettings() {
    try {
      const settings = JSON.parse(localStorage.getItem('lokalrestro_data') || '{}')?.settings;
      if (settings) {
        this.enabled = settings.enableSounds !== false;
        this.volume = settings.soundVolume ? settings.soundVolume / 100 : 0.5;
      }
    } catch (error) {
      console.warn('Failed to load sound settings:', error);
    }
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine') {
    if (!this.enabled || !this.audioContext) return;

    try {
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
    } catch (error) {
      console.warn('Failed to play sound:', error);
    }
  }

  private playSequence(notes: Array<{ frequency: number; duration: number; type?: OscillatorType }>) {
    if (!this.enabled) return;

    let currentTime = 0;
    notes.forEach(note => {
      setTimeout(() => {
        this.playTone(note.frequency, note.duration, note.type);
      }, currentTime * 1000);
      currentTime += note.duration + 0.05; // Small gap between notes
    });
  }

  playNewOrderChime() {
    // Pleasant ascending chime for new orders
    this.playSequence([
      { frequency: 523.25, duration: 0.2 }, // C5
      { frequency: 659.25, duration: 0.2 }, // E5
      { frequency: 783.99, duration: 0.3 }  // G5
    ]);
  }

  playOrderReadyChime() {
    // Double beep for order ready
    this.playSequence([
      { frequency: 880, duration: 0.3 },    // A5
      { frequency: 880, duration: 0.3 }     // A5
    ]);
  }

  playBillPrintChime() {
    // Quick confirmation sound for billing
    this.playSequence([
      { frequency: 1046.50, duration: 0.15 }, // C6
      { frequency: 1318.51, duration: 0.15 }  // E6
    ]);
  }

  playCheckinChime() {
    // Welcoming sound for check-ins
    this.playSequence([
      { frequency: 659.25, duration: 0.2 }, // E5
      { frequency: 783.99, duration: 0.2 }, // G5
      { frequency: 1046.50, duration: 0.3 } // C6
    ]);
  }

  playCheckoutChime() {
    // Farewell sound for checkouts
    this.playSequence([
      { frequency: 1046.50, duration: 0.2 }, // C6
      { frequency: 783.99, duration: 0.2 },  // G5
      { frequency: 659.25, duration: 0.3 }   // E5
    ]);
  }

  playErrorSound() {
    // Error notification
    this.playTone(200, 0.5, 'sawtooth');
  }

  playSuccessSound() {
    // Success notification
    this.playSequence([
      { frequency: 523.25, duration: 0.1 }, // C5
      { frequency: 659.25, duration: 0.1 }, // E5
      { frequency: 783.99, duration: 0.2 }  // G5
    ]);
  }

  // Test method for settings
  playTestSound() {
    this.playNewOrderChime();
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume / 100));
  }
}

export const soundService = new SoundService();

// Global sound function
declare global {
  interface Window {
    playLokalSound?: (type: string) => void;
  }
}
