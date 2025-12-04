import React, { useRef, useState, useEffect } from 'react';
import { Physics } from '@react-three/rapier';
import { Player } from './Player';
import { Level } from './Level';
import { Enemy } from './Enemy';
import { GameState } from '../types';
import { ENEMY_SPAWN_COUNT } from '../constants';
import * as THREE from 'three';

interface GameSceneProps {
    gameState: GameState;
    onGameOver: () => void;
    setHealth: (h: number | ((prev: number) => number)) => void;
    setScore: (s: number | ((prev: number) => number)) => void;
    setAmmo: (a: number) => void;
    setMaxAmmo: (a: number) => void;
    setWeaponName: (n: string) => void;
    wave: number;
    setWave: (w: number) => void;
}

export const GameScene: React.FC<GameSceneProps> = ({ 
    gameState, onGameOver, setHealth, setScore, setAmmo, setMaxAmmo, setWeaponName, wave, setWave 
}) => {
    const [enemies, setEnemies] = useState<{id: string, position: THREE.Vector3}[]>([]);
    
    useEffect(() => {
        const newEnemies = [];
        const count = ENEMY_SPAWN_COUNT + (wave - 1); // Increase count slower
        
        // Defined spawn points to avoid spawning inside new buildings
        const spawnPoints = [
            [30, 30], [-30, 30], [30, -30], [-30, -30], 
            [0, 40], [40, 0], [0, -40], [-40, 0]
        ];

        for(let i=0; i<count; i++) {
            const pt = spawnPoints[i % spawnPoints.length];
            // Add some randomness around the spawn point
            const x = pt[0] + (Math.random() - 0.5) * 10;
            const z = pt[1] + (Math.random() - 0.5) * 10;
            
            newEnemies.push({
                id: `enemy-${wave}-${i}`,
                position: new THREE.Vector3(x, 2, z)
            });
        }
        setEnemies(newEnemies);
    }, [wave]);

    const handleEnemyDeath = (id: string) => {
        setScore(prev => prev + 100);
        setEnemies(prev => {
            const remaining = prev.filter(e => e.id !== id);
            if (remaining.length === 0) {
                // Wave complete
                setTimeout(() => setWave(wave + 1), 3000); // 3s break between waves
            }
            return remaining;
        });
    };

    const playerRef = useRef<any>(null);

    return (
        <Physics gravity={[0, -20, 0]}>
            <Level />
            
            <Player 
                ref={playerRef}
                gameState={gameState} 
                setHealth={setHealth}
                setAmmo={setAmmo}
                setMaxAmmo={setMaxAmmo}
                setWeaponName={setWeaponName}
                onDie={onGameOver}
            />

            {enemies.map(enemy => (
                <Enemy 
                    key={enemy.id} 
                    position={enemy.position} 
                    playerRef={playerRef}
                    onKilled={() => handleEnemyDeath(enemy.id)}
                    setPlayerHealth={setHealth}
                />
            ))}
        </Physics>
    );
};