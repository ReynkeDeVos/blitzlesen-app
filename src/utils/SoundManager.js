/**
 * Sound Manager für das Blitzlesen-Spiel
 * Erzeugt hochwertige Sound-Effekte direkt mit der Web Audio API
 */

class SoundManager {
  constructor() {
    // AudioContext erstellen (wird erst bei Benutzerinteraktion initialisiert)
    this.audioContext = null;
    this.isMuted = false;
    this.sounds = {};
    this.loadExternalSounds();
  }

  // AudioContext bei Bedarf initialisieren
  initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.audioContext;
  }

  /**
   * Lädt die externen Sound-Dateien, die gut funktionieren (nur correctWord und click)
   */
  loadExternalSounds() {
    // Nur die brauchbaren externen Sounds laden
    this.sounds.correctWord = new Audio('/sounds/correct_word.mp3');
    this.sounds.click = new Audio('/sounds/click.mp3');

    // Lautstärke anpassen
    this.sounds.correctWord.volume = 0.6;
    this.sounds.click.volume = 0.3;

    // Vorladen
    Object.values(this.sounds).forEach(sound => sound.load());
  }

  /**
   * Erzeugt einen erweiterten Ton mit mehr Parametern für bessere Klangqualität
   * @param {Object} options - Konfigurationsoptionen
   */
  createRichTone(options) {
    if (this.isMuted) return;
    
    try {
      const ctx = this.initAudioContext();
      const defaults = {
        frequency: 440,
        type: 'sine',
        duration: 0.3,
        attack: 0.02,
        decay: 0.05,
        sustain: 0.5,
        release: 0.1,
        volume: 0.5,
        detune: 0,
        vibrato: 0,
        vibratoSpeed: 5
      };
      
      const params = { ...defaults, ...options };
      const time = ctx.currentTime;
      
      // Haupt-Oszillator
      const oscillator = ctx.createOscillator();
      oscillator.type = params.type;
      oscillator.frequency.setValueAtTime(params.frequency, time);
      
      if (params.detune !== 0) {
        oscillator.detune.setValueAtTime(params.detune, time);
      }
      
      // Vibrato hinzufügen, falls gewünscht
      if (params.vibrato > 0) {
        const vibratoOsc = ctx.createOscillator();
        vibratoOsc.frequency.value = params.vibratoSpeed;
        vibratoOsc.type = 'sine';
        
        const vibratoGain = ctx.createGain();
        vibratoGain.gain.value = params.vibrato;
        
        vibratoOsc.connect(vibratoGain);
        vibratoGain.connect(oscillator.frequency);
        vibratoOsc.start(time);
        vibratoOsc.stop(time + params.duration + params.release);
      }
      
      // ADSR-Hüllkurve für natürlicheren Klang
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0, time);
      gainNode.gain.linearRampToValueAtTime(params.volume, time + params.attack);
      gainNode.gain.linearRampToValueAtTime(params.volume * params.sustain, time + params.attack + params.decay);
      gainNode.gain.setValueAtTime(params.volume * params.sustain, time + params.duration);
      gainNode.gain.linearRampToValueAtTime(0.001, time + params.duration + params.release);
      
      // Leichter Reverb/Halleffekt
      if (options.reverb) {
        // Vereinfachter Reverb-Effekt mit Delay-Node
        const delay = ctx.createDelay();
        delay.delayTime.value = 0.1;
        
        const feedback = ctx.createGain();
        feedback.gain.value = options.reverb * 0.5;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 3000;
        
        // Verbindung herstellen
        gainNode.connect(ctx.destination); // Dry Signal
        gainNode.connect(delay);
        delay.connect(filter);
        filter.connect(feedback);
        feedback.connect(delay);
        filter.connect(ctx.destination);
      } else {
        // Ohne Reverb
        gainNode.connect(ctx.destination);
      }
      
      // Filter hinzufügen (optional)
      if (options.filter) {
        const filter = ctx.createBiquadFilter();
        filter.type = options.filter.type || 'lowpass';
        filter.frequency.value = options.filter.frequency || 800;
        filter.Q.value = options.filter.Q || 1;
        
        oscillator.connect(filter);
        filter.connect(gainNode);
      } else {
        oscillator.connect(gainNode);
      }
      
      // Ton starten und automatisch beenden
      oscillator.start(time);
      oscillator.stop(time + params.duration + params.release);
      
      // Instanzen für spätere Bereinigung zurückgeben
      return { oscillator, gainNode };
    } catch (error) {
      console.error('Fehler beim Erzeugen des Tons:', error);
      return null;
    }
  }

  /**
   * Spielt einen externen Sound ab
   * @param {string} soundName - Name des Sounds
   */
  play(soundName) {
    if (this.isMuted || !this.sounds[soundName]) return;

    try {
      // Aktuelle Wiedergabe stoppen und von vorne starten
      const sound = this.sounds[soundName];
      sound.pause();
      sound.currentTime = 0;
      sound.play().catch(error => {
        console.warn(`Sound konnte nicht abgespielt werden: ${soundName}`, error);
      });
    } catch (error) {
      console.error(`Fehler beim Abspielen des Sounds: ${soundName}`, error);
    }
  }

  /**
   * Spielt einen verbesserten Countdown-Sound
   * @param {number} number - Die Countdown-Zahl (1-3)
   */
  playCountdown(number) {
    // Kindgerechte, klare Countdown-Töne
    if (number === 3) {
      // Tiefer, sanfter Ton für 3
      this.createRichTone({
        frequency: 330, // E4, kindgerechter Ton
        duration: 0.2,
        type: 'sine',
        volume: 0.4,
        attack: 0.01,
        decay: 0.05,
        sustain: 0.8,
        release: 0.1
      });
    } else if (number === 2) {
      // Mittlerer Ton für 2
      this.createRichTone({
        frequency: 392, // G4
        duration: 0.2,
        type: 'sine',
        volume: 0.4,
        attack: 0.01,
        decay: 0.05,
        sustain: 0.8,
        release: 0.1
      });
    } else if (number === 1) {
      // Hoher Ton für 1
      this.createRichTone({
        frequency: 523.25, // C5
        duration: 0.2,
        type: 'sine',
        volume: 0.5,
        attack: 0.01,
        decay: 0.05,
        sustain: 0.9,
        release: 0.2
      });
    }
  }
  
  /**
   * Spielt Sound für ein korrektes Wort
   */
  playCorrectWord() {
    this.play('correctWord');
  }

  /**
   * Spielt Sound für ein falsches Wort (neuer, negativer Sound)
   */
  playWrongWord() {
    // Deutlicher "Fehler"-Sound - abfallender Ton
    this.createRichTone({
      frequency: 290, // D4
      duration: 0.1,
      type: 'sawtooth',
      attack: 0.01,
      decay: 0.02,
      sustain: 0.6,
      release: 0.05,
      volume: 0.3,
      filter: {
        type: 'lowpass',
        frequency: 800
      }
    });
    
    setTimeout(() => {
      this.createRichTone({
        frequency: 220, // A3, klar tiefer
        duration: 0.2,
        type: 'sawtooth',
        attack: 0.01,
        decay: 0.05,
        sustain: 0.5,
        release: 0.1,
        volume: 0.3,
        filter: {
          type: 'lowpass',
          frequency: 700
        }
      });
    }, 100);
  }
  
  /**
   * Spielt Sound für ein verpasstes Zielwort (neuer, dramatischer Sound)
   */
  playMissedTarget() {
    // Deutlicherer "Fehler"-Sound, ähnlich wie bei Spielshows
    this.createRichTone({
      frequency: 180, // etwa F3
      duration: 0.15,
      type: 'sawtooth',
      attack: 0.01,
      decay: 0.05,
      sustain: 0.8,
      release: 0.1,
      volume: 0.35
    });
    
    setTimeout(() => {
      this.createRichTone({
        frequency: 150, // etwa D3
        duration: 0.3,
        type: 'sawtooth',
        attack: 0.01,
        decay: 0.1,
        sustain: 0.7,
        release: 0.2,
        volume: 0.35
      });
    }, 150);
  }
  
  /**
   * Spielt Klick-Sound
   */
  playClick() {
    this.play('click');
  }
  
  /**
   * Spielt einen fröhlichen Sound für den Spielstart
   */
  playGameStart() {
    // Fröhliche, aufmunternde Fanfare
    const playNote = (note, delay, duration = 0.15) => {
      setTimeout(() => {
        this.createRichTone({
          frequency: note,
          duration: duration,
          type: 'sine',
          attack: 0.02,
          decay: 0.05,
          sustain: 0.7,
          release: 0.1,
          volume: 0.3
        });
      }, delay);
    };

    // Fröhliche Aufsteigende Tonfolge (C-Dur)
    playNote(523.25, 0);     // C5
    playNote(587.33, 150);   // D5
    playNote(659.25, 300);   // E5
    playNote(698.46, 450);   // F5
    playNote(783.99, 600, 0.3); // G5 (länger)
  }
  
  /**
   * Spielt einen Sound für das Spielende
   */
  playGameOver() {
    // Freundlicher Abschlussakkord (C-Dur)
    this.createRichTone({
      frequency: 261.63, // C4
      duration: 0.2,
      type: 'sine',
      attack: 0.02,
      decay: 0.1,
      sustain: 0.7,
      release: 0.2,
      volume: 0.3
    });
    
    setTimeout(() => {
      this.createRichTone({
        frequency: 329.63, // E4
        duration: 0.2,
        type: 'sine',
        attack: 0.02,
        decay: 0.1,
        sustain: 0.7,
        release: 0.2,
        volume: 0.3
      });
    }, 100);
    
    setTimeout(() => {
      this.createRichTone({
        frequency: 392.00, // G4
        duration: 0.2,
        type: 'sine',
        attack: 0.02,
        decay: 0.1,
        sustain: 0.7,
        release: 0.3,
        volume: 0.3
      });
    }, 200);
    
    setTimeout(() => {
      this.createRichTone({
        frequency: 523.25, // C5
        duration: 0.5,
        type: 'sine',
        attack: 0.02,
        decay: 0.1,
        sustain: 0.6,
        release: 0.4,
        volume: 0.35
      });
    }, 350);
  }

  /**
   * Ton ein- oder ausschalten
   * @param {boolean} muted - Ob der Ton stumm geschaltet werden soll
   */
  setMuted(muted) {
    this.isMuted = muted;
  }
}

// Singleton-Instanz
const soundManager = new SoundManager();
export default soundManager; 