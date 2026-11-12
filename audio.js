/**
 * Web Audio API Sound System
 * Synthesizes sound effects and background ambient music with zero external audio assets.
 */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.soundEnabled = true;
    this.musicEnabled = false;
    this.musicInterval = null;
    this.musicStep = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setSoundEnabled(val) {
    this.soundEnabled = !!val;
  }

  setMusicEnabled(val) {
    this.musicEnabled = !!val;
    if (this.musicEnabled) {
      this.startAmbientMusic();
    } else {
      this.stopAmbientMusic();
    }
  }

  playClick() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {}
  }

  playDiceRoll() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      // Realistic acoustic dice rattle: rapid tumbling clicks with randomized intervals & frequencies
      for (let i = 0; i < 8; i++) {
        setTimeout(() => {
          if (!this.ctx) return;
          const t = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          const freq = 280 + Math.random() * 260;
          osc.frequency.setValueAtTime(freq, t);
          osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + 0.038);
          gain.gain.setValueAtTime(0.18 + Math.random() * 0.1, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.038);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.04);
        }, i * 50 + Math.random() * 20);
      }
    } catch (e) {}
  }

  playHop() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      // Resonant body click - crisp tactile wooden/acrylic pawn tap
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(840, t);
      osc.frequency.exponentialRampToValueAtTime(190, t + 0.045);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.05);

      // Acoustic pop / tap transient
      const popOsc = this.ctx.createOscillator();
      const popGain = this.ctx.createGain();
      popOsc.type = 'sine';
      popOsc.frequency.setValueAtTime(1400, t);
      popOsc.frequency.exponentialRampToValueAtTime(400, t + 0.02);
      popGain.gain.setValueAtTime(0.2, t);
      popGain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
      popOsc.connect(popGain);
      popGain.connect(this.ctx.destination);
      popOsc.start(t);
      popOsc.stop(t + 0.025);
    } catch (e) {}
  }

  /* [PlaySphere Enhancement]: Authentic wooden/acrylic step tap with pitch progress matching Ludo King */
  playGotiStep(stepIndex = 1, totalSteps = 6) {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      // Progressive acoustic pitch (steps 1..6 climb smoothly)
      const baseFreq = 780 + Math.min(stepIndex, 6) * 48;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.36, t + 0.055);
      gain.gain.setValueAtTime(0.38, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.055);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.06);

      // Tactile wood/plastic impact transient click
      const popOsc = this.ctx.createOscillator();
      const popGain = this.ctx.createGain();
      popOsc.type = 'sine';
      popOsc.frequency.setValueAtTime(1550 + stepIndex * 65, t);
      popOsc.frequency.exponentialRampToValueAtTime(450, t + 0.022);
      popGain.gain.setValueAtTime(0.24, t);
      popGain.gain.exponentialRampToValueAtTime(0.001, t + 0.022);
      popOsc.connect(popGain);
      popGain.connect(this.ctx.destination);
      popOsc.start(t);
      popOsc.stop(t + 0.025);
    } catch (e) {}
  }

  /* [PlaySphere Enhancement]: Satisfying landing thud upon reaching target square */
  playGotiLand() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(490, t);
      osc.frequency.exponentialRampToValueAtTime(125, t + 0.08);
      gain.gain.setValueAtTime(0.42, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.085);
    } catch (e) {}
  }

  /* [PlaySphere Enhancement]: Captured goti fast reverse step tick */
  playGotiReturnStep(step = 1) {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      // Pitch gently drops as goti gets closer to yard (0)
      const freq = 420 + Math.min(step, 40) * 12;
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.45, t + 0.035);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.04);
    } catch (e) {}
  }

  playYardExit() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      [659.25, 987.77].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.08);
        gain.gain.setValueAtTime(0.24, t + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + idx * 0.08);
        osc.stop(t + idx * 0.08 + 0.23);
      });
    } catch (e) {}
  }

  playMove() {
    this.playHop();
  }

  playChessMove() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      // Wood-like impact sound
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.09);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch (e) {}
  }

  playCapture() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      // Punchy impact thump
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(460, t);
      osc.frequency.exponentialRampToValueAtTime(75, t + 0.22);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.23);

      // Slide defeat whoosh
      setTimeout(() => {
        if (!this.ctx) return;
        const slide = this.ctx.createOscillator();
        const sGain = this.ctx.createGain();
        slide.type = 'sine';
        slide.frequency.setValueAtTime(650, this.ctx.currentTime);
        slide.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.25);
        sGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        sGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
        slide.connect(sGain);
        sGain.connect(this.ctx.destination);
        slide.start();
        slide.stop(this.ctx.currentTime + 0.26);
      }, 70);
    } catch (e) {}
  }

  playCheck() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      [587.33, 880].forEach((freq, idx) => {
        setTimeout(() => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
          gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + 0.2);
        }, idx * 120);
      });
    } catch (e) {}
  }

  playWin() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        setTimeout(() => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
          gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + 0.35);
        }, i * 110);
      });
    } catch (e) {}
  }

  playLoss() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const notes = [440, 392, 349.23, 293.66];
      notes.forEach((freq, i) => {
        setTimeout(() => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
          gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + 0.3);
        }, i * 140);
      });
    } catch (e) {}
  }

  startAmbientMusic() {
    if (this.musicInterval) return;
    this.init();
    const chords = [
      [261.63, 329.63, 392.00], // C
      [220.00, 261.63, 329.63], // Am
      [174.61, 220.00, 261.63], // F
      [196.00, 246.94, 293.66], // G
    ];

    this.musicInterval = setInterval(() => {
      if (!this.musicEnabled || !this.ctx) return;
      const chord = chords[this.musicStep % chords.length];
      this.musicStep++;

      chord.forEach((freq, idx) => {
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
          gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 0.8);
          gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 2.3);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + 2.4);
        } catch (e) {}
      });
    }, 2400);
  }

  stopAmbientMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

window.soundEngine = new SoundEngine();
