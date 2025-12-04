import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CapsuleCollider, RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';

interface EnemyProps {
    position: THREE.Vector3;
    playerRef: React.RefObject<RapierRigidBody>;
    onKilled: () => void;
    setPlayerHealth: (fn: (h: number) => number) => void;
}

export const Enemy: React.FC<EnemyProps> = ({ position, playerRef, onKilled, setPlayerHealth }) => {
    const rigidBody = useRef<RapierRigidBody>(null);
    const group = useRef<THREE.Group>(null);
    const [hp, setHp] = useState(100);
    const lastShot = useRef(0);

    // Attach hit handler to mesh userData
    useEffect(() => {
        if(group.current) {
            group.current.traverse((child) => {
                if(child instanceof THREE.Mesh) {
                    child.userData = {
                        type: 'enemy',
                        hit: (damage: number) => setHp(prev => prev - damage)
                    };
                }
            });
        }
    }, []);

    useEffect(() => {
        if(hp <= 0) {
            onKilled();
        }
    }, [hp]);

    useFrame((state, delta) => {
        if (!rigidBody.current || !playerRef.current || hp <= 0) return;

        const myPos = rigidBody.current.translation();
        const playerPos = playerRef.current.translation();
        
        const enemyVec = new THREE.Vector3(myPos.x, myPos.y, myPos.z);
        const playerVec = new THREE.Vector3(playerPos.x, playerPos.y, playerPos.z);
        
        const distance = enemyVec.distanceTo(playerVec);
        const direction = playerVec.clone().sub(enemyVec).normalize();

        // Look at player
        // Simple LookAt for group
        if(group.current) {
            group.current.lookAt(playerVec.x, myPos.y, playerVec.z);
        }

        // AI Logic
        if (distance > 30) {
             // Idle
             rigidBody.current.setLinvel({x: 0, y: rigidBody.current.linvel().y, z: 0}, true);
        } else if (distance > 5) {
            // Chase
            const speed = 3;
            rigidBody.current.setLinvel({
                x: direction.x * speed,
                y: rigidBody.current.linvel().y,
                z: direction.z * speed
            }, true);
        } else {
            // Stop and Shoot
            rigidBody.current.setLinvel({x: 0, y: rigidBody.current.linvel().y, z: 0}, true);
        }

        // Shooting
        const now = state.clock.getElapsedTime();
        if (distance < 20 && now - lastShot.current > 1.5) {
            // Raycast check for line of sight could be added here
            lastShot.current = now;
            // Damage player
            setPlayerHealth(h => Math.max(0, h - 10));
            
            // Visual Muzzle flash
            // (Simplified: Just play sound or flash usually, here we rely on HP drop feedback)
        }
    });

    if (hp <= 0) return null;

    return (
        <RigidBody 
            ref={rigidBody} 
            position={position} 
            colliders={false} 
            enabledRotations={[false, false, false]} 
            type="dynamic"
            linearDamping={1}
        >
            <CapsuleCollider args={[0.8, 0.6]} />
            <group ref={group}>
                {/* Detailed Enemy Model Construction */}
                
                {/* Body */}
                <mesh position={[0, 0, 0]} castShadow receiveShadow>
                    <cylinderGeometry args={[0.4, 0.4, 1.2]} />
                    <meshStandardMaterial color="#7f1d1d" /> {/* Dark Red Uniform */}
                </mesh>

                {/* Head */}
                <mesh position={[0, 0.8, 0]} castShadow>
                    <sphereGeometry args={[0.3]} />
                    <meshStandardMaterial color="#fca5a5" />
                </mesh>

                {/* Helmet */}
                <mesh position={[0, 0.9, 0]} castShadow>
                     <sphereGeometry args={[0.32, 32, 32, 0, Math.PI * 2, 0, Math.PI/2]} />
                     <meshStandardMaterial color="#1f2937" roughness={0.3} />
                </mesh>

                {/* Eyes/Goggles */}
                <mesh position={[0.1, 0.85, 0.25]} >
                     <boxGeometry args={[0.1, 0.05, 0.1]} />
                     <meshStandardMaterial color="black" />
                </mesh>
                <mesh position={[-0.1, 0.85, 0.25]} >
                     <boxGeometry args={[0.1, 0.05, 0.1]} />
                     <meshStandardMaterial color="black" />
                </mesh>

                {/* Arms holding gun */}
                <mesh position={[0.4, 0.2, 0.3]} rotation={[0, 0, -0.5]}>
                    <capsuleGeometry args={[0.1, 0.6]} />
                    <meshStandardMaterial color="#7f1d1d" />
                </mesh>
                 <mesh position={[-0.4, 0.2, 0.3]} rotation={[0, 0, 0.5]}>
                    <capsuleGeometry args={[0.1, 0.6]} />
                    <meshStandardMaterial color="#7f1d1d" />
                </mesh>

                {/* Gun */}
                <mesh position={[0, 0.1, 0.6]} rotation={[0, 0, 0]}>
                    <boxGeometry args={[0.1, 0.15, 0.8]} />
                    <meshStandardMaterial color="#333" />
                </mesh>

                {/* Health Bar */}
                <group position={[0, 1.4, 0]}>
                    <mesh>
                         <planeGeometry args={[1, 0.1]} />
                         <meshBasicMaterial color="red" side={THREE.DoubleSide} />
                    </mesh>
                    <mesh position={[0, 0, 0.01]} scale={[hp/100, 1, 1]} translateX={-0.5 * (1 - hp/100)}>
                         <planeGeometry args={[1, 0.1]} />
                         <meshBasicMaterial color="green" side={THREE.DoubleSide} />
                    </mesh>
                </group>
            </group>
        </RigidBody>
    );
};