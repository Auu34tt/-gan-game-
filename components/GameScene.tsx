
import React, { useRef, useState, useEffect } from 'react';
import { Physics } from '@react-three/rapier';
import { Player } from './Player';
import { Level } from './Level';
import { Enemy } from './Enemy';
import { HealthPickup } from './Pickup';
import { GameState } from '../types';
import { ENEMY_SPAWN_COUNT, HEALTH_PACK_HEAL } from '../constants';
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
    const [pickups, setPickups] = useState<{id: string, position: [number, number, number]}[]>([]);
    
    // Check for Game Over via Health State in Player or here. 
    // Since we pass setHealth to children, we need to ensure the parent (App) or a listener checks it.
    // However, Player handles 'onDie' when y < -30. 
    // We also need to check if health <= 0 inside Enemy's attack logic, but Enemy only sets health.
    // Best way: App.tsx checks health, but since we are in GameScene, let's wrap setHealth.
    
    const wrappedSetHealth = (val: number | ((prev: number) => number)) => {
        setHealth(prev => {
            const next = typeof val === 'function' ? val(prev) : val;
            if (next <= 0) {
                // Defer to avoid render loop issues
                setTimeout(onGameOver, 0);
                return 0;
            }
            return next;
        });
    };

    useEffect(() => {
        const newEnemies = [];
        const count = ENEMY_SPAWN_COUNT + Math.floor((wave - 1) / 1.5); 
        
        const spawnPoints = [
            [0, 40], [0, -40], [40, 0], [-40, 0],
            [35, 35], [-35, -35], [35, -35], [-35, 35]
        ];

        for(let i=0; i<count; i++) {
            const pt = spawnPoints[i % spawnPoints.length];
            const x = pt[0] + (Math.random() - 0.5) * 8;
            const z = pt[1] + (Math.random() - 0.5) * 8;
            newEnemies.push({
                id: `enemy-${wave}-${i}`,
                position: new THREE.Vector3(x, 2, z)
            });
        }
        setEnemies(newEnemies);

        // Spawn Health Packs for the wave
        const newPickups = [];
        const pickupCount = 2 + Math.floor(Math.random() * 2);
        for(let i=0; i<pickupCount; i++) {
             newPickups.push({
                id: `hp-${wave}-${i}`,
                position: [(Math.random()-0.5)*60, 1.5, (Math.random()-0.5)*60] as [number, number, number]
             });
        }
        setPickups(newPickups);

    }, [wave]);

    const handleEnemyDeath = (id: string) => {
        setScore(prev => prev + 100);
        setEnemies(prev => {
            const remaining = prev.filter(e => e.id !== id);
            if (remaining.length === 0) {
                setTimeout(() => setWave(wave + 1), 3000); 
            }
            return remaining;
        });
    };

    const handlePickup = (id: string) => {
        wrappedSetHealth(h => Math.min(100, h + HEALTH_PACK_HEAL));
        setPickups(prev => prev.filter(p => p.id !== id));
    };

    const playerRef = useRef<any>(null);

    return (
        <Physics gravity={[0, -25, 0]}>
            <Level />
            
            <Player 
                ref={playerRef}
                gameState={gameState} 
                setHealth={wrappedSetHealth}
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
                    setPlayerHealth={wrappedSetHealth}
                />
            ))}

            {pickups.map(pickup => (
                <HealthPickup 
                    key={pickup.id}
                    position={pickup.position}
                    onPickup={() => handlePickup(pickup.id)}
                />
            ))}
        </Physics>
    );
};
