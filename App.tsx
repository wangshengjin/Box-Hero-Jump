import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import LevelSelect from './components/LevelSelect';
import WinModal from './components/WinModal';
import { LEVELS } from './constants';
import { GameState, PlayerProgress } from './types';

// Helper to generate initial state based on available levels
const getInitialProgress = (): PlayerProgress => {
  const progress: PlayerProgress = {};
  LEVELS.forEach(level => {
    progress[level.id] = {
      unlocked: level.id === 1, // Only level 1 is unlocked initially
      stars: 0
    };
  });
  return progress;
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  // Initialize state function to ensure it runs once based on constants
  const [progress, setProgress] = useState<PlayerProgress>(getInitialProgress);
  const [lastResults, setLastResults] = useState<{ jumps: number, stars: number } | null>(null);

  const startLevel = (id: number) => {
    setCurrentLevelId(id);
    setGameState(GameState.PLAYING);
    setLastResults(null);
  };

  const handleLevelWin = (jumps: number) => {
    const levelData = LEVELS.find(l => l.id === currentLevelId);
    if (!levelData) return;

    // Calculate Stars
    let stars = 1;
    if (jumps <= levelData.maxJumps3Stars) stars = 3;
    else if (jumps <= levelData.maxJumps2Stars) stars = 2;

    setLastResults({ jumps, stars });
    
    // Update Progress
    setProgress(prev => {
      const next = { ...prev };
      
      // Update stars for current level if better
      if (stars > next[currentLevelId].stars) {
        next[currentLevelId].stars = stars;
      }

      // Unlock next level
      const nextLevelId = currentLevelId + 1;
      if (nextLevelId <= LEVELS.length) {
        if (!next[nextLevelId]) {
           // Should exist from init, but safety check
           next[nextLevelId] = { unlocked: true, stars: 0 }; 
        } else {
           next[nextLevelId].unlocked = true;
        }
      }
      return next;
    });

    setGameState(GameState.WON);
  };

  const nextLevel = () => {
    const nextId = currentLevelId + 1;
    if (nextId <= LEVELS.length) {
      startLevel(nextId);
    } else {
      setGameState(GameState.MENU);
    }
  };

  const goToMenu = () => {
    setGameState(GameState.MENU);
  };

  const currentLevelData = LEVELS.find(l => l.id === currentLevelId);
  const hasNextLevel = currentLevelId < LEVELS.length;

  return (
    <div className="w-full h-screen bg-gray-900">
      {gameState === GameState.MENU && (
        <LevelSelect progress={progress} onSelectLevel={startLevel} />
      )}

      {(gameState === GameState.PLAYING || gameState === GameState.WON) && currentLevelData && (
        <>
          <GameCanvas 
            key={currentLevelId} // Force remount on level change
            level={currentLevelData} 
            onWin={handleLevelWin}
            onExit={goToMenu}
          />
          
          {gameState === GameState.WON && lastResults && (
            <WinModal 
              stars={lastResults.stars}
              jumps={lastResults.jumps}
              onNext={nextLevel}
              onMenu={goToMenu}
              hasNext={hasNextLevel}
            />
          )}
        </>
      )}
    </div>
  );
}