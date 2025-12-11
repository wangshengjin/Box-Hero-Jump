import React, { useState } from 'react';
import { PlayerProgress } from '../types';
import { LEVELS } from '../constants';

interface LevelSelectProps {
  progress: PlayerProgress;
  onSelectLevel: (id: number) => void;
}

const LevelSelect: React.FC<LevelSelectProps> = ({ progress, onSelectLevel }) => {
  // We can just show all levels in a scrollable list for mobile instead of pagination
  // It feels more native.
  
  return (
    <div className="flex flex-col h-full w-full bg-gray-900 text-white overflow-hidden">
      {/* Header */}
      <div className="flex-none pt-10 pb-6 text-center z-10 bg-gradient-to-b from-gray-900 to-gray-900/0">
        <h1 className="text-4xl font-black text-yellow-400 tracking-wider drop-shadow-lg uppercase">
          BOX HERO
        </h1>
        <p className="text-sky-400 text-lg font-bold tracking-[0.3em] uppercase mt-1">
          Vertical
        </p>
      </div>
      
      {/* Scrollable Grid */}
      <div className="flex-1 overflow-y-auto px-6 pb-20 custom-scrollbar">
        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
            {LEVELS.map((level) => {
              const levelState = progress[level.id];
              const isLocked = !levelState || !levelState.unlocked;
              
              return (
                <button
                  key={level.id}
                  onClick={() => !isLocked && onSelectLevel(level.id)}
                  disabled={isLocked}
                  className={`
                    aspect-square relative rounded-2xl border-b-4 transition-all duration-100 flex flex-col items-center justify-center
                    ${isLocked 
                      ? 'bg-gray-800 border-gray-700 opacity-40' 
                      : 'bg-sky-500 border-sky-700 active:border-b-0 active:translate-y-1 active:bg-sky-400 shadow-lg'}
                  `}
                >
                  {isLocked ? (
                    <span className="text-2xl opacity-50">🔒</span>
                  ) : (
                    <>
                      <span className="text-3xl font-black text-white drop-shadow-md mb-1">
                        {level.id}
                      </span>
                      <div className="flex gap-px">
                        {[1, 2, 3].map((star) => (
                          <span key={star} className={`text-[10px] ${star <= levelState.stars ? 'text-yellow-300' : 'text-black/20'}`}>
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
      </div>

      {/* Footer Decoration */}
      <div className="flex-none py-6 text-center text-gray-500 text-xs font-medium uppercase tracking-widest opacity-50">
         Drag • Aim • Fly
      </div>
    </div>
  );
};

export default LevelSelect;