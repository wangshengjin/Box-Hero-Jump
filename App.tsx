import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import LevelSelect from './components/LevelSelect';
import WinModal from './components/WinModal';
import { LEVELS } from './constants';
import { GameState, PlayerProgress } from './types';

// Initial unlocked state: Level 1 is open
const INITIAL_PROGRESS: PlayerProgress = {
  1: { unlocked: true, stars: 0 },
  2: { unlocked: false, stars: 0 },
  3: { unlocked: false, stars: 0 },
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [progress, setProgress] = useState<PlayerProgress>(INITIAL_PROGRESS);
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
        if (!next[nextLevelId]) next[nextLevelId] = { unlocked: true, stars: 0 }; // Initialize if missing
        next[nextLevelId].unlocked = true;
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