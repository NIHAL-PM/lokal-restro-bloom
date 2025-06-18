
class SoundService {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;
  private volume: number = 0.5;

  constructor() {
    this.loadSettings();
    this.initAudioContext();
  }

  private loadSettings() {
    const settings = JSON.parse(localStorage.getItem('lokal_settings') || '{}');
    this.enabled = settings.enableSounds !== false;
    this.volume = parseFloat(settings.soundVolume || '50') / 100;
  }

  private initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.error('Failed to initialize AudioContext:', error);
    }
  }

  private async createTone(frequency: number, duration: number, type: OscillatorType = 'sine'): Promise<void> {
    if (!this.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  async playNewOrderChime() {
    // Pleasant ascending chime
    await this.createTone(523.25, 0.2); // C5
    setTimeout(() => this.createTone(659.25, 0.2), 100); // E5
    setTimeout(() => this.createTone(783.99, 0.3), 200); // G5
  }

  async playOrderReadyChime() {
    // Double beep confirmation
    await this.createTone(880, 0.15); // A5
    setTimeout(() => this.createTone(880, 0.15), 200);
  }

  async playBillPrintChime() {
    // Cash register style
    await this.createTone(440, 0.1); // A4
    setTimeout(() => this.createTone(554.37, 0.1), 80); // C#5
    setTimeout(() => this.createTone(659.25, 0.2), 160); // E5
  }

  async playCheckinChime() {
    // Welcome tone
    await this.createTone(659.25, 0.15); // E5
    setTimeout(() => this.createTone(783.99, 0.15), 100); // G5
    setTimeout(() => this.createTone(987.77, 0.3), 200); // B5
  }

  async playCheckoutChime() {
    // Farewell tone
    await this.createTone(987.77, 0.15); // B5
    setTimeout(() => this.createTone(783.99, 0.15), 100); // G5
    setTimeout(() => this.createTone(659.25, 0.3), 200); // E5
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume / 100));
  }

  updateSettings() {
    this.loadSettings();
  }
}

export const soundService = new SoundService();
