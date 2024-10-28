import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Timer, Award } from "lucide-react";

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
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  const selectRandomWord = useCallback(() => {
    const word = words[Math.floor(Math.random() * words.length)];
    setTargetWord(word);
    return word;
  }, []);

  const startGame = () => {
    setGameState("intro");
    setScore(0);
    setTimeLeft(45);
    selectRandomWord();

    // Nach der Intro-Animation zum eigentlichen Spiel wechseln
    setTimeout(() => {
      setGameState("playing");
    }, 3000);
  };

  const handleWordClick = (word, id) => {
    if (word === targetWord) {
      setScore((prev) => prev + 1);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1000);
      setFallingWords((prev) => prev.filter((w) => w.id !== id));
      selectRandomWord();
    } else {
      setShowError(true);
      setTimeout(() => setShowError(false), 1000);
    }
  };

  useEffect(() => {
    if (gameState !== "playing") return;

    const interval = setInterval(() => {
      if (Math.random() < 0.3) {
        const newWord = words[Math.floor(Math.random() * words.length)];
        const newId = Date.now();
        const screenWidth = window.innerWidth;
        const xPosition = Math.random() * (screenWidth - 150); // Berücksichtigung der Wortbreite

        setFallingWords((prev) => [
          ...prev,
          {
            id: newId,
            word: newWord,
            x: xPosition,
          },
        ]);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [gameState]);

  useEffect(() => {
    if (gameState !== "playing") return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameState("end");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gradient-to-b from-sky-100 to-purple-100">
      {/* Header - nur während des Spiels sichtbar */}
      {gameState === "playing" && (
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center bg-white/80 backdrop-blur-sm shadow-lg z-10">
          <div className="flex items-center gap-4 text-2xl font-bold text-purple-700">
            <Star className="w-8 h-8 text-yellow-500" />
            Suche: {targetWord}
          </div>
          <div className="flex items-center gap-4 text-2xl font-bold text-purple-700">
            <Timer className="w-8 h-8 text-blue-500" />
            {timeLeft}s
          </div>
          <div className="flex items-center gap-4 text-2xl font-bold text-purple-700">
            <Award className="w-8 h-8 text-green-500" />
            {score}
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
          <motion.div
            className="text-6xl md:text-8xl font-bold text-purple-600 bg-white/90 px-12 py-8 rounded-3xl shadow-2xl"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 2,
              ease: "easeInOut",
            }}>
            {targetWord}
          </motion.div>
        </motion.div>
      )}

      {/* Spielbereich */}
      <div className="relative h-full">
        <AnimatePresence>
          {fallingWords.map(({ id, word, x }) => (
            <motion.div
              key={id}
              initial={{ y: -50, x }}
              animate={{ y: window.innerHeight }}
              exit={{ opacity: 0 }}
              transition={{ duration: 8, ease: "linear" }}
              onClick={() => handleWordClick(word, id)}
              className="falling-word absolute"
              style={{
                background: `linear-gradient(135deg, ${word === targetWord ? "#f0fff4" : "#ffffff"} 0%, ${
                  word === targetWord ? "#dcfce7" : "#f8fafc"
                } 100%)`,
              }}>
              {word}
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
            Weiter so! 🌟
          </motion.div>
        )}
      </AnimatePresence>

      {/* Start/Ende Screen */}
      {(gameState === "start" || gameState === "end") && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-purple-500/50 to-pink-500/50 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-12 rounded-3xl text-center shadow-2xl max-w-2xl mx-4">
            <motion.h2
              className="text-4xl md:text-5xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}>
              {gameState === "end" ? "Toll gemacht! 🌟" : "Blitzlesen 📚"}
            </motion.h2>

            {gameState === "end" && (
              <div className="mb-8">
                <p className="text-3xl mb-4">Deine Punkte:</p>
                <motion.div
                  className="text-6xl font-bold text-purple-600"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}>
                  {score}
                </motion.div>
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
