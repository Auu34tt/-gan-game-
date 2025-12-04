import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls, PointerLockControls, PerspectiveCamera } from '@react-three/drei';
import { RigidBody, CapsuleCollider, useRapier, RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { Controls } from '../App';
import { GameState, WEAPONS } from '../types';
import { PLAYER_SPEED, PLAYER_RUN_SPEED, JUMP_FORCE, playSound } from '../constants';

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
    const muzzleLightRef = useRef<THREE.PointLight>(null);
    
    useImperativeHandle(ref, () => rigidBody.current!);

    const [sub, get] = useKeyboardControls<Controls>();
    const { raycaster, scene, camera } = useThree();
    
    // Weapon State
    const [currentWeaponKey, setCurrentWeaponKey] = useState<'RIFLE' | 'SNIPER'>('RIFLE');
    const [lastFired, setLastFired] = useState(0);
    const [isReloading, setIsReloading] = useState(false);
    const [aiming, setAiming] = useState(false);
    
    // Refs
    const ammoRef = useRef(WEAPONS.RIFLE.magSize);
    const recoilIntensity = useRef(0);
    
    const updateWeaponUI = () => {
        const stats = WEAPONS[currentWeaponKey];
        setAmmo(ammoRef.current);
        setMaxAmmo(stats.magSize);
        setWeaponName(stats.name);
    };

    useEffect(() => { updateWeaponUI(); }, [currentWeaponKey]);

    // Weapon Switch
    useEffect(() => {
        const unsub = sub((state) => state.switch, (pressed) => {
            if (pressed && !isReloading) {
                setCurrentWeaponKey(prev => prev === 'RIFLE' ? 'SNIPER' : 'RIFLE');
                playSound('reload');
                // Short delay to simulate switch
                setTimeout(() => {
                    ammoRef.current = WEAPONS[currentWeaponKey === 'RIFLE' ? 'SNIPER' : 'RIFLE'].magSize;
                    updateWeaponUI();
                }, 500);
            }
        });
        return unsub;
    }, [isReloading, currentWeaponKey]);

    // Reload
    useEffect(() => {
         const unsub = sub((state) => state.reload, (pressed) => {
                if(pressed && !isReloading && ammoRef.current < WEAPONS[currentWeaponKey].magSize) {
                    setIsReloading(true);
                    playSound('reload');
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

    // Input Listeners
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
        if(isReloading || ammoRef.current <= 0) {
            if(ammoRef.current <= 0 && !isReloading) playSound('reload'); // dry fire sound substitute
            return;
        }
        
        const now = Date.now();
        const stats = WEAPONS[currentWeaponKey];
        if(now - lastFired < stats.fireRate) return;

        setLastFired(now);
        ammoRef.current--;
        updateWeaponUI();
        playSound('shoot');

        // Visual Effects
        recoilIntensity.current = 0.1;
        if(muzzleLightRef.current) {
            muzzleLightRef.current.intensity = 2;
            setTimeout(() => { if(muzzleLightRef.current) muzzleLightRef.current.intensity = 0; }, 50);
        }

        // Raycast
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        const intersects = raycaster.intersectObjects(scene.children, true);
        
        for(let hit of intersects) {
            if(hit.object.userData && hit.object.userData.type === 'enemy') {
                hit.object.userData.hit(stats.damage);
                playSound('hit');
                // Hit Spark
                const spark = new THREE.Mesh(new THREE.SphereGeometry(0.05), new THREE.MeshBasicMaterial({color: 'orange'}));
                spark.position.copy(hit.point);
                scene.add(spark);
                setTimeout(() => scene.remove(spark), 100);
                break;
            }
            if(hit.object.userData && hit.object.userData.type === 'wall') break;
            // Also stop at world geometry
            if (hit.distance > 0 && hit.object.type === 'Mesh') {
                 // Basic hit check to not shoot through walls if not explicitly tagged
                 if(hit.object.parent?.type !== 'Group') break; 
            }
        }
    };

    useFrame((state, delta) => {
        if (!rigidBody.current || gameState !== GameState.PLAYING) return;

        const pos = rigidBody.current.translation();

        const cam = cameraRef.current;
        if(cam) {
            cam.position.set(pos.x, pos.y + 1.6, pos.z);
            
            // Aiming Zoom
            const targetFOV = aiming ? WEAPONS[currentWeaponKey].zoomFOV : 75;
            cam.fov = THREE.MathUtils.lerp(cam.fov, targetFOV, 10 * delta);
            cam.updateProjectionMatrix();

            // Recoil Recovery
            cam.rotation.x += recoilIntensity.current;
            recoilIntensity.current = THREE.MathUtils.lerp(recoilIntensity.current, 0, 10 * delta);
            
            // Limit vertical look to prevent flipping
            // (Note: PointerLockControls usually handles this, but recoil adds offset. 
            // We trust PLC for main look, just add subtle shake)
        }

        // Weapon Sway and Positioning
        if(weaponRef.current) {
             const time = state.clock.getElapsedTime();
             const isMoving = get().forward || get().backward || get().left || get().right;
             
             // Hip vs Aim Positions
             // Align sights perfectly to center screen (0,0) relative to cam
             const hipPos = new THREE.Vector3(0.4, -0.4, -0.6);
             const aimPos = currentWeaponKey === 'RIFLE' 
                ? new THREE.Vector3(0, -0.235, -0.4) // AK Alignment
                : new THREE.Vector3(0, -0.18, -0.3); // Sniper Alignment
             
             const targetPos = aiming ? aimPos : hipPos;
             
             weaponRef.current.position.lerp(targetPos, 15 * delta);

             // Bobbing
             if(isMoving && !aiming) {
                 weaponRef.current.position.y += Math.sin(time * 12) * 0.005;
                 weaponRef.current.position.x += Math.cos(time * 12) * 0.005;
             }
             
             // Recoil kickback
             weaponRef.current.position.z += recoilIntensity.current * 2;
        }

        // Movement
        const { forward, backward, left, right, jump, sprint } = get();
        const velocity = rigidBody.current.linvel();
        
        const frontVector = new THREE.Vector3(0, 0, Number(backward) - Number(forward));
        const sideVector = new THREE.Vector3(Number(left) - Number(right), 0, 0);
        const direction = new THREE.Vector3();
        direction.subVectors(frontVector, sideVector).normalize().multiplyScalar(sprint ? PLAYER_RUN_SPEED : PLAYER_SPEED);
        
        const camEuler = new THREE.Euler(0, camera.rotation.y, 0);
        direction.applyEuler(camEuler);

        rigidBody.current.setLinvel({ x: direction.x, y: velocity.y, z: direction.z }, true);

        if (jump && Math.abs(velocity.y) < 0.1) {
            rigidBody.current.setLinvel({ x: velocity.x, y: JUMP_FORCE, z: velocity.z }, true);
        }

        if(pos.y < -20) onDie();
    });

    return (
        <group>
            <PerspectiveCamera makeDefault ref={cameraRef} fov={75} near={0.1} far={1000}>
                 <group ref={weaponRef} position={[0.4, -0.4, -0.6]}>
                     {/* HIGH QUALITY GUN MODEL */}
                     {/* Main Body */}
                     <mesh castShadow receiveShadow position={[0, 0, 0.1]}>
                         <boxGeometry args={[0.08, 0.12, 0.6]} />
                         <meshStandardMaterial color="#27272a" roughness={0.3} metalness={0.8} />
                     </mesh>
                     {/* Handle */}
                     <mesh position={[0, -0.15, 0.2]} rotation={[0.2, 0, 0]}>
                         <boxGeometry args={[0.07, 0.15, 0.1]} />
                         <meshStandardMaterial color="#78350f" />
                     </mesh>
                     {/* Magazine */}
                     <mesh position={[0, -0.15, -0.1]} rotation={[0.1, 0, 0]}>
                         <boxGeometry args={[0.06, 0.25, 0.12]} />
                         <meshStandardMaterial color="#18181b" />
                     </mesh>
                     {/* Barrel */}
                     <mesh position={[0, 0.04, -0.5]} castShadow>
                         <cylinderGeometry args={[0.02, 0.02, 0.6]} />
                         <meshStandardMaterial color="#18181b" metalness={0.9} />
                     </mesh>
                     {/* Wooden Handguard */}
                     <mesh position={[0, -0.02, -0.3]}>
                         <boxGeometry args={[0.07, 0.06, 0.4]} />
                         <meshStandardMaterial color="#78350f" />
                     </mesh>
                     {/* Iron Sights (Rear) */}
                     <mesh position={[0, 0.08, 0.3]}>
                         <boxGeometry args={[0.02, 0.04, 0.02]} />
                         <meshStandardMaterial color="#000" />
                     </mesh>
                     {/* Iron Sights (Front) */}
                     <mesh position={[0, 0.07, -0.75]}>
                         <boxGeometry args={[0.01, 0.04, 0.01]} />
                         <meshStandardMaterial color="#000" />
                     </mesh>

                     {/* Muzzle Flash Light */}
                     <pointLight ref={muzzleLightRef} color="#fbbf24" distance={5} intensity={0} position={[0, 0.1, -0.8]} />
                 </group>
            </PerspectiveCamera>
            
            {gameState === GameState.PLAYING && <PointerLockControls selector="#root" />}

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