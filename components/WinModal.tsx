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
    <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50 px-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl border-4 border-yellow-400 animate-[bounceIn_0.5s_ease-out]">
        <h2 className="text-4xl font-black text-gray-800 mb-2 uppercase tracking-wide">Cleared!</h2>
        
        <div className="flex justify-center gap-2 text-7xl my-8 text-gray-200">
           <span className={`transform transition-all duration-500 ${stars >= 1 ? "text-yellow-400 scale-110 rotate-12" : ""}`}>★</span>
           <span className={`transform transition-all duration-500 delay-150 ${stars >= 2 ? "text-yellow-400 scale-110 -rotate-12" : ""}`}>★</span>
           <span className={`transform transition-all duration-500 delay-300 ${stars >= 3 ? "text-yellow-400 scale-110 rotate-6" : ""}`}>★</span>
        </div>

        <div className="bg-gray-100 rounded-xl p-4 mb-8">
            <p className="text-gray-500 text-sm font-bold uppercase">Total Jumps</p>
            <p className="text-4xl font-black text-sky-600">{jumps}</p>
        </div>

        <div className="flex flex-col gap-3">
          {hasNext && (
            <button 
              onClick={onNext}
              className="w-full py-4 bg-green-500 hover:bg-green-400 text-white text-xl font-bold rounded-xl border-b-4 border-green-700 active:border-b-0 active:translate-y-1 shadow-lg"
            >
              Next Level
            </button>
          )}
          <button 
            onClick={onMenu}
            className="w-full py-4 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xl font-bold rounded-xl border-b-4 border-gray-400 active:border-b-0 active:translate-y-1"
          >
            Menu
          </button>
        </div>
      </div>
    </div>
  );
};

export default WinModal;