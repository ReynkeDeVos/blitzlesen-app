/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react/prop-types */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Target, Check, X } from "lucide-react";
import confetti from "canvas-confetti";

const words = [
  "der",
  "die",
  "das",
  "und",
  "ist",
  "von",
  "mit",
  "auf",
  "für",
  "aus",
  "bei",
  "bis",
  "hat",
  "war",
  "zur",
  "wie",
  "dem",
  "nur",
  "vor",
  "zum",
];

const BlitzlesenGame = () => {
  const [gameState, setGameState] = useState("start"); // start, intro, playing, end
  const [targetWord, setTargetWord] = useState("");
  const [fallingWords, setFallingWords] = useState([]);
  const [timeLeft, setTimeLeft] = useState(45);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [missedWord, setMissedWord] = useState(false);
  const [lastMissedWord, setLastMissedWord] = useState("");
  const [shakingWordId, setShakingWordId] = useState(null);
  const [explodingWordId, setExplodingWordId] = useState(null);

  // Statistik-States
  const [correctClicks, setCorrectClicks] = useState(0);
  const [wrongClicks, setWrongClicks] = useState(0);
  const [missedTargets, setMissedTargets] = useState(0);
  const [targetWordAppearances, setTargetWordAppearances] = useState(0);

  const selectRandomWord = useCallback(() => {
    const word = words[Math.floor(Math.random() * words.length)];
    setTargetWord(word);
    return word;
  }, []);

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
    setGameState("intro");
    setCorrectClicks(0);
    setWrongClicks(0);
    setMissedTargets(0);
    setTargetWordAppearances(0);
    setTimeLeft(45);
    selectRandomWord();

    setTimeout(() => {
      setGameState("playing");
    }, 4000);
  };

  const handleWordClick = (word, id) => {
    if (word === targetWord) {
      setCorrectClicks((prev) => prev + 1);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1500);

      // Explosionseffekt
      setExplodingWordId(id);
      setTimeout(() => {
        setFallingWords((prev) => prev.filter((w) => w.id !== id));
        setExplodingWordId(null);
      }, 500);

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
      setTimeout(() => setShowError(false), 1500);

      // Wackeleffekt
      setShakingWordId(id);
      setTimeout(() => setShakingWordId(null), 500);
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
            setLastMissedWord(word.word);

            // Explosionseffekt für verpasstes Zielwort
            const missedWordRect = element.getBoundingClientRect();
            confetti({
              particleCount: 20,
              spread: 360,
              origin: {
                x: missedWordRect.left / window.innerWidth,
                y: missedWordRect.top / window.innerHeight,
              },
              colors: ["#ff0000", "#ff4444", "#ff8888"], // rötliche Farben
              startVelocity: 20,
              gravity: 0.5,
            });

            setTimeout(() => setMissedWord(false), 1500);
          }
          setFallingWords((prev) => prev.filter((w) => w.id !== word.id));
        }
      }
    });
  }, [fallingWords, targetWord]);

  // Wortgenerierung
  useEffect(() => {
    if (gameState !== "playing") {
      setFallingWords([]);
      return;
    }

    const generateWord = () => {
      const screenWidth = window.innerWidth;
      const margin = 150;
      const availableWidth = screenWidth - 2 * margin;

      // 20% Chance für das Zielwort
      const shouldBeTargetWord = Math.random() < 0.2;
      const word = shouldBeTargetWord ? targetWord : words[Math.floor(Math.random() * words.length)];

      if (shouldBeTargetWord) {
        setTargetWordAppearances((prev) => prev + 1);
      }

      const xPosition = margin + Math.random() * availableWidth;

      return {
        id: Date.now() + Math.random(),
        word,
        x: xPosition,
      };
    };

    // Initialer Batch von Wörtern
    const generateInitialWords = () => {
      const newWords = Array(3)
        .fill(null)
        .map(() => generateWord());
      setFallingWords((prev) => [...prev, ...newWords]);
    };

    // Einzelnes neues Wort
    const addNewWord = () => {
      setFallingWords((prev) => [...prev, generateWord()]);
    };

    // Start nach kurzer Verzögerung
    const startTimeout = setTimeout(() => {
      generateInitialWords();
    }, 1000);

    // Regelmäßig neue Wörter hinzufügen
    const wordInterval = setInterval(() => {
      addNewWord();
    }, 2000);

    return () => {
      clearTimeout(startTimeout);
      clearInterval(wordInterval);
    };
  }, [gameState, targetWord]);

  // Separate useEffect für das Aufräumen der fallingWords
  useEffect(() => {
    if (gameState !== "playing") {
      setFallingWords([]); // Clear words when game is not playing
    }
  }, [gameState]);

  useEffect(() => {
    if (gameState !== "playing") return;
    const checkInterval = setInterval(checkMissedWords, 100);
    return () => clearInterval(checkInterval);
  }, [gameState, checkMissedWords]);

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
            {/* Große Lupe */}
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

            {/* Box mit Wort */}
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
                y: { duration: 10, ease: "linear" },
                rotate: { duration: 0.5, ease: "easeInOut" },
                backgroundColor: { duration: 0.5, ease: "easeInOut" },
                scale: explodingWordId === id ? { duration: 0.5 } : { duration: 0.3 },
              }}
              onClick={() => handleWordClick(word, id)}
              className="falling-word absolute bg-white hover:bg-yellow-50 px-6 py-3 text-2xl font-bold rounded-xl shadow-lg cursor-pointer"
              style={{
                transformOrigin: "center center",
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

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startGame}
              className="game-button">
              {gameState === "end" ? "Nochmal spielen" : "Spiel starten"}
            </motion.button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default BlitzlesenGame;
