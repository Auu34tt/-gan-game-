import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CapsuleCollider, RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { playSound } from '../constants';

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
    const spawnTime = useRef(Date.now());

    // Attach hit handler to mesh userData
    useEffect(() => {
        if(group.current) {
            group.current.traverse((child) => {
                if(child instanceof THREE.Mesh) {
                    child.userData = {
                        type: 'enemy',
                        hit: (damage: number) => {
                            setHp(prev => prev - damage);
                            // Push back slightly on hit
                            if(rigidBody.current) {
                                rigidBody.current.applyImpulse({x:0, y: 1, z:0}, true);
                            }
                        }
                    };
                }
            });
        }
    }, []);

    useEffect(() => {
        if(hp <= 0) {
            playSound('hit');
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
        if(group.current) {
            group.current.lookAt(playerVec.x, myPos.y, playerVec.z);
        }

        // AI Logic
        // Grace period of 3 seconds after spawn
        if (Date.now() - spawnTime.current < 3000) {
            return;
        }

        if (distance > 40) {
             // Idle/Wander (Simple stand still for now to hold position)
             rigidBody.current.setLinvel({x: 0, y: rigidBody.current.linvel().y, z: 0}, true);
        } else if (distance > 10) {
            // Chase
            const speed = 3.5;
            rigidBody.current.setLinvel({
                x: direction.x * speed,
                y: rigidBody.current.linvel().y,
                z: direction.z * speed
            }, true);
        } else {
            // Strafe/Stop
            rigidBody.current.setLinvel({x: 0, y: rigidBody.current.linvel().y, z: 0}, true);
        }

        // Shooting with Accuracy Error
        const now = state.clock.getElapsedTime();
        // Fire rate depends on distance. Closer = faster.
        const fireRate = Math.max(1.0, distance / 10); 
        
        if (distance < 30 && now - lastShot.current > fireRate) {
            lastShot.current = now;
            
            // Accuracy Check: 70% chance to hit at close range, 30% at max range
            const accuracy = Math.max(0.2, 1 - (distance / 35));
            if (Math.random() < accuracy) {
                setPlayerHealth(h => Math.max(0, h - 8)); // Lower damage per shot
                playSound('shoot'); // Enemy shoot sound
            } else {
                // Miss sound or visual could go here
                playSound('shoot');
            }
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
            mass={2}
        >
            <CapsuleCollider args={[0.8, 0.6]} />
            <group ref={group}>
                {/* Detailed Soldier Model */}
                
                {/* Boots */}
                <mesh position={[-0.3, 0.1, 0]} castShadow>
                     <boxGeometry args={[0.25, 0.2, 0.4]} />
                     <meshStandardMaterial color="#1c1917" />
                </mesh>
                <mesh position={[0.3, 0.1, 0]} castShadow>
                     <boxGeometry args={[0.25, 0.2, 0.4]} />
                     <meshStandardMaterial color="#1c1917" />
                </mesh>

                {/* Pants */}
                <mesh position={[0, 0.7, 0]} castShadow>
                    <cylinderGeometry args={[0.35, 0.4, 1.0]} />
                    <meshStandardMaterial color="#44403c" /> {/* Camo Grey */}
                </mesh>

                {/* Torso/Vest */}
                <mesh position={[0, 1.4, 0]} castShadow>
                    <boxGeometry args={[0.7, 0.8, 0.4]} />
                    <meshStandardMaterial color="#1c1917" /> {/* Tactical Vest Black */}
                </mesh>
                <mesh position={[0, 1.4, 0.25]} castShadow>
                     <boxGeometry args={[0.5, 0.4, 0.1]} /> {/* Pouches */}
                     <meshStandardMaterial color="#57534e" />
                </mesh>

                {/* Head */}
                <mesh position={[0, 2.0, 0]} castShadow>
                    <sphereGeometry args={[0.25]} />
                    <meshStandardMaterial color="#fca5a5" />
                </mesh>

                {/* Helmet */}
                <mesh position={[0, 2.1, 0]} castShadow>
                     <sphereGeometry args={[0.27, 16, 16, 0, Math.PI * 2, 0, Math.PI/1.5]} />
                     <meshStandardMaterial color="#3f3f46" roughness={0.4} />
                </mesh>

                {/* Visor */}
                <mesh position={[0, 2.05, 0.2]} rotation={[0.2, 0, 0]}>
                     <boxGeometry args={[0.25, 0.1, 0.15]} />
                     <meshStandardMaterial color="#0ea5e9" metalness={0.8} roughness={0.2} />
                </mesh>

                {/* Arms */}
                <mesh position={[0.5, 1.5, 0]} rotation={[0, 0, -0.2]}>
                     <cylinderGeometry args={[0.08, 0.1, 0.7]} />
                     <meshStandardMaterial color="#44403c" />
                </mesh>
                <mesh position={[-0.5, 1.5, 0]} rotation={[0, 0, 0.2]}>
                     <cylinderGeometry args={[0.08, 0.1, 0.7]} />
                     <meshStandardMaterial color="#44403c" />
                </mesh>

                {/* Enemy Weapon */}
                <mesh position={[0.3, 1.3, 0.4]} rotation={[0, 0, 0]}>
                    <boxGeometry args={[0.08, 0.15, 0.7]} />
                    <meshStandardMaterial color="#000" />
                </mesh>

                {/* Health Bar UI in World Space */}
                <group position={[0, 2.6, 0]}>
                    <mesh>
                         <planeGeometry args={[1, 0.15]} />
                         <meshBasicMaterial color="#450a0a" side={THREE.DoubleSide} />
                    </mesh>
                    <mesh position={[0, 0, 0.01]} scale={[hp/100, 1, 1]} translateX={-0.5 * (1 - hp/100)}>
                         <planeGeometry args={[1, 0.12]} />
                         <meshBasicMaterial color="#ef4444" side={THREE.DoubleSide} />
                    </mesh>
                </group>
            </group>
        </RigidBody>
    );
};