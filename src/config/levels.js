export const gameTypes = {
  BLITZLESEN: 'blitzlesen',
  // Add more game types here in the future
};

export const levels = {
  [gameTypes.BLITZLESEN]: {
    easy: {
      name: "Leicht",
      emoji: "🌱",
      icon: "🌱",
      maxBlocks: 1,
      initialBlocks: 1,
      fallDuration: 12,
      spawnInterval: 3000,
      targetChance: 0.3,
      description: "Perfekt zum Üben",
      visualElements: {
        background: "bg-green-50",
        targetColor: "bg-green-500",
        blockColor: "bg-blue-300",
      }
    },
    normal: {
      name: "Normal",
      emoji: "🌟",
      icon: "🌟",
      maxBlocks: 6,
      initialBlocks: 2,
      fallDuration: 8,
      spawnInterval: 2000,
      targetChance: 0.25,
      description: "Für geübte Leser",
      visualElements: {
        background: "bg-blue-50",
        targetColor: "bg-blue-500",
        blockColor: "bg-purple-300",
      }
    },
    hard: {
      name: "Schwer",
      emoji: "🚀",
      icon: "🚀",
      maxBlocks: 10,
      initialBlocks: 3,
      fallDuration: 6,
      spawnInterval: 1500,
      targetChance: 0.2,
      description: "Für Blitzlese-Profis",
      visualElements: {
        background: "bg-purple-50",
        targetColor: "bg-purple-500",
        blockColor: "bg-pink-300",
      }
    }
  }
};

export const gameConfig = {
  // Basis-Spielkonfiguration
  MIN_BLOCK_WIDTH: 100,
  MARGIN: 10,
  SECTION_MIN_WIDTH: 120,
  BLOCK_HEIGHT: 50,
  BLOCK_SPACING: 15,

  // Timing für UI-Feedback
  GAME_DURATION: 45,
  INTRO_DURATION: 3000,
  FEEDBACK_DURATION: 1500,
  SHAKE_DURATION: 500,
  EXPLOSION_DURATION: 500,

  // Wortliste
  words: [
    "der", "die", "das", "und", "ist",
    "von", "mit", "auf", "für", "aus",
    "bei", "bis", "hat", "war", "zur",
    "wie", "dem", "nur", "vor", "zum"
  ],

  // Icons für verschiedene Zustände
  icons: {
    success: "🎯",
    error: "❌",
    missed: "💫",
    timer: "⏱️",
    score: "⭐",
    target: "🎯"
  }
}; 