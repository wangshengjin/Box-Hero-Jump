export interface Vector2 {
  x: number;
  y: number;
}

export interface PlatformData {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

export interface LevelData {
  id: number;
  startPos: Vector2;
  goalPos: Vector2;
  platforms: PlatformData[];
  maxJumps3Stars: number;
  maxJumps2Stars: number;
}

export interface PlayerProgress {
  [levelId: number]: {
    unlocked: boolean;
    stars: number; // 0, 1, 2, 3
  };
}

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  WON = 'WON',
  GAME_OVER = 'GAME_OVER'
}