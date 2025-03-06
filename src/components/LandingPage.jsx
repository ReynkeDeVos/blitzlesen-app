import { motion } from "framer-motion";
import PropTypes from "prop-types";

const LandingPage = ({ onGameSelect }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-purple-50 p-4">
      <div className="flex items-center gap-6 mb-12">
        <span className="text-7xl">📚</span>
        <h1 className="text-5xl font-bold text-blue-600">Blitzlesen</h1>
      </div>

      <motion.button
        onClick={() => onGameSelect('fallingBlocks')}
        className="bg-blue-100 p-8 rounded-2xl flex flex-col items-center gap-4 shadow-lg
          hover:shadow-xl transition-all w-full max-w-md"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="text-6xl">⬇️</span>
        <div className="text-2xl font-bold text-blue-700">Fallende Wörter</div>
      </motion.button>

      {/* Future games can be added here */}
    </div>
  );
};

LandingPage.propTypes = {
  onGameSelect: PropTypes.func.isRequired
};

export default LandingPage; 