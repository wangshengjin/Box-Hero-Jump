import React, { useState, useEffect, useRef } from 'react';
import { PlayerProgress } from '../types';
import { LEVELS } from '../constants';

interface LevelSelectProps {
  progress: PlayerProgress;
  onSelectLevel: (id: number) => void;
}

const ITEMS_PER_PAGE = 15;
const GRID_COLS = 5;
const GRID_ROWS = 3;
const GAP_PX = 16; // gap-4 is 1rem = 16px

const LevelSelect: React.FC<LevelSelectProps> = ({ progress, onSelectLevel }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [cellSize, setCellSize] = useState(80);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  const totalPages = Math.ceil(LEVELS.length / ITEMS_PER_PAGE);
  
  const currentLevels = LEVELS.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const handlePrev = () => {
    if (currentPage > 0) setCurrentPage(p => p - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages - 1) setCurrentPage(p => p + 1);
  };

  // Dynamic sizing effect to ensure grid fits in viewport
  useEffect(() => {
    const handleResize = () => {
      if (!gridContainerRef.current) return;
      
      const { width, height } = gridContainerRef.current.getBoundingClientRect();
      
      // Available space minus padding
      const availWidth = width - 32; 
      const availHeight = height - 32;

      // Calculate max theoretical size for width and height constraints
      const sizeByWidth = (availWidth - (GAP_PX * (GRID_COLS - 1))) / GRID_COLS;
      const sizeByHeight = (availHeight - (GAP_PX * (GRID_ROWS - 1))) / GRID_ROWS;

      // Use the smaller dimension to ensure it fits both ways, cap at 110px
      const newSize = Math.floor(Math.min(sizeByWidth, sizeByHeight, 110));
      
      // Ensure a reasonable minimum
      setCellSize(Math.max(newSize, 45)); 
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    const timer = setTimeout(handleResize, 50); // Small delay for layout settle

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-900 text-white overflow-hidden">
      {/* Header */}
      <div className="flex-none pt-6 pb-2 text-center z-10">
        <h1 className="text-3xl md:text-5xl font-black text-yellow-400 tracking-wider drop-shadow-lg uppercase">
          Box Hero Jump
        </h1>
        <p className="text-gray-400 text-xs md:text-sm mt-1 font-bold tracking-wide">
          LEVEL SELECT
        </p>
      </div>
      
      {/* Flexible Middle Area for Grid - fills available space */}
      <div ref={gridContainerRef} className="flex-1 min-h-0 w-full flex items-center justify-center p-4">
        <div 
            className="grid gap-4 transition-all duration-300"
            style={{ 
                gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
            }}
        >
            {currentLevels.map((level) => {
              const levelState = progress[level.id];
              const isLocked = !levelState || !levelState.unlocked;
              
              return (
                <button
                  key={level.id}
                  onClick={() => !isLocked && onSelectLevel(level.id)}
                  disabled={isLocked}
                  style={{ width: `${cellSize}px`, height: `${cellSize}px` }}
                  className={`
                    relative rounded-xl border-4 transition-all duration-200 flex flex-col items-center justify-center group
                    ${isLocked 
                      ? 'bg-gray-800 border-gray-700 cursor-not-allowed opacity-50' 
                      : 'bg-sky-500 border-sky-700 hover:bg-sky-400 hover:scale-105 cursor-pointer shadow-[0_4px_0_rgb(3,105,161)] active:shadow-none active:translate-y-1'}
                  `}
                >
                  {isLocked ? (
                    <div className="opacity-50 grayscale" style={{ fontSize: `${cellSize * 0.4}px` }}>🔒</div>
                  ) : (
                    <>
                      <span className="font-black text-white drop-shadow-md group-hover:scale-110 transition-transform leading-none mb-1" style={{ fontSize: `${cellSize * 0.4}px` }}>
                        {level.id}
                      </span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3].map((star) => (
                          <span key={star} style={{ fontSize: `${cellSize * 0.15}px` }} className={`${star <= levelState.stars ? 'text-yellow-300 drop-shadow-sm' : 'text-gray-900/40'}`}>
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

      {/* Footer / Pagination */}
      <div className="flex-none pb-6 pt-2 flex flex-col items-center z-10 bg-gray-900 shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-4 md:gap-8 text-base md:text-lg font-bold select-none">
            <button 
                onClick={handlePrev}
                disabled={currentPage === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-b-4 transition-all active:border-b-0 active:translate-y-1 ${
                    currentPage === 0 
                    ? 'bg-gray-800 border-gray-800 text-gray-600 cursor-default opacity-50 border-b-0' 
                    : 'bg-gray-700 border-gray-900 text-white hover:bg-gray-600 hover:text-yellow-400'
                }`}
            >
                ◀ Prev
            </button>
            
            <div className="bg-gray-800 px-5 py-2 rounded-full border border-gray-700 min-w-[100px] text-center shadow-inner">
                 <span className="text-yellow-400 text-xl">{currentPage + 1}</span> <span className="text-gray-600 mx-2">/</span> <span className="text-gray-400">{totalPages}</span>
            </div>

            <button 
                onClick={handleNext}
                disabled={currentPage === totalPages - 1}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-b-4 transition-all active:border-b-0 active:translate-y-1 ${
                    currentPage === totalPages - 1 
                    ? 'bg-gray-800 border-gray-800 text-gray-600 cursor-default opacity-50 border-b-0' 
                    : 'bg-gray-700 border-gray-900 text-white hover:bg-gray-600 hover:text-yellow-400'
                }`}
            >
                Next ▶
            </button>
        </div>

        <div className="mt-4 text-gray-500 text-xs md:text-sm text-center px-4 font-medium opacity-70">
          ARROWS to Move • SPACE to Jump
        </div>
      </div>
    </div>
  );
};

export default LevelSelect;