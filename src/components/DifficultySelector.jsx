/* eslint-disable react/prop-types */
// src/components/DifficultySelector.jsx
import { motion } from "framer-motion";
import { difficultyLevels } from "../config/difficultyLevels";

const DifficultySelector = ({ onSelect }) => {
  return (
    <div className="flex flex-col items-center gap-8">
      <h2 className="text-4xl md:text-5xl font-bold text-purple-600">Wähle deinen Level 🎮</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
        {Object.entries(difficultyLevels).map(([key, level]) => (
          <motion.button
            key={key}
            onClick={() => onSelect(key)}
            className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}>
            <div className="text-4xl mb-4">{level.emoji}</div>
            <div className="text-2xl font-bold text-purple-600 mb-2">{level.name}</div>
            <div className="text-gray-600 text-sm">{level.description}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default DifficultySelector;
