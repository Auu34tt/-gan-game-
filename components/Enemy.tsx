
import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CapsuleCollider, RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { playSound, ENEMY_PHRASES, ENEMY_DEATH_PHRASES, speakFarsi } from '../constants';

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
    
    // Unstuck logic
    const lastPos = useRef(new THREE.Vector3());
    const stuckCounter = useRef(0);

    // Animation refs
    const bodyRef = useRef<THREE.Group>(null);
    const legLRef = useRef<THREE.Mesh>(null);
    const legRRef = useRef<THREE.Mesh>(null);

    // Initial Shout
    useEffect(() => {
        setTimeout(() => {
             const phrase = ENEMY_PHRASES[Math.floor(Math.random() * ENEMY_PHRASES.length)];
             speakFarsi(phrase);
        }, 500 + Math.random() * 2000);
    }, []);

    // Attach hit handler to mesh userData
    useEffect(() => {
        if(group.current) {
            group.current.userData = {
                hit: (damage: number) => {
                    setHp(prev => prev - damage);
                    if(rigidBody.current) {
                        // Knockback
                        rigidBody.current.applyImpulse({x:0, y: 3, z:0}, true);
                    }
                    if (Math.random() > 0.7) speakFarsi("آخ!");
                }
            };
            group.current.traverse((child) => {
                 child.userData = group.current!.userData;
            });
        }
    }, []);

    useEffect(() => {
        if(hp <= 0) {
            playSound('hit');
            const phrase = ENEMY_DEATH_PHRASES[Math.floor(Math.random() * ENEMY_DEATH_PHRASES.length)];
            speakFarsi(phrase);
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

        // 1. Look at player
        if(group.current) {
            group.current.lookAt(playerVec.x, myPos.y, playerVec.z);
        }

        // 2. AI LOGIC
        if (Date.now() - spawnTime.current < 2000) {
            return;
        }

        let speed = 0;

        // Enemy chases if far
        if (distance > 10) {
            speed = 4.5; 
            
            // Check if stuck
            if(state.clock.getElapsedTime() % 0.5 < 0.05) {
                const distMoved = enemyVec.distanceTo(lastPos.current);
                if(distMoved < 0.2) {
                    stuckCounter.current++;
                } else {
                    stuckCounter.current = 0;
                }
                lastPos.current.copy(enemyVec);
            }
            
            // Jump if stuck
            if(stuckCounter.current > 2) {
                 rigidBody.current.setLinvel({x: direction.x * 2, y: 6, z: direction.z * 2}, true);
                 stuckCounter.current = 0;
            } else {
                 rigidBody.current.setLinvel({
                    x: direction.x * speed,
                    y: rigidBody.current.linvel().y,
                    z: direction.z * speed
                }, true);
            }
        } else {
            // Stop to shoot
            rigidBody.current.setLinvel({x: 0, y: rigidBody.current.linvel().y, z: 0}, true);
        }

        // 3. Animation
        if(speed > 0) {
            const t = state.clock.getElapsedTime() * 10;
            if(legLRef.current && legRRef.current) {
                legLRef.current.rotation.x = Math.sin(t) * 0.7;
                legRRef.current.rotation.x = Math.cos(t) * 0.7;
            }
        }

        // 4. Shooting (NERFED)
        const now = state.clock.getElapsedTime();
        // Fire rate is slower now
        const fireRate = Math.max(1.5, distance / 10); 
        
        if (distance < 35 && now - lastShot.current > fireRate) {
            lastShot.current = now;
            
            // Accuracy nerfed heavily
            const accuracy = Math.max(0.05, 0.4 - (distance / 30));
            
            if (Math.random() < accuracy) {
                // Damage Nerfed: 5 -> 3
                setPlayerHealth(h => Math.max(0, h - 3));
                playSound('shoot'); 
                
                if(bodyRef.current) {
                    const flash = new THREE.PointLight(0xffaa00, 1, 3);
                    flash.position.set(0.2, 1.4, 0.8);
                    bodyRef.current.add(flash);
                    setTimeout(() => bodyRef.current?.remove(flash), 50);
                }
            } else {
                playSound('shoot');
                // Visual feedback of missing shot? 
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
            linearDamping={0.5}
            mass={3}
            friction={0.2}
        >
            <CapsuleCollider args={[0.9, 0.6]} position={[0, 0.9, 0]} />
            <group ref={group}>
                <group ref={bodyRef}>
                    <mesh ref={legLRef} position={[-0.2, 0.4, 0]}>
                         <boxGeometry args={[0.25, 0.9, 0.25]} />
                         <meshStandardMaterial color="#4b5563" />
                    </mesh>
                    <mesh ref={legRRef} position={[0.2, 0.4, 0]}>
                         <boxGeometry args={[0.25, 0.9, 0.25]} />
                         <meshStandardMaterial color="#4b5563" />
                    </mesh>

                    {/* Torso */}
                    <mesh position={[0, 1.3, 0]}>
                        <boxGeometry args={[0.7, 0.9, 0.4]} />
                        <meshStandardMaterial color="#374151" /> 
                    </mesh>
                    
                    {/* Head */}
                    <mesh position={[0, 2.0, 0]}>
                        <sphereGeometry args={[0.25]} />
                        <meshStandardMaterial color="#fca5a5" />
                    </mesh>

                    {/* Helmet (Lighter) */}
                    <mesh position={[0, 2.1, 0]}>
                         <sphereGeometry args={[0.28, 16, 16, 0, Math.PI * 2, 0, Math.PI/1.5]} />
                         <meshStandardMaterial color="#1f2937" roughness={0.4} />
                    </mesh>
                    
                    {/* Goggles */}
                    <mesh position={[0, 2.05, 0.23]}>
                         <boxGeometry args={[0.3, 0.1, 0.1]} />
                         <meshStandardMaterial color="#ef4444" emissive="#b91c1c" emissiveIntensity={0.5} />
                    </mesh>

                    {/* Arms */}
                    <mesh position={[0.45, 1.4, 0.2]} rotation={[0, 0, -0.4]}>
                         <boxGeometry args={[0.15, 0.8, 0.15]} />
                         <meshStandardMaterial color="#4b5563" />
                    </mesh>
                    <mesh position={[-0.45, 1.4, 0.2]} rotation={[0, 0, 0.4]}>
                         <boxGeometry args={[0.15, 0.8, 0.15]} />
                         <meshStandardMaterial color="#4b5563" />
                    </mesh>

                    {/* Gun */}
                    <mesh position={[0.2, 1.2, 0.6]} rotation={[0, 0, 0]}>
                        <boxGeometry args={[0.08, 0.15, 0.7]} />
                        <meshStandardMaterial color="#111" />
                    </mesh>

                    {/* HP Bar */}
                    <group position={[0, 2.6, 0]}>
                        <mesh>
                             <planeGeometry args={[1, 0.15]} />
                             <meshBasicMaterial color="#000" />
                        </mesh>
                        <mesh position={[0, 0, 0.01]} scale={[hp/100, 1, 1]} translateX={-0.5 * (1 - hp/100)}>
                             <planeGeometry args={[0.98, 0.13]} />
                             <meshBasicMaterial color={hp > 50 ? "#22c55e" : "#ef4444"} />
                        </mesh>
                    </group>
                </group>
            </group>
        </RigidBody>
    );
};
