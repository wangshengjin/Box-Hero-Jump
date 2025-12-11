import { LevelData } from './types';

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

export const COLORS = {
  background: 0xdcf2f9, // Light blue sky
  player: 0xff8800,     // Orange
  platform: 0x5d5dff,   // Blue bricks
  platformStroke: 0x3333aa,
  flagPole: 0x555555,
  flag: 0xff3333,
  text: 0x000000,
};

export const PHYSICS_OPTS = {
  gravity: 1.5,      // Adjusted for velocity-based physics
  friction: 0,       // Zero friction so we don't stick to walls when setting velocity manually
  frictionAir: 0.02, // Some air resistance
  restitution: 0.0,  // No bounciness
  jumpPower: 14,     // Velocity impulse (instant speed up)
  moveSpeed: 5,      // Constant horizontal velocity (pixels per frame)
};

// Define 3 Levels
export const LEVELS: LevelData[] = [
  {
    id: 1,
    startPos: { x: 100, y: 500 },
    goalPos: { x: 700, y: 400 },
    maxJumps3Stars: 3,
    maxJumps2Stars: 5,
    platforms: [
      { x: 100, y: 550, width: 200, height: 40 }, // Start floor
      { x: 400, y: 500, width: 100, height: 40 }, // Mid step
      { x: 700, y: 450, width: 150, height: 40 }, // Goal platform
    ],
  },
  {
    id: 2,
    startPos: { x: 100, y: 500 },
    goalPos: { x: 700, y: 150 },
    maxJumps3Stars: 6,
    maxJumps2Stars: 9,
    platforms: [
      { x: 100, y: 550, width: 150, height: 40 }, // Base
      { x: 300, y: 450, width: 40, height: 200 }, // Vertical wall
      { x: 300, y: 350, width: 100, height: 40 }, // L-shape top
      { x: 500, y: 250, width: 100, height: 40 },
      { x: 700, y: 200, width: 120, height: 40 }, // Goal
    ],
  },
  {
    id: 3,
    startPos: { x: 80, y: 100 },
    goalPos: { x: 700, y: 500 },
    maxJumps3Stars: 8,
    maxJumps2Stars: 12,
    platforms: [
      { x: 80, y: 150, width: 120, height: 40 }, // Start top left
      { x: 300, y: 250, width: 40, height: 150 }, // Obstacle
      { x: 250, y: 330, width: 100, height: 40 }, // Step
      { x: 500, y: 400, width: 120, height: 40 }, 
      { x: 650, y: 250, width: 80, height: 40 }, // High floating
      { x: 700, y: 550, width: 150, height: 40 }, // Goal floor bottom right
    ],
  }
];