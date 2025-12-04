
import React, { useMemo } from 'react';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { Sky, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { FLOOR_SIZE } from '../constants';

// --- BUILDING BLOCKS ---

const WallBlock: React.FC<{ position: [number, number, number], size: [number, number, number], color?: string, rotation?: [number, number, number] }> = ({ position, size, color = "#d6d3d1", rotation = [0,0,0] }) => {
    return (
        <RigidBody type="fixed" position={position} rotation={rotation} colliders="cuboid">
            <mesh castShadow receiveShadow>
                <boxGeometry args={size} />
                <meshStandardMaterial color={color} roughness={0.5} />
            </mesh>
        </RigidBody>
    );
};

const Ramp: React.FC<{ position: [number, number, number], size: [number, number, number], rotation?: [number, number, number] }> = ({ position, size, rotation=[0,0,0] }) => {
    return (
        <RigidBody type="fixed" position={position} rotation={rotation} colliders="hull">
            <mesh castShadow receiveShadow>
                <boxGeometry args={size} />
                <meshStandardMaterial color="#9ca3af" roughness={0.8} />
            </mesh>
        </RigidBody>
    );
};

// --- PREFABS ---

const Tree: React.FC<{ position: [number, number, number], scale?: number }> = ({ position, scale = 1 }) => {
    return (
        <group position={position} scale={[scale, scale, scale]}>
            <RigidBody type="fixed" colliders="hull">
                <mesh position={[0, 1.5, 0]} castShadow>
                    <cylinderGeometry args={[0.4, 0.6, 3, 6]} />
                    <meshStandardMaterial color="#5D4037" roughness={0.9} />
                </mesh>
            </RigidBody>
            <mesh position={[0, 4, 0]} castShadow>
                <coneGeometry args={[2.5, 4, 8]} />
                <meshStandardMaterial color="#4ade80" roughness={0.8} />
            </mesh>
            <mesh position={[0, 6, 0]} castShadow>
                <coneGeometry args={[2, 3, 8]} />
                <meshStandardMaterial color="#22c55e" roughness={0.8} />
            </mesh>
        </group>
    );
};

const Crate: React.FC<{ position: [number, number, number], rotation?: number }> = ({ position, rotation = 0 }) => (
    <RigidBody type="dynamic" position={position} rotation={[0, rotation, 0]} mass={0.5} colliders="cuboid">
        <mesh castShadow receiveShadow>
            <boxGeometry args={[1.5, 1.5, 1.5]} />
            <meshStandardMaterial color="#d97706" roughness={0.6} />
        </mesh>
    </RigidBody>
);

const Sandbags: React.FC<{ position: [number, number, number], rotation?: number }> = ({ position, rotation = 0 }) => (
    <group position={position} rotation={[0, rotation, 0]}>
        <RigidBody type="fixed" colliders="cuboid">
             <mesh position={[0, 0.3, 0]} castShadow>
                <boxGeometry args={[3, 0.6, 1]} />
                <meshStandardMaterial color="#a8a29e" />
             </mesh>
             <mesh position={[0.5, 0.8, 0]} castShadow>
                <boxGeometry args={[1.5, 0.5, 0.8]} />
                <meshStandardMaterial color="#a8a29e" />
             </mesh>
        </RigidBody>
    </group>
);

// --- COMPLEX BUILDINGS ---

const SniperTower: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    return (
        <group position={position}>
            <WallBlock position={[4, 5, 4]} size={[1, 10, 1]} color="#78716c" />
            <WallBlock position={[-4, 5, 4]} size={[1, 10, 1]} color="#78716c" />
            <WallBlock position={[4, 5, -4]} size={[1, 10, 1]} color="#78716c" />
            <WallBlock position={[-4, 5, -4]} size={[1, 10, 1]} color="#78716c" />

            <WallBlock position={[0, 0.2, 0]} size={[10, 0.4, 10]} color="#a8a29e" />
            <Ramp position={[5, 2.5, 0]} size={[3, 6, 10]} rotation={[0, 0, 0.5]} />

            <WallBlock position={[0, 5, 0]} size={[10, 0.4, 10]} color="#a8a29e" />
            <WallBlock position={[0, 6, 4.5]} size={[10, 2, 0.5]} color="#d6d3d1" />
            <Ramp position={[-5, 7.5, 0]} size={[3, 6, 10]} rotation={[0, 0, -0.5]} />

            <WallBlock position={[0, 10, 0]} size={[10, 0.4, 10]} color="#a8a29e" />
            <WallBlock position={[4.5, 11, 0]} size={[0.5, 2, 10]} color="#d6d3d1" />
            <WallBlock position={[-4.5, 11, 0]} size={[0.5, 2, 10]} color="#d6d3d1" />
            <WallBlock position={[0, 11, -4.5]} size={[10, 2, 0.5]} color="#d6d3d1" />
            <WallBlock position={[0, 11, 4.5]} size={[10, 2, 0.5]} color="#d6d3d1" />
        </group>
    );
};

