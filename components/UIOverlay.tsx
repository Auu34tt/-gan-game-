import React from 'react';
import { GameState } from '../types';

interface UIProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  startGame: () => void;
  score: number;
  health: number;
  ammo: number;
  maxAmmo: number;
  weaponName: string;
  wave: number;
}

export const UIOverlay: React.FC<UIProps> = ({
  gameState,
  setGameState,
  startGame,
  score,
  health,
  ammo,
  maxAmmo,
  weaponName,
  wave
}) => {
  // Crosshair
  if (gameState === GameState.PLAYING) {
    return (
      <div className="absolute inset-0 pointer-events-none">
        {/* HUD Top */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start text-white font-bold drop-shadow-md">
          <div className="flex flex-col items-start gap-1">
            <div className="text-2xl text-yellow-400">موج: {wave}</div>
            <div className="text-xl">امتیاز: {score}</div>
          </div>
          <div className="text-xl text-cyan-400 bg-black/40 px-4 py-2 rounded-full border border-cyan-500/50 backdrop-blur-sm">
             ماموریت: نابودی دشمنان
          </div>
        </div>

        {/* HUD Bottom Left - Health */}
        <div className="absolute bottom-6 left-6 flex flex-col gap-2 w-64">
          <div className="flex justify-between text-white font-bold">
            <span>سلامتی</span>
            <span>{Math.round(health)}%</span>
          </div>
          <div className="w-full h-4 bg-gray-800/80 rounded-full overflow-hidden border border-gray-600">
            <div
              className={`h-full transition-all duration-300 ${health > 50 ? 'bg-green-500' : health > 20 ? 'bg-yellow-500' : 'bg-red-600'}`}
              style={{ width: `${health}%` }}
            />
          </div>
        </div>

        {/* HUD Bottom Right - Ammo */}
        <div className="absolute bottom-6 right-6 text-right">
          <div className="text-3xl font-black text-white tracking-wider">
            {weaponName}
          </div>
          <div className={`text-5xl font-bold mt-1 ${ammo < 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            {ammo} <span className="text-2xl text-gray-400">/ {maxAmmo}</span>
          </div>
        </div>

        {/* Crosshair */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-1 h-1 bg-red-500 rounded-full shadow-[0_0_4px_2px_rgba(255,0,0,0.5)]"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 border border-white/40 rounded-full"></div>
        </div>

        {/* Damage Vignette */}
        <div 
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            background: 'radial-gradient(circle, transparent 60%, rgba(255,0,0,0.4) 100%)',
            opacity: 1 - (health / 100)
          }}
        />
      </div>
    );
  }

  // Menu Screen
  if (gameState === GameState.MENU || gameState === GameState.GAME_OVER || gameState === GameState.VICTORY) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-50">
        <div className="max-w-2xl w-full p-8 rounded-2xl border-2 border-indigo-500/50 bg-gray-900/95 backdrop-blur-xl shadow-2xl text-center">
          <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mb-2 filter drop-shadow-lg">
            جنگجوی ایرانی
          </h1>
          <h2 className="text-2xl text-gray-400 mb-8 font-light">نسخه پیشرفته سه بعدی</h2>

          {gameState === GameState.GAME_OVER && (
             <div className="mb-8 p-4 bg-red-900/30 border border-red-500/50 rounded-xl">
               <p className="text-4xl text-red-500 font-bold mb-2">شکست خوردید!</p>
               <p className="text-xl text-white">امتیاز نهایی: {score} | موج: {wave}</p>
             </div>
          )}

          {gameState === GameState.VICTORY && (
             <div className="mb-8 p-4 bg-green-900/30 border border-green-500/50 rounded-xl">
               <p className="text-4xl text-green-400 font-bold mb-2">پیروزی!</p>
               <p className="text-xl text-white">شما تمام دشمنان را نابود کردید.</p>
             </div>
          )}
          
          <div className="flex flex-col gap-4 items-center">
             <button
              onClick={startGame}
              className="px-12 py-4 text-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transform hover:scale-105 transition-all shadow-lg hover:shadow-indigo-500/50 w-full md:w-auto"
             >
               {gameState === GameState.MENU ? 'شروع عملیات' : 'تلاش مجدد'}
             </button>
             
             <div className="mt-8 text-right text-gray-400 text-sm bg-black/50 p-4 rounded-lg w-full">
               <h3 className="text-lg text-white mb-2 font-bold border-b border-gray-700 pb-1">راهنما:</h3>
               <ul className="grid grid-cols-2 gap-2">
                 <li>حرکت: <span className="text-yellow-400">WASD</span></li>
                 <li>پرش: <span className="text-yellow-400">Space</span></li>
                 <li>دویدن: <span className="text-yellow-400">Shift</span></li>
                 <li>شلیک: <span className="text-yellow-400">Click</span></li>
                 <li>نشانه گیری: <span className="text-yellow-400">Right Click</span></li>
                 <li>تعویض سلاح: <span className="text-yellow-400">1 - 2</span></li>
                 <li>خشاب گذاری: <span className="text-yellow-400">R</span></li>
               </ul>
             </div>
          </div>
        </div>
      </div>
    );
  }

  // Pause Menu
  if (gameState === GameState.PAUSED) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-50 backdrop-blur-sm">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white mb-6">بازی متوقف شد</h2>
          <button
            onClick={() => {
                setGameState(GameState.PLAYING);
                const canvas = document.querySelector('canvas');
                canvas?.requestPointerLock();
            }}
            className="px-8 py-3 text-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
          >
            ادامه
          </button>
        </div>
      </div>
    );
  }

  return null;
};