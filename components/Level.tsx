import React from 'react';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { Sky, Stars, Cloud } from '@react-three/drei';
import * as THREE from 'three';
import { FLOOR_SIZE } from '../constants';

const Wall: React.FC<{ position: [number, number, number], size: [number, number, number], color?: string }> = ({ position, size, color = "#57534e" }) => {
    return (
        <RigidBody type="fixed" position={position} colliders="cuboid">
            <mesh castShadow receiveShadow>
                <boxGeometry args={size} />
                <meshStandardMaterial color={color} roughness={0.8} />
            </mesh>
        </RigidBody>
    );
};

// Enterable Building Component
const House: React.FC<{ position: [number, number, number], rotation?: number }> = ({ position, rotation = 0 }) => {
    const width = 8;
    const height = 4;
    const depth = 8;
    const thickness = 0.5;

    return (
        <group position={position} rotation={[0, rotation, 0]}>
            {/* Floor (visual only, real floor handles physics) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]} receiveShadow>
                <planeGeometry args={[width, depth]} />
                <meshStandardMaterial color="#44403c" />
            </mesh>

            {/* Back Wall */}
            <Wall position={[0, height / 2, -depth / 2]} size={[width, height, thickness]} />
            
            {/* Left Wall */}
            <Wall position={[-width / 2, height / 2, 0]} size={[thickness, height, depth]} />
            
            {/* Right Wall */}
            <Wall position={[width / 2, height / 2, 0]} size={[thickness, height, depth]} />
            
            {/* Front Wall (Split for Door) */}
            <Wall position={[-width / 3, height / 2, depth / 2]} size={[width / 3, height, thickness]} />
            <Wall position={[width / 3, height / 2, depth / 2]} size={[width / 3, height, thickness]} />
            <Wall position={[0, height - 0.5, depth / 2]} size={[width / 3, 1, thickness]} />

            {/* Roof */}
            <Wall position={[0, height, 0]} size={[width + 1, thickness, depth + 1]} color="#78350f" />
        </group>
    );
};

export const Level: React.FC = () => {
    return (
        <>
            {/* Environment */}
            <Sky sunPosition={[100, 20, 100]} turbidity={0.5} rayleigh={0.5} />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <Cloud position={[-4, 20, -25]} speed={0.2} opacity={0.5} />
            <Cloud position={[20, 25, 10]} speed={0.2} opacity={0.3} />

            {/* Lighting */}
            <ambientLight intensity={0.4} />
            <directionalLight 
                position={[50, 50, 25]} 
                intensity={1.5} 
                castShadow 
                shadow-mapSize={[2048, 2048]}
                shadow-camera-left={-50}
                shadow-camera-right={50}
                shadow-camera-top={50}
                shadow-camera-bottom={-50}
            />

            {/* Ground */}
            <RigidBody type="fixed" friction={2}>
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                    <planeGeometry args={[FLOOR_SIZE, FLOOR_SIZE, 64, 64]} />
                    <meshStandardMaterial 
                        color="#3f6212" 
                        roughness={1} 
                        side={THREE.DoubleSide}
                        /* Use simple color noise logic for "grass" look by vertex colors would be better but simple color is fine for now */
                    />
                </mesh>
                <CuboidCollider args={[FLOOR_SIZE / 2, 0.1, FLOOR_SIZE / 2]} position={[0, -0.1, 0]} />
            </RigidBody>

            {/* Map Borders */}
            <Wall position={[0, 5, -FLOOR_SIZE/2]} size={[FLOOR_SIZE, 10, 1]} />
            <Wall position={[0, 5, FLOOR_SIZE/2]} size={[FLOOR_SIZE, 10, 1]} />
            <Wall position={[-FLOOR_SIZE/2, 5, 0]} size={[1, 10, FLOOR_SIZE]} />
            <Wall position={[FLOOR_SIZE/2, 5, 0]} size={[1, 10, FLOOR_SIZE]} />

            {/* Structures */}
            <House position={[-15, 0, -15]} rotation={Math.PI / 4} />
            <House position={[15, 0, 15]} rotation={-Math.PI / 3} />
            
            {/* Obstacles / Cover */}
            <Wall position={[5, 1.5, 5]} size={[3, 3, 3]} color="#7c2d12" /> {/* Crate */}
            <Wall position={[-5, 1, 8]} size={[2, 2, 6]} color="#52525b" /> {/* Concrete Barrier */}
            <Wall position={[12, 1, -8]} size={[6, 2, 1]} color="#52525b" />
            
            {/* Uneven Terrain Simulation (Blocks under ground) */}
            <group position={[20, -1, -20]}>
                 <Wall position={[0, 0, 0]} size={[10, 2, 10]} color="#3f6212" />
            </group>
        </>
    );
};