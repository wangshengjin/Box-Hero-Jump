import React from 'react';

interface WinModalProps {
  stars: number;
  jumps: number;
  onNext: () => void;
  onMenu: () => void;
  hasNext: boolean;
}

const WinModal: React.FC<WinModalProps> = ({ stars, jumps, onNext, onMenu, hasNext }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl border-4 border-yellow-400 transform scale-110">
        <h2 className="text-4xl font-black text-gray-800 mb-2">LEVEL CLEARED!</h2>
        
        <div className="flex justify-center gap-2 text-6xl my-6 text-gray-300">
           <span className={stars >= 1 ? "text-yellow-400 animate-bounce" : ""}>★</span>
           <span className={stars >= 2 ? "text-yellow-400 animate-bounce delay-100" : ""}>★</span>
           <span className={stars >= 3 ? "text-yellow-400 animate-bounce delay-200" : ""}>★</span>
        </div>

        <p className="text-gray-600 font-bold text-lg mb-8">
          Jumps Used: <span className="text-sky-600">{jumps}</span>
        </p>

        <div className="flex gap-4 justify-center">
          <button 
            onClick={onMenu}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg border-b-4 border-gray-400 active:border-b-0 active:translate-y-1"
          >
            Menu
          </button>
          {hasNext && (
            <button 
              onClick={onNext}
              className="px-6 py-3 bg-green-500 hover:bg-green-400 text-white font-bold rounded-lg border-b-4 border-green-700 active:border-b-0 active:translate-y-1"
            >
              Next Level
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WinModal;