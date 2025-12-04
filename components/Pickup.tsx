
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { playSound } from '../constants';

interface PickupProps {
    position: [number, number, number];
    onPickup: () => void;
}

export const HealthPickup: React.FC<PickupProps> = ({ position, onPickup }) => {
    const meshRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.02;
            meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.2;
        }
    });

    const handleIntersection = (payload: any) => {
        // Very basic check if the colliding object is likely the player
        if (payload.other.rigidBodyObject && payload.other.rigidBodyObject.name !== 'enemy') {
            playSound('heal');
            onPickup();
        }
    };

    return (
        <RigidBody type="fixed" sensor onIntersectionEnter={handleIntersection} position={position}>
            <CuboidCollider args={[0.5, 0.5, 0.5]} />
            <group ref={meshRef}>
                <mesh castShadow>
                    <boxGeometry args={[0.8, 0.8, 0.8]} />
                    <meshStandardMaterial color="#fff" />
                </mesh>
                <mesh position={[0.41, 0, 0]} rotation={[0, Math.PI/2, 0]}>
                    <planeGeometry args={[0.6, 0.6]} />
                    <meshBasicMaterial color="#ef4444" />
                </mesh>
                <mesh position={[-0.41, 0, 0]} rotation={[0, -Math.PI/2, 0]}>
                    <planeGeometry args={[0.6, 0.6]} />
                    <meshBasicMaterial color="#ef4444" />
                </mesh>
                <mesh position={[0, 0, 0.41]}>
                    <planeGeometry args={[0.6, 0.6]} />
                    <meshBasicMaterial color="#ef4444" />
                </mesh>
                <mesh position={[0, 0, -0.41]} rotation={[0, Math.PI, 0]}>
                    <planeGeometry args={[0.6, 0.6]} />
                    <meshBasicMaterial color="#ef4444" />
                </mesh>
                {/* Cross */}
                <mesh position={[0, 0, 0.42]}>
                     <planeGeometry args={[0.4, 0.15]} />
                     <meshBasicMaterial color="#fff" />
                </mesh>
                <mesh position={[0, 0, 0.42]}>
                     <planeGeometry args={[0.15, 0.4]} />
                     <meshBasicMaterial color="#fff" />
                </mesh>
            </group>
        </RigidBody>
    );
};
