import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

const SOURCES = {
  tap: require('../../assets/sounds/tap.wav'),
  lock: require('../../assets/sounds/lock.wav'),
  whoosh: require('../../assets/sounds/whoosh.wav'),
  clash: require('../../assets/sounds/clash.wav'),
  tie: require('../../assets/sounds/tie.wav'),
  win1: require('../../assets/sounds/win1.wav'),
  win2: require('../../assets/sounds/win2.wav'),
  win3: require('../../assets/sounds/win3.wav'),
  win4: require('../../assets/sounds/win4.wav'),
  win5: require('../../assets/sounds/win5.wav'),
  combo: require('../../assets/sounds/combo.wav'),
  fanfare: require('../../assets/sounds/fanfare.wav'),
};

export type SoundName = keyof typeof SOURCES;

let players: Partial<Record<SoundName, AudioPlayer>> | null = null;

/** Loads every sound once, so the first reveal plays without a delay. */
export function loadSounds(): void {
  if (players) return;
  players = {};
  setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => {});
  for (const name of Object.keys(SOURCES) as SoundName[]) {
    try {
      players[name] = createAudioPlayer(SOURCES[name]);
    } catch {
      // A missing sound must never stop the game.
    }
  }
}

export function play(name: SoundName): void {
  loadSounds();
  const player = players?.[name];
  if (!player) return;
  try {
    player.seekTo(0).catch(() => {});
    player.play();
  } catch {
    // Ignore playback errors; the game works silently.
  }
}

/** The throw-win chime, pitched up with the winner's streak. */
export function playWin(streak: number): void {
  const level = Math.max(1, Math.min(5, streak));
  play(`win${level}` as SoundName);
}
