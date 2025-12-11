import { LevelData, PlatformData, Vector2 } from './types';

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
  gravity: 1.5,      
  friction: 0.1,       
  frictionAir: 0.02, 
  restitution: 0.0,  
  jumpPower: 14,     
  moveSpeed: 5,      
};

// Helper to generate 30 unique, progressively harder levels
const generateLevels = (): LevelData[] => {
  const levels: LevelData[] = [];
  const TOTAL_LEVELS = 30;

  for (let id = 1; id <= TOTAL_LEVELS; id++) {
    const platforms: PlatformData[] = [];
    let startPos: Vector2 = { x: 50, y: 500 };
    let goalPos: Vector2 = { x: 750, y: 500 };
    let maxJumps3 = 0;

    // --- PHASE 1: THE PLAINS (Levels 1-5) ---
    // Focus: Basic horizontal spacing and double jump introduction.
    if (id <= 5) {
      startPos = { x: 60, y: 500 };
      goalPos = { x: 740, y: 500 };
      
      // Start & End
      platforms.push({ x: 60, y: 550, width: 120, height: 40 });
      platforms.push({ x: 740, y: 550, width: 120, height: 40 });

      // Between x=120 and x=680 is 560px gap.
      // L1: 4 middle platforms (Easy)
      // L5: 1 middle platform (Hard)
      const numMiddle = 6 - id; 
      const spacing = 680 / (numMiddle + 1);

      for (let k = 1; k <= numMiddle; k++) {
        platforms.push({
          x: 60 + (spacing * k),
          y: 550,
          width: 90 - (id * 5), // Getting slightly narrower
          height: 40
        });
      }
      maxJumps3 = numMiddle + 4;
    }

    // --- PHASE 2: THE HILLS (Levels 6-10) ---
    // Focus: Height variation (Sine waves).
    else if (id <= 10) {
      startPos = { x: 50, y: 450 };
      goalPos = { x: 750, y: 450 };
      
      platforms.push({ x: 50, y: 500, width: 100, height: 40 });
      platforms.push({ x: 750, y: 500, width: 100, height: 40 });

      const count = 5;
      const stepX = 110; // Fixed horizontal step
      
      for (let k = 1; k <= count; k++) {
        // Amplitude grows with level difficulty
        const amplitude = 60 + ((id - 5) * 25); 
        const yOffset = Math.sin((k / count) * Math.PI) * amplitude;
        
        platforms.push({
          x: 100 + (k * stepX),
          y: 500 - yOffset,
          width: 80,
          height: 40
        });
      }
      maxJumps3 = 8 + (id - 5);
    }

    // --- PHASE 3: THE STAIRS (Levels 11-15) ---
    // Focus: Vertical precision. Going Up or Down.
    else if (id <= 15) {
      const isUpward = id % 2 !== 0; // Alternate up/down levels
      
      const groundY = isUpward ? 550 : 200;
      const targetY = isUpward ? 200 : 550;
      
      startPos = { x: 50, y: groundY - 50 };
      goalPos = { x: 750, y: targetY - 50 };
      
      platforms.push({ x: 50, y: groundY, width: 100, height: 40 });
      platforms.push({ x: 750, y: targetY, width: 100, height: 40 });
      
      const steps = 6;
      const xDist = 600 / steps;
      const totalYDist = targetY - groundY;
      
      for(let s=1; s < steps; s++) {
         const progress = s / steps;
         // Add some randomness to height to make it less perfect stairs
         const jitter = (Math.random() * 40) - 20;
         
         platforms.push({
           x: 100 + (s * xDist),
           y: groundY + (progress * totalYDist) + jitter,
           width: 75 - ((id-10) * 4), // Getting narrower
           height: 30
         });
      }
      maxJumps3 = 10;
    }

    // --- PHASE 4: THE ARCHIPELAGO (Levels 16-20) ---
    // Focus: Small platforms, varying heights, precision landings.
    else if (id <= 20) {
      startPos = { x: 40, y: 350 };
      goalPos = { x: 760, y: 350 };
      
      platforms.push({ x: 40, y: 400, width: 80, height: 40 });
      platforms.push({ x: 760, y: 400, width: 80, height: 40 });
      
      const numIslands = 6;
      // Deterministic pseudo-random based on ID
      const seed = id * 1337;
      
      for(let k=1; k<=numIslands; k++) {
        const xPos = 100 + (k * 90);
        // Vary height wildly but keeping it on screen (150 to 550)
        const yPos = 350 + (Math.sin(seed + k) * 120); 
        
        platforms.push({
          x: xPos,
          y: yPos,
          width: 50, // Small!
          height: 25
        });
      }
      maxJumps3 = 14;
    }

    // --- PHASE 5: THE TOWER (Levels 21-25) ---
    // Focus: Vertical zig-zag climbing.
    else if (id <= 25) {
      startPos = { x: 100, y: 550 };
      // Goal is high up
      const floors = 5;
      const floorHeight = 90;
      const topY = 600 - (floors * floorHeight);
      goalPos = { x: 400, y: topY - 50 };

      // Base
      platforms.push({ x: 100, y: 600, width: 160, height: 40 });
      
      for(let f=1; f<=floors; f++) {
        const isLeft = f % 2 !== 0; // Zig Zag
        platforms.push({
          x: isLeft ? 250 : 550,
          y: 600 - (f * floorHeight),
          width: 120 - ((id-20) * 10), // Shrinking width
          height: 30
        });
      }
      
      // Top Platform for goal
      platforms.push({ x: 400, y: topY, width: 100, height: 30 });
      maxJumps3 = 16;
    }

    // --- PHASE 6: INFERNO (Levels 26-30) ---
    // Focus: The ultimate test. Long gaps, tiny blocks.
    else {
      startPos = { x: 50, y: 300 };
      goalPos = { x: 750, y: 300 };
      
      platforms.push({ x: 50, y: 350, width: 60, height: 40 });
      platforms.push({ x: 750, y: 350, width: 60, height: 40 });
      
      const count = 7;
      for(let s=1; s<=count; s++) {
          const x = 50 + (s * 95);
          // A difficult arch pattern
          const y = 350 + Math.cos((s/count) * Math.PI * 2) * 150;
          
          platforms.push({
              x: x,
              y: y,
              width: 35, // Tiny
              height: 20
          });
      }
      maxJumps3 = 18;
    }

    // Calculate 2-star threshold (lenient)
    const maxJumps2 = Math.floor(maxJumps3 * 1.5);

    levels.push({
      id,
      startPos,
      goalPos,
      platforms,
      maxJumps3Stars: maxJumps3,
      maxJumps2Stars: maxJumps2
    });
  }

  return levels;
};

export const LEVELS: LevelData[] = generateLevels();