const RuinedHouse: React.FC<{ position: [number, number, number], rotation?: number }> = ({ position, rotation=0 }) => {
    return (
        <group position={position} rotation={[0, rotation, 0]}>
             <WallBlock position={[0, 0.2, 0]} size={[16, 0.4, 12]} color="#e5e7eb" />
             
             <WallBlock position={[-7.5, 2.5, 0]} size={[1, 5, 12]} color="#d1d5db" />
             <WallBlock position={[7.5, 2.5, 0]} size={[1, 5, 12]} color="#d1d5db" />
             <WallBlock position={[0, 2.5, -5.5]} size={[14, 5, 1]} color="#d1d5db" />
             
             <WallBlock position={[-5, 2.5, 5.5]} size={[6, 5, 1]} color="#d1d5db" />
             <WallBlock position={[5, 2.5, 5.5]} size={[6, 5, 1]} color="#d1d5db" />
             <WallBlock position={[0, 4, 5.5]} size={[4, 2, 1]} color="#d1d5db" />

             <WallBlock position={[0, 2.5, 0]} size={[14, 5, 0.5]} color="#e5e7eb" />

             <WallBlock position={[-4, 5.2, 0]} size={[8, 0.4, 12]} color="#f3f4f6" />
             <Ramp position={[4, 2.5, 3]} size={[3, 7, 0.5]} rotation={[0.6, 0, 0]} />
             
             <WallBlock position={[-7.5, 6.5, 0]} size={[1, 3, 12]} color="#d1d5db" />
             <WallBlock position={[0, 6.5, -5.5]} size={[14, 3, 1]} color="#d1d5db" />
        </group>
    );
};

const Warehouse: React.FC<{ position: [number, number, number], rotation?: number }> = ({ position, rotation=0 }) => {
    return (
        <group position={position} rotation={[0, rotation, 0]}>
             <WallBlock position={[0, 0.2, 0]} size={[20, 0.4, 30]} color="#9ca3af" />
             <WallBlock position={[-9.5, 5, 0]} size={[1, 10, 30]} color="#4b5563" />
             <WallBlock position={[9.5, 5, 0]} size={[1, 10, 30]} color="#4b5563" />
             <WallBlock position={[0, 5, -14.5]} size={[18, 10, 1]} color="#4b5563" />

             <WallBlock position={[0, 10, -10]} size={[20, 1, 1]} color="#374151" />
             <WallBlock position={[0, 10, 0]} size={[20, 1, 1]} color="#374151" />
             <WallBlock position={[0, 10, 10]} size={[20, 1, 1]} color="#374151" />

             <WallBlock position={[-7, 5, 0]} size={[4, 0.5, 28]} color="#1f2937" />
             <Ramp position={[-7, 2.5, 10]} size={[2, 6, 0.2]} rotation={[0.5, 0, 0]} />
        </group>
    );
};

// --- ENVIRONMENT ---

const Ground = () => {
    const texture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext('2d');
        if (context) {
            // Bright Green Grass
            context.fillStyle = '#4ade80'; 
            context.fillRect(0, 0, 512, 512);
            
            // Grass blades / noise
            for(let i=0; i<30000; i++) {
                const x = Math.random() * 512;
                const y = Math.random() * 512;
                const w = Math.random() * 3;
                const h = Math.random() * 3;
                context.fillStyle = Math.random() > 0.5 ? '#22c55e' : '#86efac'; // Varied green
                context.fillRect(x,y,w,h);
            }
        }
        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(50, 50);
        return tex;
    }, []);

    return (
        <RigidBody type="fixed" friction={2} restitution={0}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                <planeGeometry args={[FLOOR_SIZE, FLOOR_SIZE, 128, 128]} />
                <meshStandardMaterial map={texture} roughness={1} />
            </mesh>
            <CuboidCollider args={[FLOOR_SIZE / 2, 0.1, FLOOR_SIZE / 2]} position={[0, -0.1, 0]} />
        </RigidBody>
    );
}

