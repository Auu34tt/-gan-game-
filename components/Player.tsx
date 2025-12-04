import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls, PointerLockControls, PerspectiveCamera } from '@react-three/drei';
import { RigidBody, CapsuleCollider, useRapier, RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { Controls } from '../App';
import { GameState, WEAPONS, WeaponStats } from '../types';
import { PLAYER_SPEED, PLAYER_RUN_SPEED, JUMP_FORCE } from '../constants';

interface PlayerProps {
    gameState: GameState;
    setHealth: (fn: (h: number) => number) => void;
    setAmmo: (a: number) => void;
    setMaxAmmo: (a: number) => void;
    setWeaponName: (n: string) => void;
    onDie: () => void;
}

export const Player = forwardRef<RapierRigidBody, PlayerProps>(({ 
    gameState, setHealth, setAmmo, setMaxAmmo, setWeaponName, onDie 
}, ref) => {
    const rigidBody = useRef<RapierRigidBody>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera>(null);
    const weaponRef = useRef<THREE.Group>(null);
    
    // Imperative handle to allow enemies to get player position easily if needed, 
    // though usually we use refs or state. Here exposing RB for easier distance checks in parent
    useImperativeHandle(ref, () => rigidBody.current!);

    const [sub, get] = useKeyboardControls<Controls>();
    const { raycaster, scene, camera } = useThree();
    const rapier = useRapier();

    // Weapon State
    const [currentWeaponKey, setCurrentWeaponKey] = useState<'RIFLE' | 'SNIPER'>('RIFLE');
    const [lastFired, setLastFired] = useState(0);
    const [isReloading, setIsReloading] = useState(false);
    const [aiming, setAiming] = useState(false);
    
    // Refs for mutable values in game loop
    const ammoRef = useRef(WEAPONS.RIFLE.magSize);
    
    // Helper to update UI
    const updateWeaponUI = () => {
        const stats = WEAPONS[currentWeaponKey];
        setAmmo(ammoRef.current);
        setMaxAmmo(stats.magSize);
        setWeaponName(stats.name);
    };

    useEffect(() => {
        updateWeaponUI();
    }, [currentWeaponKey]);

    // Handle weapon switching
    useEffect(() => {
        const unsub = sub(
            (state) => state.switch,
            (pressed) => {
                if (pressed && !isReloading) {
                    setCurrentWeaponKey(prev => prev === 'RIFLE' ? 'SNIPER' : 'RIFLE');
                    ammoRef.current = WEAPONS[currentWeaponKey === 'RIFLE' ? 'SNIPER' : 'RIFLE'].magSize;
                }
            }
        );
        return unsub;
    }, [isReloading, currentWeaponKey]);

    // Reloading Logic
    useEffect(() => {
         const unsub = sub(
            (state) => state.reload,
            (pressed) => {
                if(pressed && !isReloading && ammoRef.current < WEAPONS[currentWeaponKey].magSize) {
                    setIsReloading(true);
                    // UI could show reloading text here
                    setTimeout(() => {
                        ammoRef.current = WEAPONS[currentWeaponKey].magSize;
                        setIsReloading(false);
                        updateWeaponUI();
                    }, WEAPONS[currentWeaponKey].reloadTime);
                }
            }
        );
        return unsub;
    }, [isReloading, currentWeaponKey]);

    // Aim Logic (Right mouse button usually handled by events, but here we check state)
    useEffect(() => {
        const handleMouseDown = (e: MouseEvent) => {
            if(e.button === 2) setAiming(true);
            if(e.button === 0 && gameState === GameState.PLAYING) fireWeapon();
        };
        const handleMouseUp = (e: MouseEvent) => {
            if(e.button === 2) setAiming(false);
        };
        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [gameState, isReloading, currentWeaponKey, lastFired]);

    const fireWeapon = () => {
        if(isReloading || ammoRef.current <= 0) return;
        const now = Date.now();
        const stats = WEAPONS[currentWeaponKey];
        if(now - lastFired < stats.fireRate) return;

        setLastFired(now);
        ammoRef.current--;
        updateWeaponUI();

        // Recoil
        if(cameraRef.current) {
            cameraRef.current.rotation.x += 0.05;
        }

        // Raycast Shooting
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        // Intersect with enemies
        const intersects = raycaster.intersectObjects(scene.children, true);
        
        for(let hit of intersects) {
            // Check if object is an enemy
            // We'll use userData on the enemy mesh to identify it
            if(hit.object.userData && hit.object.userData.type === 'enemy') {
                hit.object.userData.hit(stats.damage);
                
                // Hit marker effect (visual only, simplified)
                const spark = new THREE.Mesh(new THREE.SphereGeometry(0.1), new THREE.MeshBasicMaterial({color: 'yellow'}));
                spark.position.copy(hit.point);
                scene.add(spark);
                setTimeout(() => scene.remove(spark), 200);
                break; // Hit one enemy
            }
            // Stop at walls
            if(hit.object.userData && hit.object.userData.type === 'wall') {
                 break;
            }
        }
    };

    useFrame((state, delta) => {
        if (!rigidBody.current || gameState !== GameState.PLAYING) return;

        // Camera Logic
        const cam = cameraRef.current;
        if(cam) {
            // Follow player physics body
            const pos = rigidBody.current.translation();
            cam.position.set(pos.x, pos.y + 1.6, pos.z);
            
            // ADS Zoom lerp
            const targetFOV = aiming ? WEAPONS[currentWeaponKey].zoomFOV : 75;
            cam.fov = THREE.MathUtils.lerp(cam.fov, targetFOV, 0.2);
            cam.updateProjectionMatrix();

            // Recoil recovery
            cam.rotation.x = THREE.MathUtils.lerp(cam.rotation.x, 0, 0.1);
        }

        // Weapon Sway & Bob
        if(weaponRef.current) {
             const time = state.clock.getElapsedTime();
             const isMoving = get().forward || get().backward || get().left || get().right;
             
             // ADS Position vs Hip Position
             const hipPos = new THREE.Vector3(0.4, -0.4, -0.6);
             const aimPos = new THREE.Vector3(0, -0.24, -0.4); // Centered for ADS
             const targetPos = aiming ? aimPos : hipPos;
             
             weaponRef.current.position.lerp(targetPos, 0.2);

             if(isMoving && !aiming) {
                 weaponRef.current.position.y += Math.sin(time * 10) * 0.002;
                 weaponRef.current.position.x += Math.cos(time * 10) * 0.002;
             }
        }


        // Movement Logic
        const { forward, backward, left, right, jump, sprint } = get();
        const velocity = rigidBody.current.linvel();
        
        // Calculate direction relative to camera
        const frontVector = new THREE.Vector3(0, 0, Number(backward) - Number(forward));
        const sideVector = new THREE.Vector3(Number(left) - Number(right), 0, 0);
        const direction = new THREE.Vector3();
        direction.subVectors(frontVector, sideVector).normalize().multiplyScalar(sprint ? PLAYER_RUN_SPEED : PLAYER_SPEED);
        
        // Apply camera rotation to movement
        const camEuler = new THREE.Euler(0, camera.rotation.y, 0);
        direction.applyEuler(camEuler);

        rigidBody.current.setLinvel({ x: direction.x, y: velocity.y, z: direction.z }, true);

        // Jump
        // Simple ground check via raycast down or checking velocity
        // For simplicity, we just allow jump if y velocity is near 0
        if (jump && Math.abs(velocity.y) < 0.1) {
            rigidBody.current.setLinvel({ x: velocity.x, y: JUMP_FORCE, z: velocity.z }, true);
        }

        // Check falling out of map
        const pos = rigidBody.current.translation();
        if(pos.y < -20) {
            onDie();
        }
    });

    return (
        <group>
            {/* Camera */}
            <PerspectiveCamera makeDefault ref={cameraRef} fov={75} near={0.1} far={1000}>
                 {/* Weapon Model attached to camera */}
                 <group ref={weaponRef} position={[0.4, -0.4, -0.6]}>
                     {/* Generic Gun Mesh Construction */}
                     <mesh castShadow receiveShadow>
                         <boxGeometry args={[0.1, 0.2, 0.6]} />
                         <meshStandardMaterial color={WEAPONS[currentWeaponKey].color} />
                     </mesh>
                     {/* Barrel */}
                     <mesh position={[0, 0.05, -0.4]} castShadow>
                         <cylinderGeometry args={[0.03, 0.03, 0.4]} />
                         <meshStandardMaterial color="#111" />
                         <meshBasicMaterial color="#000" />
                     </mesh>
                     {/* Scope */}
                     <mesh position={[0, 0.15, -0.1]} rotation={[Math.PI/2, 0, 0]}>
                         <cylinderGeometry args={[0.04, 0.05, 0.3]} />
                         <meshStandardMaterial color="#333" />
                     </mesh>
                 </group>
            </PerspectiveCamera>
            
            {gameState === GameState.PLAYING && <PointerLockControls selector="#root" />}

            {/* Physics Body */}
            <RigidBody 
                ref={rigidBody} 
                colliders={false} 
                mass={1} 
                type="dynamic" 
                position={[0, 5, 0]} 
                enabledRotations={[false, false, false]}
                friction={0}
            >
                <CapsuleCollider args={[0.75, 0.5]} />
            </RigidBody>
        </group>
    );
});