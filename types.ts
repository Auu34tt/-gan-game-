import * as THREE from 'three';

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}

export interface WeaponStats {
  name: string;
  damage: number;
  fireRate: number; // ms between shots
  magSize: number;
  reloadTime: number; // ms
  spread: number;
  zoomFOV: number;
  color: string;
}

export const WEAPONS: Record<string, WeaponStats> = {
  RIFLE: {
    name: 'کلاشینکف',
    damage: 25,
    fireRate: 100,
    magSize: 30,
    reloadTime: 2000,
    spread: 0.05,
    zoomFOV: 50,
    color: '#4ade80'
  },
  SNIPER: {
    name: 'اسنایپر',
    damage: 100,
    fireRate: 1000,
    magSize: 5,
    reloadTime: 3000,
    spread: 0.001,
    zoomFOV: 20,
    color: '#fbbf24'
  }
};

export interface BulletData {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  damage: number;
  owner: 'player' | 'enemy';
}

export interface EnemyData {
  id: string;
  position: THREE.Vector3;
  hp: number;
}