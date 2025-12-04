
export const PLAYER_SPEED = 12; 
export const PLAYER_RUN_SPEED = 20; 
export const JUMP_FORCE = 15; 
export const GRAVITY = [0, -30, 0] as const;
export const FLOOR_SIZE = 250; 

export const ENEMY_SPAWN_COUNT = 5; // Reduced slightly
export const MAX_WAVES = 10;
export const HEALTH_PACK_HEAL = 30;

// Farsi Phrases for Enemies
export const ENEMY_PHRASES = [
  "پیداش کردم!",
  "اونجاست، بزنیدش!",
  "حمله کنید!",
  "نذارید فرار کنه!",
  "منطقه ناامن است!",
  "دشمن رویت شد!"
];

export const ENEMY_DEATH_PHRASES = [
  "آخ... سوختم",
  "تیر خوردم...",
  "کارم تمومه...",
  "لعنتی..."
];

// Audio Synth Helper
export const playSound = (type: 'shoot' | 'hit' | 'reload' | 'step' | 'heal') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'shoot') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.12);
      gain.gain.setValueAtTime(0.2, now); // Lower volume
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'hit') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'reload') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.linearRampToValueAtTime(600, now + 0.05);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'heal') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(600, now + 0.2);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch (e) {
    // Audio context might be blocked
  }
};

// Text to Speech Helper
export const speakFarsi = (text: string) => {
  if (!window.speechSynthesis) return;
  // Prevent too much overlapping speech
  if (window.speechSynthesis.speaking && Math.random() > 0.3) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'fa-IR';
  utterance.rate = 1.2;
  utterance.pitch = 0.8 + Math.random() * 0.4;
  utterance.volume = 0.5;
  window.speechSynthesis.speak(utterance);
};