const Road: React.FC<{ position: [number, number, number], args: [number, number] }> = ({ position, args }) => (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[position[0], 0.05, position[2]]} receiveShadow>
        <planeGeometry args={args} />
        <meshStandardMaterial color="#6b7280" roughness={0.5} />
    </mesh>
);

export const Level: React.FC = () => {
    return (
        <>
            {/* Brighter, Cheerful Sky */}
            <Sky sunPosition={[100, 40, 100]} turbidity={8} rayleigh={6} mieCoefficient={0.005} />
            <ambientLight intensity={0.7} color="#fff" />
            <directionalLight 
                position={[50, 100, 50]} 
                intensity={1.5} 
                castShadow 
                shadow-mapSize={[2048, 2048]}
                shadow-bias={-0.0005}
            />
            {/* Light blue fog instead of dark */}
            <fog attach="fog" args={['#e0f2fe', 30, 150]} />

            <Ground />

            {/* --- ROADS --- */}
            <Road position={[0, 0, 0]} args={[12, FLOOR_SIZE]} />
            <Road position={[0, 0, 0]} args={[FLOOR_SIZE, 12]} />
            
            {/* --- BUILDINGS & STRUCTURES --- */}
            <Warehouse position={[-40, 0, -40]} rotation={Math.PI/4} />
            <Crate position={[-35, 3, -35]} />
            <Crate position={[-35, 1, -45]} />
            <Crate position={[-45, 1, -35]} />
            
            <SniperTower position={[40, 0, -40]} />
            <Sandbags position={[35, 0, -35]} rotation={Math.PI/4} />
            <Sandbags position={[45, 0, -45]} rotation={Math.PI/4} />

            <RuinedHouse position={[-35, 0, 35]} rotation={0} />
            <RuinedHouse position={[-35, 0, 55]} rotation={0} />
            <WallBlock position={[-25, 1, 45]} size={[1, 2, 10]} color="#78716c" rotation={[0,0,0.2]} />
            
            <Sandbags position={[30, 0, 30]} />
            <Sandbags position={[35, 0, 30]} />
            <Sandbags position={[30, 0, 25]} rotation={Math.PI/2} />
            
            <Sandbags position={[8, 0, 8]} rotation={Math.PI/4} />
            <Sandbags position={[-8, 0, -8]} rotation={Math.PI/4} />
            <Sandbags position={[8, 0, -8]} rotation={-Math.PI/4} />
            <Sandbags position={[-8, 0, 8]} rotation={-Math.PI/4} />

            {/* Tank in center */}
            <group position={[15, 0, 0]} rotation={[0, -1.5, 0]}>
                <WallBlock position={[0, 1.5, 0]} size={[6, 2, 3.5]} color="#506548" />
                <WallBlock position={[0, 2.8, 0]} size={[3, 1, 2.5]} color="#506548" />
                <mesh position={[2, 2.8, 0]} rotation={[0,0,-1.5]} castShadow>
                     <cylinderGeometry args={[0.15, 0.15, 4]} />
                     <meshStandardMaterial color="#111" />
                </mesh>
            </group>

            {/* --- VEGETATION (More trees) --- */}
            {Array.from({length: 80}).map((_, i) => {
                const angle = (i / 80) * Math.PI * 2;
                const r = 85 + Math.random() * 15;
                const x = Math.cos(angle) * r;
                const z = Math.sin(angle) * r;
                return <Tree key={`border-${i}`} position={[x, 0, z]} scale={1.5 + Math.random()} />;
            })}
            
            {Array.from({length: 25}).map((_, i) => {
                 const x = 20 + Math.random() * 40;
                 const z = 20 + Math.random() * 40;
                 return <Tree key={`se-${i}`} position={[x, 0, z]} />;
            })}

            {/* Invisible Walls */}
            <RigidBody type="fixed">
                 <CuboidCollider args={[FLOOR_SIZE/2, 20, 2]} position={[0, 10, -FLOOR_SIZE/2]} />
                 <CuboidCollider args={[FLOOR_SIZE/2, 20, 2]} position={[0, 10, FLOOR_SIZE/2]} />
                 <CuboidCollider args={[2, 20, FLOOR_SIZE/2]} position={[-FLOOR_SIZE/2, 10, 0]} />
                 <CuboidCollider args={[2, 20, FLOOR_SIZE/2]} position={[FLOOR_SIZE/2, 10, 0]} />
            </RigidBody>
        </>
    );
};
