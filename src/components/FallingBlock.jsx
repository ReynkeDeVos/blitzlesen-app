import { motion } from "framer-motion";
import PropTypes from "prop-types";
import { useState, useRef } from "react";

const FallingBlock = ({ word, isTarget, onSelect, blockId, fallDuration = 6 }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const clickedRef = useRef(false);
  const randomX = Math.random() * (window.innerWidth - 120);
  
  const handleClick = (e) => {
    e.preventDefault(); // Prevent any default behavior
    e.stopPropagation(); // Stop event bubbling
    
    // Verhindere Mehrfachklicks auf denselben Block
    if (clickedRef.current) {
      return;
    }
    
    // Markiere den Block als angeklickt
    clickedRef.current = true;
    setIsClicked(true);
    
    const rect = e.currentTarget.getBoundingClientRect();
    onSelect(word, blockId, rect.left + rect.width / 2, rect.top + rect.height / 2);
  };

  // Alle Blöcke haben die gleiche (blaue) Farbe, unabhängig davon, ob sie Zielwörter sind
  const getBlockStyle = () => {
    if (isClicked && isTarget) {
      // Stil für angeklickte Zielwörter (transparenter)
      return {
        backgroundColor: "rgba(37, 99, 235, 0.4)",
        boxShadow: "0 0 5px rgba(37, 99, 235, 0.3)",
        border: "2px solid rgba(30, 64, 175, 0.4)",
        pointerEvents: "none" // Keine weiteren Klicks möglich
      };
    }
    
    return {
      backgroundColor: isHovered ? "#1e40af" : "#2563eb", // Deeper blue on hover
      boxShadow: isHovered ? "0 0 15px rgba(37, 99, 235, 0.8)" : "0 0 8px rgba(37, 99, 235, 0.6)",
      border: "2px solid #1e40af"
    };
  };

  return (
    <motion.button
      id={`block-${blockId}`}
      initial={{ y: -100, x: randomX, rotate: Math.random() * 10 - 5 }}
      animate={{ 
        y: window.innerHeight + 100,
        rotate: [Math.random() * 6 - 3, Math.random() * -6 + 3, Math.random() * 6 - 3]
      }}
      exit={{ opacity: 0, scale: 0, rotate: Math.random() * 180 - 90 }}
      transition={{ 
        y: { duration: isTarget ? fallDuration : fallDuration * 0.75, ease: "linear" },
        rotate: { repeat: Infinity, duration: 3, ease: "easeInOut" },
        opacity: { duration: 0.2 },
        scale: { duration: 0.2 }
      }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="absolute px-6 py-3 rounded-xl text-white font-bold text-2xl 
        transform hover:scale-110 transition-transform
        select-none cursor-pointer"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      style={{ 
        ...getBlockStyle(),
        userSelect: 'none', 
        touchAction: 'none'
      }}
    >
      {word}
    </motion.button>
  );
};

FallingBlock.propTypes = {
  word: PropTypes.string.isRequired,
  isTarget: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
  blockId: PropTypes.string.isRequired,
  fallDuration: PropTypes.number
};

export default FallingBlock; 