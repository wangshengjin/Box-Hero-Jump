import React from 'react';
import { PlayerProgress } from '../types';
import { LEVELS } from '../constants';

interface LevelSelectProps {
  progress: PlayerProgress;
  onSelectLevel: (id: number) => void;
}

const LevelSelect: React.FC<LevelSelectProps> = ({ progress, onSelectLevel }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-6xl font-black mb-12 text-yellow-400 tracking-wider drop-shadow-lg">
        BOX HERO JUMP
      </h1>
      
      <div className="grid grid-cols-3 gap-8 max-w-4xl w-full">
        {LEVELS.map((level) => {
          const levelState = progress[level.id];
          const isLocked = !levelState || !levelState.unlocked;
          
          return (
            <button
              key={level.id}
              onClick={() => !isLocked && onSelectLevel(level.id)}
              disabled={isLocked}
              className={`
                relative h-40 rounded-xl border-4 transition-all duration-300 flex flex-col items-center justify-center
                ${isLocked 
                  ? 'bg-gray-800 border-gray-700 cursor-not-allowed opacity-60' 
                  : 'bg-sky-500 border-sky-700 hover:bg-sky-400 hover:scale-105 cursor-pointer shadow-[0_8px_0_rgb(3,105,161)] active:shadow-none active:translate-y-2'}
              `}
            >
              {isLocked ? (
                <div className="text-4xl">🔒</div>
              ) : (
                <>
                  <span className="text-5xl font-bold mb-2 text-white drop-shadow-md">{level.id}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3].map((star) => (
                      <span key={star} className={`text-2xl ${star <= levelState.stars ? 'text-yellow-300' : 'text-gray-900/40'}`}>
                        ★
                      </span>
                    ))}
                  </div>
                </>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-16 text-gray-500 text-sm">
        Use Arrow Keys to Move • Space to Jump
      </div>
    </div>
  );
};

export default LevelSelect;