import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PropTypes from "prop-types";
import confetti from "canvas-confetti";
import FallingBlock from "./FallingBlock";
import LandingPage from "./LandingPage";
import soundManager from "../utils/SoundManager";

const ResultCard = ({ icon, label, value, color }) => (
  <div className={`flex items-center space-x-2 p-3 rounded-lg ${color}`}>
    <span className="text-2xl">{icon}</span>
    <div>
      <div className="text-sm font-medium">{label}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  </div>
);

ResultCard.propTypes = {
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  color: PropTypes.string.isRequired
};

const WORDS = [
  "der", "die", "das", "und", "ist", "von", "mit",
  "auf", "für", "aus", "bei", "bis", "hat", "war"
];

const GAME_STATES = {
  LANDING: "landing",
  DIFFICULTY: "difficulty",
  INTRO: "intro",
  PLAYING: "playing",
  END: "end"
};

const DIFFICULTY_SETTINGS = {
  easy: {
    icon: "🐣",
    name: "Anfänger",
    interval: 3000,
    maxBlocks: 3,
    initialBlocks: 2,
    targetChance: 0.4,
    fallDuration: 8,
    color: "bg-green-200",
    stars: 1
  },
  normal: {
    icon: "🦊",
    name: "Fortgeschritten",
    interval: 2000,
    maxBlocks: 4,
    initialBlocks: 3,
    targetChance: 0.35,
    fallDuration: 6,
    color: "bg-yellow-100",
    stars: 2
  },
  hard: {
    icon: "🦁",
    name: "Profi",
    interval: 1500,
    maxBlocks: 5,
    initialBlocks: 3,
    targetChance: 0.3,
    fallDuration: 5,
    color: "bg-red-200",
    stars: 3
  }
};

const createExplosionPieces = () => {
  return [
    // Center burst
    ...Array.from({ length: 12 }, (_, i) => ({
      id: `burst-${i}`,
      type: 'burst',
      angle: (i * 360) / 12,
      speed: Math.random() * 2 + 3,
      size: Math.random() * 15 + 10
    })),
    // Shrapnel
    ...Array.from({ length: 8 }, (_, i) => ({
      id: `shrapnel-${i}`,
      type: 'shrapnel',
      angle: Math.random() * 360,
      speed: Math.random() * 4 + 2,
      size: Math.random() * 8 + 4
    }))
  ];
};

