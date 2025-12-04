import React, { useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { KeyboardControls, KeyboardControlsEntry } from '@react-three/drei';
import { GameScene } from './components/GameScene';
import { UIOverlay } from './components/UIOverlay';
import { GameState } from './types';

export enum Controls {
  forward = 'forward',
  backward = 'backward',
  left = 'left',
  right = 'right',
  jump = 'jump',
  sprint = 'sprint',
  fire = 'fire',
  aim = 'aim',
  reload = 'reload',
  switch = 'switch'
}

const map: KeyboardControlsEntry<Controls>[] = [
  { name: Controls.forward, keys: ['ArrowUp', 'w', 'W'] },
  { name: Controls.backward, keys: ['ArrowDown', 's', 'S'] },
  { name: Controls.left, keys: ['ArrowLeft', 'a', 'A'] },
  { name: Controls.right, keys: ['ArrowRight', 'd', 'D'] },
  { name: Controls.jump, keys: ['Space'] },
  { name: Controls.sprint, keys: ['Shift'] },
  { name: Controls.reload, keys: ['r', 'R'] },
  { name: Controls.switch, keys: ['1', '2'] },
];

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [ammo, setAmmo] = useState(30);
  const [maxAmmo, setMaxAmmo] = useState(30);
  const [wave, setWave] = useState(1);
  const [weaponName, setWeaponName] = useState('RIFLE');

  const startGame = () => {
    setGameState(GameState.PLAYING);
    setScore(0);
    setHealth(100);
    setWave(1);
  };

  const handleGameOver = useCallback(() => {
    setGameState(GameState.GAME_OVER);
    document.exitPointerLock();
  }, []);

  // Sync Pointer Lock state with Game State (loosely)
  useEffect(() => {
    const handleLockChange = () => {
      if (document.pointerLockElement === null && gameState === GameState.PLAYING) {
        setGameState(GameState.PAUSED);
      }
    };
    document.addEventListener('pointerlockchange', handleLockChange);
    return () => document.removeEventListener('pointerlockchange', handleLockChange);
  }, [gameState]);

  return (
    <div className="relative w-full h-full bg-black">
      <KeyboardControls map={map}>
        <Canvas
          shadows
          camera={{ fov: 75, position: [0, 2, 0] }}
          gl={{ antialias: true, toneMappingExposure: 1.1 }}
          className="w-full h-full"
        >
          {gameState !== GameState.MENU && (
            <GameScene
              gameState={gameState}
              onGameOver={handleGameOver}
              setHealth={setHealth}
              setScore={setScore}
              setAmmo={setAmmo}
              setMaxAmmo={setMaxAmmo}
              setWeaponName={setWeaponName}
              wave={wave}
              setWave={setWave}
            />
          )}
        </Canvas>
      </KeyboardControls>

      <UIOverlay
        gameState={gameState}
        setGameState={setGameState}
        startGame={startGame}
        score={score}
        health={health}
        ammo={ammo}
        maxAmmo={maxAmmo}
        weaponName={weaponName}
        wave={wave}
      />
    </div>
  );
};

export default App;