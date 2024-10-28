/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react/prop-types */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Target, Check, X } from "lucide-react";
import confetti from "canvas-confetti";
import { gameConfig } from "../config/gameConfig";
import { difficultyLevels } from "../config/difficultyLevels";
import DifficultySelector from "./DifficultySelector";

const BlitzlesenGame = () => {
  const [gameState, setGameState] = useState("difficulty"); // difficulty, start, intro, playing, end
  const [difficulty, setDifficulty] = useState(null);
  const [targetWord, setTargetWord] = useState("");
  const [fallingWords, setFallingWords] = useState([]);
  const [timeLeft, setTimeLeft] = useState(gameConfig.GAME_DURATION);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [missedWord, setMissedWord] = useState(false);
  const [shakingWordId, setShakingWordId] = useState(null);
  const [explodingWordId, setExplodingWordId] = useState(null);

  // Statistik-States
  const [correctClicks, setCorrectClicks] = useState(0);
  const [wrongClicks, setWrongClicks] = useState(0);
  const [missedTargets, setMissedTargets] = useState(0);

  // Berechnung der verfügbaren Sections basierend auf Bildschirmbreite
  const calculateSections = useCallback(() => {
    const screenWidth = window.innerWidth;
    const availableWidth = screenWidth - 2 * gameConfig.MARGIN;
    const possibleSections = Math.floor(availableWidth / gameConfig.SECTION_MIN_WIDTH);
    return Math.max(3, possibleSections); // Mindestens 3 Sections
  }, []);

  const selectRandomWord = useCallback(() => {
    const word = gameConfig.words[Math.floor(Math.random() * gameConfig.words.length)];
    setTargetWord(word);
    return word;
  }, []);

  const handleDifficultySelect = (selectedDifficulty) => {
    setDifficulty(selectedDifficulty);
    setGameState("start");
  };

  // Konfetti-Animation für perfektes Spiel
  const triggerConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  };

  const startGame = () => {
    if (!difficulty) return;

    setGameState("intro");
    setCorrectClicks(0);
    setWrongClicks(0);
    setMissedTargets(0);
    setTimeLeft(gameConfig.GAME_DURATION);
    selectRandomWord();

    setTimeout(() => {
      setGameState("playing");
    }, gameConfig.INTRO_DURATION);
  };

  const handleWordClick = (word, id) => {
    if (word === targetWord) {
      setCorrectClicks((prev) => prev + 1);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), gameConfig.FEEDBACK_DURATION);

      // Explosionseffekt
      setExplodingWordId(id);
      setTimeout(() => {
        setFallingWords((prev) => prev.filter((w) => w.id !== id));
        setExplodingWordId(null);
      }, gameConfig.EXPLOSION_DURATION);

      // Lokaler Konfetti-Effekt
      const element = document.getElementById(`word-${id}`);
      if (element) {
        const rect = element.getBoundingClientRect();
        confetti({
          particleCount: 30,
          spread: 100,
          origin: {
            x: rect.left / window.innerWidth,
            y: rect.top / window.innerHeight,
          },
        });
      }
    } else {
      setWrongClicks((prev) => prev + 1);
      setShowError(true);
      setTimeout(() => setShowError(false), gameConfig.FEEDBACK_DURATION);

      // Wackeleffekt
      setShakingWordId(id);
      setTimeout(() => setShakingWordId(null), gameConfig.SHAKE_DURATION);
    }
  };

  const checkMissedWords = useCallback(() => {
    fallingWords.forEach((word) => {
      const element = document.getElementById(`word-${word.id}`);
      if (element) {
        const rect = element.getBoundingClientRect();
        if (rect.top > window.innerHeight) {
          if (word.word === targetWord) {
            setMissedTargets((prev) => prev + 1);
            setMissedWord(true);

            // Explosionseffekt für verpasstes Zielwort
            const missedWordRect = element.getBoundingClientRect();
            confetti({
              particleCount: 20,
              spread: 360,
              origin: {
                x: missedWordRect.left / window.innerWidth,
                y: missedWordRect.top / window.innerHeight,
              },
              colors: ["#ff0000", "#ff4444", "#ff8888"],
              startVelocity: 20,
              gravity: 0.5,
            });

            setTimeout(() => setMissedWord(false), gameConfig.FEEDBACK_DURATION);
          }
          setFallingWords((prev) => prev.filter((w) => w.id !== word.id));
        }
      }
    });
  }, [fallingWords, targetWord]);

  // Wortgenerierung mit dynamischer Section-Berechnung
  useEffect(() => {
    if (gameState !== "playing" || !difficulty) return;

    const currentConfig = difficultyLevels[difficulty];
    const generateWord = () => {
      const screenWidth = window.innerWidth;
      const availableSections = calculateSections();
      const sectionWidth = (screenWidth - 2 * gameConfig.MARGIN) / availableSections;

      const section = Math.floor(Math.random() * availableSections);
      const xPosition = Math.max(
        gameConfig.MARGIN,
        Math.min(
          gameConfig.MARGIN + section * sectionWidth + Math.random() * (sectionWidth * 0.6),
          screenWidth - gameConfig.MIN_WORD_WIDTH - gameConfig.MARGIN
        )
      );

      const shouldBeTargetWord = Math.random() < currentConfig.TARGET_WORD_CHANCE;
      const word = shouldBeTargetWord
        ? targetWord
        : gameConfig.words[Math.floor(Math.random() * gameConfig.words.length)];

      return {
        id: Date.now() + Math.random(),
        word,
        x: xPosition,
        section,
      };
    };

    const generateInitialWords = () => {
      const newWords = Array(currentConfig.INITIAL_WORDS)
        .fill(null)
        .map(() => generateWord());
      setFallingWords((prev) => [...prev, ...newWords]);
    };

    const addNewWord = () => {
      if (fallingWords.length >= currentConfig.MAX_WORDS) return;

      const occupiedSections = fallingWords.map((word) => word.section);

      let newWord;
      let attempts = 0;
      do {
        newWord = generateWord();
        attempts++;
      } while (occupiedSections.includes(newWord.section) && attempts < 15);

      if (attempts < 15) {
        setFallingWords((prev) => [...prev, newWord]);
      }
    };

    const startTimeout = setTimeout(() => {
      generateInitialWords();
    }, 500);

    const wordInterval = setInterval(() => {
      addNewWord();
    }, currentConfig.WORD_SPAWN_INTERVAL);

    return () => {
      clearTimeout(startTimeout);
      clearInterval(wordInterval);
    };
  }, [gameState, targetWord, fallingWords, difficulty, calculateSections]);

  // Bildschirmgrößenänderung
  useEffect(() => {
    const handleResize = () => {
      const availableSections = calculateSections();
      const screenWidth = window.innerWidth;
      const sectionWidth = (screenWidth - 2 * gameConfig.MARGIN) / availableSections;

      setFallingWords((prev) =>
        prev.map((word) => {
          const section = Math.floor(Math.random() * availableSections);
          const xPosition = gameConfig.MARGIN + section * sectionWidth + Math.random() * (sectionWidth * 0.6);
          return {
            ...word,
            x: xPosition,
            section,
          };
        })
      );
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [calculateSections]);

  // Überprüfung verpasster Wörter
  useEffect(() => {
    if (gameState !== "playing") return;
    const checkInterval = setInterval(checkMissedWords, 100);
    return () => clearInterval(checkInterval);
  }, [gameState, checkMissedWords]);

  // Spielzeit
  useEffect(() => {
    if (gameState !== "playing") return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameState("end");
          if (wrongClicks === 0 && missedTargets === 0) {
            setTimeout(triggerConfetti, 500);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, wrongClicks, missedTargets]);

  const ResultCard = ({ icon: Icon, label, value, color }) => (
    <div className={`bg-white p-4 rounded-xl shadow-lg flex flex-col items-center gap-2 ${color}`}>
      <Icon className="w-8 h-8" />
      <div className="text-xl font-bold">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );

  // Wenn keine Schwierigkeit ausgewählt ist, zeige den Schwierigkeitsauswahl-Screen
  if (gameState === "difficulty") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-100 to-purple-100 flex items-center justify-center p-4">
        <DifficultySelector onSelect={handleDifficultySelect} />
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gradient-to-b from-sky-100 to-purple-100">
      {/* Header */}
      {gameState === "playing" && (
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center bg-white/80 backdrop-blur-sm shadow-lg z-10">
          <div className="flex items-center gap-4 text-2xl font-bold text-purple-700">
            <Target className="w-8 h-8 text-yellow-500" />
            {targetWord}
          </div>
          <div className="text-xl font-bold text-purple-700">
            {difficultyLevels[difficulty].emoji} {difficultyLevels[difficulty].name}
          </div>
          <div className="flex items-center gap-4 text-2xl font-bold text-purple-700">
            <Timer className="w-8 h-8 text-blue-500" />
            {timeLeft}s
          </div>
        </motion.div>
      )}

      {/* Intro Animation */}
      {gameState === "intro" && (
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0, x: -100 }}
          className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-8">
            <motion.div
              className="text-8xl"
              animate={{
                rotate: [-10, 10, -10],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}>
              🔍
            </motion.div>

            <motion.div
              className="bg-white/90 px-12 py-8 rounded-3xl shadow-2xl"
              animate={{
                rotate: [-2, 2, -2],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2,
                ease: "easeInOut",
                repeat: 1,
              }}>
              <motion.div className="text-6xl md:text-8xl font-bold text-purple-600">{targetWord}</motion.div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Spielbereich */}
      <div className="relative h-full">
        <AnimatePresence>
          {fallingWords.map(({ id, word, x }) => (
            <motion.div
              key={id}
              id={`word-${id}`}
              initial={{ y: -50, x }}
              animate={{
                y: window.innerHeight + 100,
                x: x,
                scale: explodingWordId === id ? [1, 1.2, 0] : 1,
                rotate: shakingWordId === id ? [-5, 5, -5, 5, 0] : 0,
                backgroundColor: shakingWordId === id ? ["#ffffff", "#ff0000", "#ffffff"] : "#ffffff",
              }}
              exit={
                explodingWordId === id
                  ? {
                      scale: 0,
                      opacity: 0,
                    }
                  : { opacity: 0 }
              }
              transition={{
                y: { duration: difficulty ? difficultyLevels[difficulty].WORD_FALL_DURATION : 10, ease: "linear" },
                rotate: { duration: gameConfig.SHAKE_DURATION / 1000, ease: "easeInOut" },
                backgroundColor: { duration: gameConfig.SHAKE_DURATION / 1000, ease: "easeInOut" },
                scale: explodingWordId === id ? { duration: gameConfig.EXPLOSION_DURATION / 1000 } : { duration: 0.3 },
              }}
              onClick={() => handleWordClick(word, id)}
              className="falling-word absolute bg-white hover:bg-yellow-50 px-2 sm:px-4 py-1 sm:py-2 text-lg sm:text-2xl font-bold rounded-lg sm:rounded-xl shadow-lg cursor-pointer whitespace-nowrap"
              style={{
                transformOrigin: "center center",
                maxWidth: `${gameConfig.SECTION_MIN_WIDTH - 20}px`,
              }}>
              {word}
              {explodingWordId === id && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}>
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                      initial={{ scale: 0 }}
                      animate={{
                        scale: [0, 1, 0],
                        x: [0, Math.cos((i * Math.PI) / 4) * 50],
                        y: [0, Math.sin((i * Math.PI) / 4) * 50],
                      }}
                      transition={{ duration: 0.5 }}
                    />
                  ))}
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Feedback Animationen */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 20 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                     bg-gradient-to-r from-green-400 to-green-500 
                     text-white px-12 py-6 rounded-2xl text-4xl font-bold
                     shadow-lg">
            Super! 🎉
          </motion.div>
        )}
        {showError && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                     bg-gradient-to-r from-orange-400 to-orange-500
                     text-white px-12 py-6 rounded-2xl text-4xl font-bold
                     shadow-lg">
            Suche "{targetWord}" 🔍
          </motion.div>
        )}
        {missedWord && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="absolute bottom-20 left-1/2 transform -translate-x-1/2
                     bg-gradient-to-r from-blue-400 to-blue-500
                     text-white px-12 py-6 rounded-2xl text-4xl font-bold
                     shadow-lg">
            Oops! 👀
          </motion.div>
        )}
      </AnimatePresence>

      {/* Start/Ende Screen */}
      {(gameState === "start" || gameState === "end") && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-purple-500/50 to-pink-500/50 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-12 rounded-3xl text-center shadow-2xl max-w-3xl mx-4">
            <motion.h2
              className="text-4xl md:text-5xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}>
              {gameState === "end" ? "Toll gemacht! 🌟" : "Blitzlesen 📚"}
            </motion.h2>

            {gameState === "end" && (
              <div className="mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <ResultCard icon={Check} label="Richtig gelesen" value={correctClicks} color="text-green-600" />
                  <ResultCard icon={X} label="Falsch geklickt" value={wrongClicks} color="text-red-600" />
                  <ResultCard icon={Target} label="Durchgefallen" value={missedTargets} color="text-blue-600" />
                </div>
                {wrongClicks === 0 && missedTargets === 0 && correctClicks > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-2xl font-bold text-green-600 mb-4">
                    🎉 Perfekt! Keine Fehler! 🎉
                  </motion.div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startGame}
                className="game-button">
                {gameState === "end" ? "Nochmal spielen" : "Spiel starten"}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setGameState("difficulty")}
                className="text-purple-600 font-bold text-lg hover:text-purple-700">
                Schwierigkeit ändern
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default BlitzlesenGame;