const BlitzlesenGame = () => {
  const [gameState, setGameState] = useState(GAME_STATES.LANDING);
  const [difficulty, setDifficulty] = useState("easy");
  const [score, setScore] = useState(0);
  const [targetWord, setTargetWord] = useState("");
  const [fallingWords, setFallingWords] = useState([]);
  const [timeLeft, setTimeLeft] = useState(30);
  
  const [, setExplosions] = useState([]);
  const [countdownValue, setCountdownValue] = useState(3);
  const [clickedBlocks, setClickedBlocks] = useState(new Set());

  // Sound-Manager bei erster Benutzerinteraktion initialisieren
  useEffect(() => {
    const initializeSound = () => {
      // Versuchen, den AudioContext zu initialisieren
      try {
        soundManager.initAudioContext();
      } catch (error) {
        console.warn("AudioContext konnte nicht initialisiert werden:", error);
      }
      
      // Event-Listener entfernen
      window.removeEventListener('click', initializeSound);
      window.removeEventListener('touchstart', initializeSound);
      window.removeEventListener('keydown', initializeSound);
    };
    
    // Event-Listener für Benutzerinteraktionen hinzufügen
    window.addEventListener('click', initializeSound);
    window.addEventListener('touchstart', initializeSound);
    window.addEventListener('keydown', initializeSound);
    
    return () => {
      // Event-Listener entfernen
      window.removeEventListener('click', initializeSound);
      window.removeEventListener('touchstart', initializeSound);
      window.removeEventListener('keydown', initializeSound);
    };
  }, []);

  const generateWord = useCallback(() => {
    const isTarget = Math.random() < DIFFICULTY_SETTINGS[difficulty].targetChance;
    const word = isTarget ? targetWord : WORDS.filter(w => w !== targetWord)[Math.floor(Math.random() * (WORDS.length - 1))];
    const id = `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return { id, word, isTarget };
  }, [targetWord, difficulty]);

  const triggerExplosion = (type, x, y) => {
    const id = Date.now();
    if (type === "success") {
      // Glitter explosion
        confetti({
        particleCount: 50,
          spread: 100,
        origin: { x: x / window.innerWidth, y: y / window.innerHeight },
        colors: ['#FFD700', '#FFA500', '#ffffff'],
        ticks: 200,
              gravity: 0.5,
        scalar: 2,
        shapes: ['star']
      });
    } else if (type === "error") {
      // Create error feedback element
      const errorFeedback = document.createElement('div');
      errorFeedback.textContent = '✘';
      errorFeedback.style.position = 'absolute';
      errorFeedback.style.left = `${x}px`;
      errorFeedback.style.top = `${y}px`;
      errorFeedback.style.transform = 'translate(-50%, -50%)';
      errorFeedback.style.color = '#FF0000';
      errorFeedback.style.fontSize = '64px';
      errorFeedback.style.fontWeight = 'bold';
      errorFeedback.style.zIndex = '1000';
      errorFeedback.style.pointerEvents = 'none';
      document.body.appendChild(errorFeedback);
      
      // Animate and remove
      let opacity = 1;
      let scale = 1;
      const animate = () => {
        if (opacity <= 0) {
          document.body.removeChild(errorFeedback);
          return;
        }
        opacity -= 0.05;
        scale += 0.1;
        errorFeedback.style.opacity = opacity;
        errorFeedback.style.transform = `translate(-50%, -50%) scale(${scale})`;
        requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
      
      // Small screen shake - leichter als vorher
      const gameArea = document.querySelector('.game-area');
      if (gameArea) {
        gameArea.style.animation = 'none';
        gameArea.offsetHeight;
        gameArea.style.animation = 'tinyShake 0.3s cubic-bezier(.36,.07,.19,.97) both';
      }
    } else if (type === "missedTarget") {
      // Der rote Konfetti-Effekt wurde entfernt
      
      // Heavy screen shake
      const gameArea = document.querySelector('.game-area');
      if (gameArea) {
        gameArea.style.animation = 'none';
        gameArea.offsetHeight;
        gameArea.style.animation = 'violentShake 0.8s cubic-bezier(.36,.07,.19,.97) both';
      }

      // Add flash effect to the screen
      const flashOverlay = document.createElement('div');
      flashOverlay.style.position = 'fixed';
      flashOverlay.style.top = '0';
      flashOverlay.style.left = '0';
      flashOverlay.style.width = '100%';
      flashOverlay.style.height = '100%';
      flashOverlay.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
      flashOverlay.style.pointerEvents = 'none';
      flashOverlay.style.zIndex = '999';
      document.body.appendChild(flashOverlay);

      // Fade out and remove flash overlay
      setTimeout(() => {
        flashOverlay.style.transition = 'opacity 0.5s';
        flashOverlay.style.opacity = '0';
        setTimeout(() => {
          document.body.removeChild(flashOverlay);
        }, 500);
      }, 100);
    }

    // If it's an error or missed target, add the explosions to state
    if (type !== "success") {
      setExplosions(prev => [...prev, {
        id,
        x,
        y,
        pieces: createExplosionPieces()
      }]);

      setTimeout(() => {
        setExplosions(prev => prev.filter(e => e.id !== id));
      }, 600);
    }
  };

  const startGame = (selectedDifficulty) => {
    setDifficulty(selectedDifficulty);
    setScore(0);
    setTimeLeft(30);
    setTargetWord(WORDS[Math.floor(Math.random() * WORDS.length)]);
    setFallingWords([]);
    setClickedBlocks(new Set());
    setGameState(GAME_STATES.INTRO);
  };

  const handleWordSelect = (word, blockId, x, y) => {
    console.log('Block clicked:', blockId);
    
    // Prüfen, ob dieser Block bereits angeklickt wurde
    if (clickedBlocks.has(blockId)) {
      console.log('Block already clicked, ignoring:', blockId);
      return; // Wenn bereits angeklickt, nichts tun
    }
    
    // Block als angeklickt markieren
    setClickedBlocks(prev => {
      const newSet = new Set(prev);
      newSet.add(blockId);
      return newSet;
    });
    
    // Trigger appropriate feedback based on word type
    if (word === targetWord) {
      // If target word is clicked, add points and show success animation
      setScore(prev => prev + 1);
      triggerExplosion("success", x, y);
      soundManager.playCorrectWord(); // Sound für korrektes Wort
      
      // Remove the clicked target block immediately
      setFallingWords(prev => {
        const newBlocks = prev.filter(block => block.id !== blockId);
        console.log('Removing block:', blockId);
        console.log('Blocks after removal:', newBlocks.map(b => b.id));
        return newBlocks;
      });
    } else {
      // For wrong words, just show error feedback but don't remove the block
      triggerExplosion("error", x, y);
      soundManager.playWrongWord(); // Sound für falsches Wort
      
      // Find the block element and add a red flash effect
      const blockElement = document.getElementById(`block-${blockId}`);
      if (blockElement) {
        // Create and append a red flash overlay to the block
        const flashOverlay = document.createElement('div');
        flashOverlay.style.position = 'absolute';
        flashOverlay.style.top = '0';
        flashOverlay.style.left = '0';
        flashOverlay.style.width = '100%';
        flashOverlay.style.height = '100%';
        flashOverlay.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
        flashOverlay.style.borderRadius = 'inherit';
        flashOverlay.style.pointerEvents = 'none';
        flashOverlay.style.opacity = '0.7';
        blockElement.appendChild(flashOverlay);
        
        // Fade out the flash effect
        setTimeout(() => {
          let opacity = 0.7;
          const fadeInterval = setInterval(() => {
            opacity -= 0.1;
            if (opacity <= 0) {
              clearInterval(fadeInterval);
              if (blockElement.contains(flashOverlay)) {
                blockElement.removeChild(flashOverlay);
              }
            } else {
              flashOverlay.style.opacity = opacity.toString();
            }
          }, 50);
        }, 50);
      }
    }
  };

  const handleMissedWord = useCallback((word, x) => {
    if (word === targetWord) {
      // Nur den Sound abspielen und die Explosion auslösen, aber keine visuellen Elemente mehr anzeigen
      triggerExplosion("missedTarget", x, window.innerHeight);
      soundManager.playMissedTarget();
      
      // Entfernt: setMissedTargets wird nicht mehr aufgerufen, somit wird auch kein rotes X mehr angezeigt
    }
  }, [targetWord]);

  useEffect(() => {
    if (gameState !== GAME_STATES.PLAYING) return;

    // Initialize with at least one target word
    const initialBlocks = [];
    const targetBlock = {
      id: `block-${Date.now()}-target`,
      word: targetWord,
      isTarget: true
    };
    initialBlocks.push(targetBlock);

    // Add other initial blocks
    for (let i = 1; i < DIFFICULTY_SETTINGS[difficulty].initialBlocks; i++) {
      initialBlocks.push(generateWord());
    }
    setFallingWords(initialBlocks);

    // Set up interval for new blocks
    const interval = setInterval(() => {
      setFallingWords(prev => {
        if (prev.length >= DIFFICULTY_SETTINGS[difficulty].maxBlocks) {
          return prev;
        }

        // Ensure target word appears regularly
        const targetWordExists = prev.some(block => block.word === targetWord);
        if (!targetWordExists && Math.random() < 0.3) { // 30% chance to add target word if none exists
          return [...prev, {
            id: `block-${Date.now()}-target`,
            word: targetWord,
            isTarget: true
          }];
        }

        return [...prev, generateWord()];
      });
    }, DIFFICULTY_SETTINGS[difficulty].interval);

    return () => clearInterval(interval);
  }, [gameState, difficulty, generateWord, targetWord]);

  useEffect(() => {
    if (gameState !== GAME_STATES.PLAYING) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameState(GAME_STATES.END);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  useEffect(() => {
    if (gameState !== GAME_STATES.PLAYING) return;

    const checkInterval = setInterval(() => {
      setFallingWords(prev => {
        const newWords = prev.filter(block => {
          const element = document.getElementById(`block-${block.id}`);
          if (element) {
            const rect = element.getBoundingClientRect();
            if (rect.top > window.innerHeight) {
              handleMissedWord(block.word, rect.left + rect.width / 2);
              return false;
            }
          }
          return true;
        });
        return newWords;
      });
    }, 100);

    return () => clearInterval(checkInterval);
  }, [gameState, handleMissedWord]);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes bigShake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-20px); }
        75% { transform: translateX(20px); }
      }
      
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }
      
      @keyframes tinyShake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-3px); }
        75% { transform: translateX(3px); }
      }
      
      @keyframes violentShake {
        0%, 100% { transform: translate(0, 0); }
        10% { transform: translate(-25px, -10px); }
        20% { transform: translate(20px, 15px); }
        30% { transform: translate(-25px, 10px); }
        40% { transform: translate(25px, -15px); }
        50% { transform: translate(-20px, 10px); }
        60% { transform: translate(15px, -15px); }
        70% { transform: translate(-15px, 10px); }
        80% { transform: translate(10px, -5px); }
        90% { transform: translate(-5px, 2px); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Countdown-Effekt für den Intro-Bildschirm
  useEffect(() => {
    if (gameState !== GAME_STATES.INTRO) return;
    
    const wordShowTimer = setTimeout(() => {
      // Countdown starten
      setCountdownValue(3);
      soundManager.playCountdown(3); // Sound für 3
      
      const countdownInterval = setInterval(() => {
        setCountdownValue(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            soundManager.playGameStart(); // Spielstart-Sound
            setGameState(GAME_STATES.PLAYING);
            return 0;
          }
          const newValue = prev - 1;
          soundManager.playCountdown(newValue); // Sound für 2 und 1
          return newValue;
        });
      }, 1000);
      
      return () => {
        clearTimeout(wordShowTimer);
        clearInterval(countdownInterval);
      };
    }, 4000); // 4 Sekunden warten, bevor der Countdown startet
    
    // Countdown-Wert auf 0 setzen (keine Anzeige), bis der Countdown tatsächlich startet
    setCountdownValue(0);
    
    return () => clearTimeout(wordShowTimer);
  }, [gameState]);

  if (gameState === GAME_STATES.LANDING) {
    return <LandingPage onGameSelect={() => {
      soundManager.playClick(); // Klick-Sound
      setGameState(GAME_STATES.DIFFICULTY);
    }} />;
  }

  if (gameState === GAME_STATES.DIFFICULTY) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-purple-50 p-4">
        <motion.button
          className="absolute top-4 left-4 p-4 text-3xl hover:scale-110 transition-transform"
          onClick={() => {
            soundManager.playClick(); // Klick-Sound
            setGameState(GAME_STATES.LANDING);
          }}
        >
          ⬅️
        </motion.button>

        <div className="flex items-center gap-6 mb-12">
          <span className="text-7xl">⬇️</span>
          <h1 className="text-5xl font-bold text-blue-600">Fallende Wörter</h1>
        </div>
        
        <div className="grid grid-cols-1 gap-8 w-full max-w-md">
          {Object.entries(DIFFICULTY_SETTINGS).map(([level, config]) => (
            <motion.button
              key={level}
              onClick={() => {
                soundManager.playClick(); // Klick-Sound
                startGame(level);
              }}
              className={`${config.color} p-6 rounded-2xl flex items-center justify-between
                shadow-lg hover:shadow-xl transition-all`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-6xl">{config.icon}</span>
              <div className="flex gap-2 bg-white/50 px-4 py-2 rounded-xl">
                {Array.from({ length: config.stars }).map((_, i) => (
                  <motion.span 
                    key={i} 
                    className="text-4xl drop-shadow-md"
                    animate={{ 
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      duration: 2,
                      delay: i * 0.2,
                      repeat: Infinity
                    }}
                  >
                    ⭐
                  </motion.span>
                ))}
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  if (gameState === GAME_STATES.INTRO) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-purple-50 p-4">
        {/* Der Zurück-Button wurde hier entfernt */}

        {/* Container mit fester Struktur für konsistentes Layout */}
        <div className="relative flex flex-col items-center" style={{ minHeight: "320px" }}>
          {/* Zielwort oben mit relativer Positionierung */}
          <motion.div
            className="relative mb-24"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0, y: 50 },
              visible: { opacity: 1, y: 0 }
            }}
            transition={{ duration: 0.7 }}
          >
            <motion.div
              className="text-7xl font-bold bg-white px-12 py-6 rounded-2xl shadow-lg"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [-2, 2, -2, 0],
              }}
              transition={{
                duration: 1.5,
                times: [0, 0.5, 1],
                repeat: 1
              }}
            >
              {targetWord}
            </motion.div>
            
            <motion.div
              className="absolute -right-4 -top-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.2 }}
            >
              <span className="text-5xl">🎯</span>
            </motion.div>
          </motion.div>

          {/* Countdown mit absoluter Positionierung zentriert unter dem Wort */}
          {countdownValue > 0 && (
            <motion.div
              key={countdownValue}
              className="absolute top-48 left-1/2 transform -translate-x-1/2"
              style={{ 
                textAlign: 'center',
                width: '100%',
                left: '0%'
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 1.5, 1], 
                opacity: [0, 1, 0.8] 
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ 
                duration: 0.9, 
                ease: "easeInOut"
              }}
            >
              <div className="text-9xl font-bold relative inline-block">
                <div 
                  className="absolute inset-0 blur-xl" 
                  style={{ 
                    color: getCountdownColor(countdownValue),
                    transform: 'scale(1.2)'
                  }}
                >
                  {countdownValue}
                </div>
                <div style={{ color: getCountdownColor(countdownValue) }}>
                  {countdownValue}
                </div>
              </div>
              
              {/* Bunte Partikel um die Zahl herum */}
              <div className="absolute inset-0 z-0">
                {Array.from({ length: 12 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-6 h-6 rounded-full"
                    style={{
                      background: getRandomBrightColor(),
                      top: '50%',
                      left: '50%',
                    }}
                    animate={{
                      x: [0, Math.cos(i * (Math.PI * 2) / 12) * 80],
                      y: [0, Math.sin(i * (Math.PI * 2) / 12) * 80],
                      opacity: [1, 0],
                      scale: [0, 1]
                    }}
                    transition={{ 
                      duration: 0.9, 
                      ease: "easeOut" 
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  if (gameState === GAME_STATES.PLAYING) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-blue-50 to-purple-50 select-none">
        <div className="fixed top-0 left-0 right-0 p-4 flex justify-between items-center bg-white/80 backdrop-blur z-10 select-none">
          <div className="flex items-center gap-2 ml-4">
            <span className="text-3xl">⏰</span>
            <motion.div 
              className="text-3xl font-bold"
              animate={{
                scale: timeLeft <= 5 ? [1, 1.2, 1] : 1,
                color: timeLeft <= 5 ? ["#000", "#ff0000", "#000"] : "#000"
              }}
              transition={{ duration: 1, repeat: timeLeft <= 5 ? Infinity : 0 }}
            >
              {timeLeft}
            </motion.div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-3xl">🎯</span>
            <motion.span 
              className="text-3xl font-bold"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {targetWord}
            </motion.span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-3xl">🌟</span>
            <motion.div
              key={score}
              className="text-3xl font-bold"
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 0.3 }}
            >
              {score}
            </motion.div>
          </div>
        </div>

        <div className="game-area relative w-full h-full pt-20">
          <AnimatePresence>
            {fallingWords.map(block => (
              <FallingBlock
                key={block.id}
                blockId={block.id}
                word={block.word}
                isTarget={block.isTarget}
                onSelect={handleWordSelect}
                fallDuration={DIFFICULTY_SETTINGS[difficulty].fallDuration}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-purple-50 p-4">
      <div className="flex items-center justify-center gap-6 mb-12">
          <motion.div
          className="text-8xl"
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0]
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {score > 5 ? "🏆" : "🌟"}
          </motion.div>
        <motion.span 
          className="text-7xl font-bold"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.5 
          }}
        >
          {score}
        </motion.span>
      </div>

      <motion.button
        onClick={() => {
          soundManager.playClick(); // Klick-Sound beim Replay-Button
          setGameState(GAME_STATES.LANDING);
        }}
        className="bg-blue-400 p-6 rounded-2xl flex items-center gap-4 shadow-lg"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <span className="text-4xl">🔄</span>
        <span className="text-4xl">🎮</span>
      </motion.button>
    </div>
  );
};

// Helfer-Funktionen für den Countdown
const getCountdownColor = (value) => {
  switch(value) {
    case 3:
      return "#4CAF50"; // Grün
    case 2:
      return "#FFC107"; // Gelb
    case 1:
      return "#F44336"; // Rot
    default:
      return "#2196F3"; // Blau
  }
};

const getRandomBrightColor = () => {
  const brightColors = [
    "#FF3D00", "#FF9100", "#FFEA00", "#C6FF00", 
    "#00E676", "#00B0FF", "#2979FF", "#651FFF", 
    "#D500F9", "#F50057", "#FF1744"
  ];
  return brightColors[Math.floor(Math.random() * brightColors.length)];
};

export default BlitzlesenGame;
