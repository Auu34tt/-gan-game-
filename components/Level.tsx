import React, { useMemo } from 'react';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { Sky, Stars, Cloud, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { FLOOR_SIZE } from '../constants';

const Wall: React.FC<{ position: [number, number, number], size: [number, number, number], color?: string, transparent?: boolean }> = ({ position, size, color = "#57534e", transparent = false }) => {
    return (
        <RigidBody type="fixed" position={position} colliders="cuboid">
            <mesh castShadow receiveShadow>
                <boxGeometry args={size} />
                <meshStandardMaterial color={color} transparent={transparent} opacity={transparent ? 0 : 1} roughness={0.9} />
            </mesh>
        </RigidBody>
    );
};

// Advanced Building with Window and Door
const Building: React.FC<{ position: [number, number, number], size: [number, number, number], rotation?: number, color?: string }> = ({ position, size, rotation = 0, color = "#52525b" }) => {
    const [w, h, d] = size;
    const thickness = 0.5;

    return (
        <group position={position} rotation={[0, rotation, 0]}>
            {/* Base Floor inside */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]} receiveShadow>
                <planeGeometry args={[w - 0.5, d - 0.5]} />
                <meshStandardMaterial color="#27272a" />
            </mesh>

            {/* Back Wall (Solid) */}
            <Wall position={[0, h / 2, -d / 2]} size={[w, h, thickness]} color={color} />
            
            {/* Front Wall (Doorway) */}
            <Wall position={[-w / 3, h / 2, d / 2]} size={[w / 3, h, thickness]} color={color} />
            <Wall position={[w / 3, h / 2, d / 2]} size={[w / 3, h, thickness]} color={color} />
            <Wall position={[0, h - 1, d / 2]} size={[w / 3, 2, thickness]} color={color} />

            {/* Left Wall (Window) */}
            <Wall position={[-w / 2, h / 4, 0]} size={[thickness, h/2, d]} color={color} /> {/* Bottom */}
            <Wall position={[-w / 2, h * 0.85, 0]} size={[thickness, h * 0.3, d]} color={color} /> {/* Top */}
            <Wall position={[-w / 2, h / 2, -d/3]} size={[thickness, h, d/3]} color={color} /> {/* Side */}
            <Wall position={[-w / 2, h / 2, d/3]} size={[thickness, h, d/3]} color={color} /> {/* Side */}

            {/* Right Wall (Solid) */}
            <Wall position={[w / 2, h / 2, 0]} size={[thickness, h, d]} color={color} />

            {/* Roof */}
            <Wall position={[0, h, 0]} size={[w + 1, thickness, d + 1]} color="#3f3f46" />
        </group>
    );
};

const Crate: React.FC<{ position: [number, number, number] }> = ({ position }) => (
    <RigidBody type="dynamic" position={position} colliders="cuboid" mass={2}>
        <mesh castShadow receiveShadow>
            <boxGeometry args={[1.5, 1.5, 1.5]} />
            <meshStandardMaterial color="#854d0e" roughness={0.6} />
        </mesh>
    </RigidBody>
);

const Ground = () => {
    const texture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext('2d');
        if (context) {
            context.fillStyle = '#4a5d23'; // Base grass
            context.fillRect(0, 0, 512, 512);
            context.fillStyle = '#3f5218'; // Darker patches
            for(let i=0; i<40; i++) {
                const x = Math.random() * 512;
                const y = Math.random() * 512;
                const r = Math.random() * 50;
                context.beginPath();
                context.arc(x,y,r,0,Math.PI*2);
                context.fill();
            }
        }
        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(20, 20);
        return tex;
    }, []);

    return (
        <RigidBody type="fixed" friction={2}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                <planeGeometry args={[FLOOR_SIZE, FLOOR_SIZE, 32, 32]} />
                <meshStandardMaterial map={texture} roughness={1} />
            </mesh>
            <CuboidCollider args={[FLOOR_SIZE / 2, 0.1, FLOOR_SIZE / 2]} position={[0, -0.1, 0]} />
        </RigidBody>
    );
}

export const Level: React.FC = () => {
    return (
        <>
            <Sky sunPosition={[100, 40, 50]} turbidity={8} rayleigh={0.6} mieCoefficient={0.005} mieDirectionalG={0.8} />
            <ambientLight intensity={0.5} color="#cceeff" />
            <directionalLight 
                position={[50, 100, 50]} 
                intensity={1.2} 
                castShadow 
                shadow-mapSize={[2048, 2048]}
                shadow-bias={-0.0001}
            >
                <orthographicCamera attach="shadow-camera" args={[-60, 60, 60, -60]} />
            </directionalLight>

            <Ground />

            {/* Map Borders */}
            <Wall position={[0, 5, -FLOOR_SIZE/2]} size={[FLOOR_SIZE, 10, 2]} />
            <Wall position={[0, 5, FLOOR_SIZE/2]} size={[FLOOR_SIZE, 10, 2]} />
            <Wall position={[-FLOOR_SIZE/2, 5, 0]} size={[2, 10, FLOOR_SIZE]} />
            <Wall position={[FLOOR_SIZE/2, 5, 0]} size={[2, 10, FLOOR_SIZE]} />

            {/* City Layout */}
            
            {/* Center Plaza Cover */}
            <Wall position={[0, 1, 8]} size={[4, 2, 1]} color="#a1a1aa" />
            <Wall position={[0, 1, -8]} size={[4, 2, 1]} color="#a1a1aa" />
            <Wall position={[8, 1, 0]} size={[1, 2, 4]} color="#a1a1aa" />
            <Wall position={[-8, 1, 0]} size={[1, 2, 4]} color="#a1a1aa" />

            {/* NW House */}
            <Building position={[-25, 0, -25]} size={[12, 6, 12]} rotation={Math.PI / 6} color="#78716c" />
            
            {/* NE Bunker */}
            <Building position={[30, 0, -20]} size={[10, 5, 15]} rotation={-Math.PI / 8} color="#57534e" />
            
            {/* SW Warehouse */}
            <Building position={[-20, 0, 30]} size={[15, 8, 10]} rotation={0} color="#4b5563" />

            {/* SE Ruins */}
            <Wall position={[25, 2, 25]} size={[1, 4, 10]} color="#7f1d1d" />
            <Wall position={[30, 2, 20]} size={[10, 4, 1]} color="#7f1d1d" />
            <Crate position={[28, 1, 28]} />
            <Crate position={[22, 1, 24]} />

            {/* Random Cover Scatter */}
            <Crate position={[-10, 10, -10]} />
            <Crate position={[10, 5, 10]} />
            <Wall position={[-35, 1.5, 0]} size={[2, 3, 8]} color="#3f3f46" />
            <Wall position={[35, 1.5, 5]} size={[2, 3, 8]} color="#3f3f46" />

            {/* Large central tower block */}
            <Building position={[0, 0, -45]} size={[20, 12, 10]} color="#1e1b4b" />
        </>
    );
};