
import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls, PointerLockControls } from '@react-three/drei';
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
    const cameraPivotRef = useRef<THREE.Group>(null);
    const playerMeshRef = useRef<THREE.Group>(null);
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
    
    // Refs for non-render state
    const ammoRef = useRef(WEAPONS.RIFLE.magSize);
    const recoilImpulse = useRef(0);
    
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
                    
                    if(weaponRef.current) {
                        weaponRef.current.rotation.x = -0.5;
                    }

                    setTimeout(() => {
                        ammoRef.current = WEAPONS[currentWeaponKey].magSize;
                        setIsReloading(false);
                        updateWeaponUI();
                        if(weaponRef.current) {
                             weaponRef.current.rotation.x = 0;
                        }
                    }, WEAPONS[currentWeaponKey].reloadTime);
                }
            }
        );
        return unsub;
    }, [isReloading, currentWeaponKey]);

    // Input Listeners
    useEffect(() => {
        const handleMouseDown = (e: MouseEvent) => {
            if(gameState !== GameState.PLAYING) return;
            if(e.button === 2) setAiming(true);
            if(e.button === 0) fireWeapon();
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
    }, [gameState, isReloading, currentWeaponKey, lastFired, aiming]);

    const fireWeapon = () => {
        if(isReloading || ammoRef.current <= 0) {
            if(ammoRef.current <= 0 && !isReloading) playSound('reload');
            return;
        }
        
        const now = Date.now();
        const stats = WEAPONS[currentWeaponKey];
        if(now - lastFired < stats.fireRate) return;

        setLastFired(now);
        ammoRef.current--;
        updateWeaponUI();
        playSound('shoot');

        // Smaller Recoil for TPS
        recoilImpulse.current += aiming ? 0.005 : 0.02;

        // Visual Effects
        if(muzzleLightRef.current) {
            muzzleLightRef.current.intensity = 5;
            setTimeout(() => { if(muzzleLightRef.current) muzzleLightRef.current.intensity = 0; }, 40);
        }

        // Raycast logic - From Center of Screen (Camera)
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        const intersects = raycaster.intersectObjects(scene.children, true);
        
        // Filter out player's own mesh
        const validIntersects = intersects.filter(hit => {
             let obj = hit.object;
             while(obj.parent) {
                 if(obj.name === "PLAYER_MODEL") return false;
                 obj = obj.parent;
             }
             return true;
        });
        
        if(validIntersects.length > 0) {
            const hit = validIntersects[0];
            let obj = hit.object;
            while(obj.parent && !obj.userData.hit) {
                obj = obj.parent;
            }

            if(obj.userData && obj.userData.hit) {
                obj.userData.hit(stats.damage);
                playSound('hit');
                const spark = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.15), new THREE.MeshBasicMaterial({color: '#ef4444'}));
                spark.position.copy(hit.point);
                scene.add(spark);
                setTimeout(() => scene.remove(spark), 200);
            } else if (hit.distance > 0 && hit.object.type === 'Mesh') {
                 const wallSpark = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), new THREE.MeshBasicMaterial({color: '#fbbf24'}));
                 wallSpark.position.copy(hit.point);
                 scene.add(wallSpark);
                 setTimeout(() => scene.remove(wallSpark), 100);
            }
        }
    };

    useFrame((state, delta) => {
        if (!rigidBody.current || gameState !== GameState.PLAYING) return;

        // --- 1. MOVEMENT PHYSICS ---
        const { forward, backward, left, right, jump, sprint } = get();
        const vel = rigidBody.current.linvel();
        const pos = rigidBody.current.translation();

        // Calculate direction relative to Camera Y-rotation
        const camEuler = new THREE.Euler(0, camera.rotation.y, 0);
        const frontVector = new THREE.Vector3(0, 0, Number(backward) - Number(forward));
        const sideVector = new THREE.Vector3(Number(left) - Number(right), 0, 0);
        const direction = new THREE.Vector3();
        direction.subVectors(frontVector, sideVector).normalize();
        
        const speed = sprint ? PLAYER_RUN_SPEED : PLAYER_SPEED;
        direction.multiplyScalar(speed);
        direction.applyEuler(camEuler);

        // Apply Velocity
        rigidBody.current.setLinvel({ x: direction.x, y: vel.y, z: direction.z }, true);

        // Jump
        if (jump && Math.abs(vel.y) < 0.1) {
            rigidBody.current.setLinvel({ x: vel.x, y: JUMP_FORCE, z: vel.z }, true);
        }

        // Death Plane
        if(pos.y < -30) onDie();

        // --- 2. TPS CAMERA LOGIC ---
        // Camera Pivot tracks Player Position
        if(cameraPivotRef.current) {
            cameraPivotRef.current.position.set(pos.x, pos.y, pos.z);
            
            // Recoil Recovery
            cameraPivotRef.current.rotation.x += recoilImpulse.current;
            recoilImpulse.current = 0;
            
            // Camera Pivot Y rotation is controlled by PointerLock (Mouse X)
            // Camera Pivot X rotation is controlled by PointerLock (Mouse Y)
            // But PointerLockControls handles camera directly. 
            // We need to attach the camera to a boom.
            
            // HACK: Read camera rotation set by PointerLockControls and apply to Player Mesh logic
            // We actually want the camera to be BEHIND the player.
            
            // Setup Camera Offset
            // Normal: Behind and Up
            // Aiming: Over Shoulder, Closer
            const normalOffset = new THREE.Vector3(0, 1.5, 4);
            const aimOffset = new THREE.Vector3(0.8, 1.6, 1.5);
            
            const targetOffset = aiming ? aimOffset : normalOffset;
            
            // Lerp Camera Position Local to Rotation
            // We need to manually calculate where the camera should be based on rotation
        }
        
        // PLAYER MODEL ROTATION
        // The mesh should rotate to face the camera's forward direction (Yaw only)
        if(playerMeshRef.current) {
            playerMeshRef.current.rotation.y = camera.rotation.y + Math.PI; // Face forward
        }
        
        // TPS Camera Positioning (Manual override of what PointerLock usually does)
        // We let PointerLock control the rotation of the camera object, 
        // but we force the position to be offset from the player.
        
        const offset = aiming ? new THREE.Vector3(0.6, 0, 1.5) : new THREE.Vector3(0, 0.5, 3.5);
        offset.applyQuaternion(camera.quaternion);
        
        camera.position.lerp(new THREE.Vector3(pos.x, pos.y + 1.5, pos.z).add(offset), 0.2);

        // --- 3. ANIMATION ---
        if(playerMeshRef.current) {
            const isMoving = forward || backward || left || right;
            const t = state.clock.getElapsedTime() * 15;
            
            // Leg swing
            const legL = playerMeshRef.current.getObjectByName("LegL");
            const legR = playerMeshRef.current.getObjectByName("LegR");
            const armL = playerMeshRef.current.getObjectByName("ArmL");
            const armR = playerMeshRef.current.getObjectByName("ArmR");
            
            if(isMoving && legL && legR && armL && armR) {
                legL.rotation.x = Math.sin(t) * 0.5;
                legR.rotation.x = Math.cos(t) * 0.5;
                armL.rotation.x = Math.cos(t) * 0.5;
                armR.rotation.x = Math.sin(t) * 0.5 - (aiming ? 1.5 : 0.5); // Hold gun up if aiming
            } else if (legL && legR && armL && armR) {
                 legL.rotation.x = 0;
                 legR.rotation.x = 0;
                 armL.rotation.x = 0;
                 armR.rotation.x = aiming ? -1.5 : -0.5;
            }
        }
    });

    return (
        <group>
            {gameState === GameState.PLAYING && <PointerLockControls selector="#root" />}

            {/* PLAYER PHYSICS BODY */}
            {/* Height 2 units. Radius 0.5. */}
            <RigidBody 
                ref={rigidBody} 
                colliders={false} 
                mass={1} 
                type="dynamic" 
                position={[0, 10, 0]} 
                enabledRotations={[false, false, false]}
                friction={0} 
                restitution={0}
                canSleep={false}
            >
                <CapsuleCollider args={[1, 0.5]} position={[0, 1, 0]} /> {/* Height (half-height), Radius. Offset up so feet are at 0 */}
            </RigidBody>

            {/* VISUAL MODEL - Interpolated position handled in useFrame via ref */}
            <group ref={playerMeshRef} name="PLAYER_MODEL">
                 {/* Soldier Body */}
                 <group position={[0, 1, 0]}>
                    {/* Torso */}
                    <mesh position={[0, 0.3, 0]} castShadow>
                        <boxGeometry args={[0.5, 0.6, 0.3]} />
                        <meshStandardMaterial color="#1e3a8a" /> {/* Blue uniform */}
                    </mesh>
                    {/* Head */}
                    <mesh position={[0, 0.75, 0]} castShadow>
                        <boxGeometry args={[0.25, 0.3, 0.25]} />
                        <meshStandardMaterial color="#fca5a5" />
                    </mesh>
                    {/* Helmet */}
                    <mesh position={[0, 0.85, 0]} castShadow>
                         <sphereGeometry args={[0.26, 16, 16, 0, Math.PI*2, 0, Math.PI/2]} />
                         <meshStandardMaterial color="#172554" roughness={0.4} />
                    </mesh>
                    {/* Backpack */}
                    <mesh position={[0, 0.3, 0.2]} castShadow>
                        <boxGeometry args={[0.4, 0.5, 0.2]} />
                        <meshStandardMaterial color="#0f172a" />
                    </mesh>
                    
                    {/* Legs */}
                    <group name="LegL" position={[-0.15, 0, 0]}>
                         <mesh position={[0, -0.4, 0]} castShadow>
                             <boxGeometry args={[0.15, 0.8, 0.15]} />
                             <meshStandardMaterial color="#1e3a8a" />
                         </mesh>
                    </group>
                    <group name="LegR" position={[0.15, 0, 0]}>
                         <mesh position={[0, -0.4, 0]} castShadow>
                             <boxGeometry args={[0.15, 0.8, 0.15]} />
                             <meshStandardMaterial color="#1e3a8a" />
                         </mesh>
                    </group>

                    {/* Arms */}
                    <group name="ArmL" position={[-0.35, 0.5, 0]}>
                         <mesh position={[0, -0.3, 0]} castShadow>
                             <boxGeometry args={[0.12, 0.7, 0.12]} />
                             <meshStandardMaterial color="#1e3a8a" />
                         </mesh>
                    </group>
                    
                    {/* Right Arm + Weapon */}
                    <group name="ArmR" position={[0.35, 0.5, 0]} rotation={[-0.5, 0, 0]}>
                         <mesh position={[0, -0.3, 0]} castShadow>
                             <boxGeometry args={[0.12, 0.7, 0.12]} />
                             <meshStandardMaterial color="#1e3a8a" />
                         </mesh>
                         
                         {/* ATTACHED WEAPON */}
                         <group ref={weaponRef} position={[0, -0.6, 0.3]} rotation={[1.5, 0, 0]} scale={[0.8, 0.8, 0.8]}>
                            {/* AK Model Reuse */}
                            <mesh position={[0, 0.05, 0]}> <boxGeometry args={[0.06, 0.08, 0.4]} /> <meshStandardMaterial color="#333" /> </mesh>
                            <mesh position={[0, 0, 0.35]} rotation={[0.2, 0, 0]}> <boxGeometry args={[0.05, 0.12, 0.3]} /> <meshStandardMaterial color="#5D4037" /> </mesh>
                            <mesh position={[0, 0.06, -0.5]} rotation={[Math.PI/2, 0, 0]}> <cylinderGeometry args={[0.015, 0.015, 0.5]} /> <meshStandardMaterial color="#111" /> </mesh>
                            <mesh position={[0, -0.15, -0.1]} rotation={[0.4, 0, 0]}> <boxGeometry args={[0.05, 0.25, 0.09]} /> <meshStandardMaterial color="#e65100" /> </mesh>
                            <pointLight ref={muzzleLightRef} color="#fbbf24" distance={5} intensity={0} position={[0, 0.1, -0.8]} />
                         </group>
                    </group>
                 </group>
            </group>
        </group>
    );
});
