// Text-To-Speech helper for liturgical readings, homilies and prayers
class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeakingState = false;
  private enabled = true;
  private onStateChangeCallbacks: Array<(speaking: boolean) => void> = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public subscribe(cb: (speaking: boolean) => void) {
    this.onStateChangeCallbacks.push(cb);
    return () => {
      this.onStateChangeCallbacks = this.onStateChangeCallbacks.filter(c => c !== cb);
    };
  }

  private notify() {
    this.onStateChangeCallbacks.forEach(cb => cb(this.isSpeakingState));
  }

  public speak(text: string, onEnd?: () => void) {
    if (!this.synth || !this.enabled) { onEnd?.(); return; }

    this.stop();

    // Clean text of markdown/tags
    const cleaned = text
      .replace(/[*#_~`]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .trim();

    if (!cleaned) return;

    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.lang = 'es-ES';
    utterance.rate = 0.95; // Serene, reverent pace
    utterance.pitch = 0.98;

    // Pick best Spanish voice if available
    const voices = this.synth.getVoices();
    const esVoice = voices.find(v => v.lang.startsWith('es') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Pablo') || v.name.includes('Jorge') || v.name.includes('Alvaro') || v.name.includes('Male')))
      || voices.find(v => v.lang.startsWith('es'));
    if (esVoice) {
      utterance.voice = esVoice;
    }

    utterance.onstart = () => {
      this.isSpeakingState = true;
      this.notify();
    };

    utterance.onend = () => {
      this.isSpeakingState = false;
      this.notify();
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.warn('TTS error:', e);
      this.isSpeakingState = false;
      this.notify();
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) this.stop();
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeakingState = false;
      this.notify();
    }
  }

  public toggle(text: string) {
    if (this.isSpeakingState) {
      this.stop();
    } else {
      this.speak(text);
    }
  }

  public isSpeaking(): boolean {
    return this.isSpeakingState;
  }
}

export const speechService = new SpeechService();
