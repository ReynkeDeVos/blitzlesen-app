import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { levels, gameTypes } from "../config/levels";

const DifficultySelector = ({ onSelect }) => {
  const difficulties = Object.entries(levels[gameTypes.BLITZLESEN]);

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl w-full mx-4">
      <h1 className="text-4xl font-bold text-center mb-8 text-purple-600">
        Blitzlesen
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {difficulties.map(([key, difficulty]) => (
          <motion.button
            key={key}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(difficulty)}
            className="flex flex-col items-center p-6 rounded-xl bg-gradient-to-b from-white to-gray-50 hover:from-blue-50 hover:to-blue-100 transition-all duration-200 shadow-md"
          >
            <span className="text-4xl mb-4">{difficulty.icon}</span>
            <h2 className="text-xl font-bold text-gray-800 mb-2">{difficulty.name}</h2>
            <p className="text-sm text-gray-600 text-center">{difficulty.description}</p>
            <div className="mt-4 flex items-center space-x-2 text-sm text-gray-500">
              <span>⭐ {difficulty.maxBlocks} Wörter</span>
              <span>⚡ {difficulty.fallDuration}s</span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

DifficultySelector.propTypes = {
  onSelect: PropTypes.func.isRequired,
};

export default DifficultySelector;
