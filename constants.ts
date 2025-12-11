import { LevelData, PlatformData, Vector2 } from './types';

// Mobile Portrait Resolution
export const GAME_WIDTH = 750;
export const GAME_HEIGHT = 1334;

export const COLORS = {
  background: 0xdcf2f9, // Light blue sky
  player: 0xff8800,     // Orange
  platform: 0x5d5dff,   // Blue bricks
  platformStroke: 0x3333aa,
  flagPole: 0x555555,
  flag: 0xff3333,
  text: 0x000000,
  aimLine: 0xFFFFFF,    // White aiming line
};

// Physics adjusted for Slingshot/Impulse mechanics
// TUNING: Made the game slower and floatier based on feedback
export const PHYSICS_OPTS = {
  gravity: 1.5,        // Gravity slightly up to compensate for lower force (less floaty at peak)
  friction: 0.8,       // High friction so player stops quickly on platforms
  frictionAir: 0.04,   // Air resistance
  restitution: 0.1,    // Less bounce
  jumpForceMultiplier: 0.018, // Significantly reduced sensitivity (was 0.025)
  maxJumpForce: 0.28,   // Reduced max speed limit (was 0.35)
};

// Helper to generate 30 Vertical Climbing Levels
const generateLevels = (): LevelData[] => {
  const levels: LevelData[] = [];
  const TOTAL_LEVELS = 30;

  for (let id = 1; id <= TOTAL_LEVELS; id++) {
    const platforms: PlatformData[] = [];
    
    // Vertical Coordinate System: 
    // Y gets smaller as we go UP.
    // Start at bottom (e.g., 0 relative to bottom of level), Goal at top.
    
    // Define the "height" of the level based on difficulty
    const levelHeight = 1500 + (id * 200); // Levels get taller
    const groundY = levelHeight; // The bottom of the world
    
    const startPos: Vector2 = { x: GAME_WIDTH / 2, y: groundY - 100 };
    const goalPos: Vector2 = { x: GAME_WIDTH / 2, y: 150 }; // Goal is always near top (y=150)

    // Base Platform
    platforms.push({ x: GAME_WIDTH / 2, y: groundY, width: GAME_WIDTH, height: 60 });
    
    // Generate Platforms between Start and Goal
    // Playable area Y: from (groundY - 150) to 250
    let currentY = groundY - 250;
    const endY = 250;
    
    // Difficulty Factors - PROGRESSIVE
    // Reduced gaps to match the weaker jump force
    const baseGap = 100 + Math.min(50, id * 2); 
    const gapVariation = 20 + Math.min(30, id);
    
    const gapMin = baseGap;
    const gapMax = baseGap + gapVariation;
    
    const platformW = Math.max(80, 220 - (id * 5)); // Width decreases
    
    // Start generating from center
    let lastX = GAME_WIDTH / 2;

    while (currentY > endY) {
      const isLeft = Math.random() > 0.5;
      
      let nextX;

      if (id <= 3) {
        // Phase 1 (Tutorial-ish): Very predictable zig zag
        const shift = 80 + Math.random() * 80;
        nextX = lastX + (isLeft ? -shift : shift);
      } else if (id <= 10) {
         // Phase 2: Standard
         const shift = 130 + Math.random() * 120;
         nextX = lastX + (isLeft ? -shift : shift);
      } else {
         // Phase 3: Chaos
         if (lastX < GAME_WIDTH / 2) {
             nextX = GAME_WIDTH / 2 + 50 + Math.random() * 300; 
         } else {
             nextX = GAME_WIDTH / 2 - 50 - Math.random() * 300;
         }
      }

      // Clamp X to be within screen bounds (with some margin for platform width)
      const margin = platformW / 2 + 20;
      if (nextX < margin) nextX = margin;
      if (nextX > GAME_WIDTH - margin) nextX = GAME_WIDTH - margin;

      platforms.push({
        x: nextX,
        y: currentY,
        width: platformW,
        height: 40
      });

      lastX = nextX;
      // Move up
      currentY -= (gapMin + Math.random() * (gapMax - gapMin));
    }
    
    // Goal Platform
    platforms.push({ x: goalPos.x, y: goalPos.y + 50, width: 140, height: 40 });

    const estimatedJumps = Math.ceil((levelHeight - 150) / 120) + 2;

    levels.push({
      id,
      startPos,
      goalPos,
      platforms,
      maxJumps3Stars: estimatedJumps,
      maxJumps2Stars: Math.ceil(estimatedJumps * 1.5)
    });
  }

  return levels;
};

export const LEVELS: LevelData[] = generateLevels();