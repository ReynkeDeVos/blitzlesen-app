import { useEffect, useCallback, useState, useRef } from "react";
import PropTypes from "prop-types";
import FallingBlock from "./FallingBlock";
import { gameConfig } from "../config/levels";

const GameBoard = ({
  difficulty,
  targetWord,
  onBlockClick,
  visualElements,
  isGameActive,
  onBlockRemove,
}) => {
  const [blocks, setBlocks] = useState([]);
  const occupiedSectionsRef = useRef(new Set());
  const spawnIntervalRef = useRef(null);

  const calculateSections = useCallback(() => {
    const screenWidth = window.innerWidth;
    const availableWidth = screenWidth - 2 * gameConfig.MARGIN;
    const possibleSections = Math.floor(availableWidth / gameConfig.SECTION_MIN_WIDTH);
    return Math.max(2, Math.min(possibleSections, 4));
  }, []);

  const generateBlock = useCallback(() => {
    const sections = calculateSections();
    const availableSections = Array.from({ length: sections }, (_, i) => i)
      .filter(section => !occupiedSectionsRef.current.has(section));

    if (availableSections.length === 0) return null;

    const section = availableSections[Math.floor(Math.random() * availableSections.length)];
    const screenWidth = window.innerWidth;
    const sectionWidth = (screenWidth - 2 * gameConfig.MARGIN) / sections;

    const xPosition = Math.max(
      gameConfig.MARGIN,
      Math.min(
        gameConfig.MARGIN + section * sectionWidth + Math.random() * (sectionWidth * 0.6),
        screenWidth - gameConfig.MIN_BLOCK_WIDTH - gameConfig.MARGIN
      )
    );

    const shouldBeTargetWord = Math.random() < difficulty.targetChance;
    const word = shouldBeTargetWord ? targetWord : gameConfig.words[Math.floor(Math.random() * gameConfig.words.length)];

    occupiedSectionsRef.current.add(section);

    return {
      id: Date.now().toString(),
      word,
      x: xPosition,
      y: -gameConfig.BLOCK_HEIGHT,
      section,
      isTarget: shouldBeTargetWord,
      isShaking: false,
      isExploding: false,
    };
  }, [calculateSections, difficulty.targetChance, targetWord]);

  const removeBlock = useCallback((blockId) => {
    setBlocks(prev => {
      const block = prev.find(b => b.id === blockId);
      if (block) {
        occupiedSectionsRef.current.delete(block.section);
        onBlockRemove?.(blockId);
      }
      return prev.filter(b => b.id !== blockId);
    });
  }, [onBlockRemove]);

  // Reset game state
  useEffect(() => {
    if (!isGameActive) {
      setBlocks([]);
      occupiedSectionsRef.current = new Set();
      if (spawnIntervalRef.current) {
        clearInterval(spawnIntervalRef.current);
        spawnIntervalRef.current = null;
      }
      return;
    }

    // Initialize blocks
    const initialBlocks = [];
    occupiedSectionsRef.current = new Set();
    
    for (let i = 0; i < difficulty.initialBlocks; i++) {
      const block = generateBlock();
      if (block) initialBlocks.push(block);
    }

    setBlocks(initialBlocks);

    // Set up spawn interval
    spawnIntervalRef.current = setInterval(() => {
      setBlocks(prev => {
        if (prev.length >= difficulty.maxBlocks) return prev;
        const newBlock = generateBlock();
        return newBlock ? [...prev, newBlock] : prev;
      });
    }, difficulty.spawnInterval);

    return () => {
      if (spawnIntervalRef.current) {
        clearInterval(spawnIntervalRef.current);
        spawnIntervalRef.current = null;
      }
    };
  }, [isGameActive, difficulty.initialBlocks, difficulty.maxBlocks, difficulty.spawnInterval, generateBlock]);

  const handleBlockClick = useCallback((word, blockId) => {
    onBlockClick(word, blockId);
    removeBlock(blockId);
  }, [onBlockClick, removeBlock]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {blocks.map(block => (
        <FallingBlock
          key={block.id}
          blockId={block.id}
          {...block}
          onClick={handleBlockClick}
          visualElements={visualElements}
          fallDuration={difficulty.fallDuration}
        />
      ))}
    </div>
  );
};

GameBoard.propTypes = {
  difficulty: PropTypes.shape({
    maxBlocks: PropTypes.number.isRequired,
    initialBlocks: PropTypes.number.isRequired,
    targetChance: PropTypes.number.isRequired,
    spawnInterval: PropTypes.number.isRequired,
    fallDuration: PropTypes.number.isRequired,
  }).isRequired,
  targetWord: PropTypes.string.isRequired,
  onBlockClick: PropTypes.func.isRequired,
  visualElements: PropTypes.shape({
    targetColor: PropTypes.string.isRequired,
    blockColor: PropTypes.string.isRequired,
  }).isRequired,
  isGameActive: PropTypes.bool.isRequired,
  onBlockRemove: PropTypes.func,
};

export default GameBoard; 