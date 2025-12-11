import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import Matter from 'matter-js';
import { LevelData } from '../types';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, PHYSICS_OPTS } from '../constants';

interface GameCanvasProps {
  level: LevelData;
  onWin: (jumps: number) => void;
  onExit: () => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ level, onWin, onExit }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [jumps, setJumps] = useState(0);
  
  // Systems
  const appRef = useRef<PIXI.Application | null>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  
  // Game State Refs
  const isGameActive = useRef(true);
  const jumpsRef = useRef(0);
  const jumpCount = useRef(0); // 0 = grounded, 1 = first jump, 2 = double jumped
  
  // Drag Input Refs
  const dragStart = useRef<{x: number, y: number} | null>(null);
  const dragCurrent = useRef<{x: number, y: number} | null>(null);

  // Entities Ref
  const entitiesRef = useRef<{
    playerBody: Matter.Body | null;
    playerGraphics: PIXI.Container | null;
    aimLine: PIXI.Graphics | null;
    cameraY: number;
    trailPoints: {x: number, y: number, alpha: number}[];
    trailGraphics: PIXI.Graphics | null;
  }>({ 
    playerBody: null, 
    playerGraphics: null, 
    aimLine: null, 
    cameraY: 0,
    trailPoints: [],
    trailGraphics: null
  });

  useEffect(() => {
    jumpsRef.current = jumps;
  }, [jumps]);

  useEffect(() => {
    if (!containerRef.current) return;

    // --- 1. Setup PixiJS ---
    const app = new PIXI.Application({
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      backgroundColor: COLORS.background,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });
    
    // Critical: Style the canvas to fit the container
    const canvas = app.view as unknown as HTMLCanvasElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.objectFit = 'contain';
    canvas.style.display = 'block'; // Remove inline-block spacing
    
    containerRef.current.appendChild(canvas);
    appRef.current = app;

    // --- 2. Setup Matter.js ---
    const engine = Matter.Engine.create();
    engine.gravity.y = PHYSICS_OPTS.gravity;
    const world = engine.world;
    engineRef.current = engine;

    // Create World Stage (Container that moves for camera)
    const worldStage = new PIXI.Container();
    app.stage.addChild(worldStage);

    // Trail Graphics (Behind everything in worldStage)
    const trailGraphics = new PIXI.Graphics();
    worldStage.addChild(trailGraphics);
    entitiesRef.current.trailGraphics = trailGraphics;

    // --- 3. Build Level ---

    // Walls (Left and Right invisible barriers)
    // We extend them very high up (e.g. -20000 to level bottom)
    const wallHeight = 40000;
    const wallLeft = Matter.Bodies.rectangle(0, -wallHeight/2 + level.startPos.y, 50, wallHeight, { isStatic: true, friction: 0, label: 'wall' });
    const wallRight = Matter.Bodies.rectangle(GAME_WIDTH, -wallHeight/2 + level.startPos.y, 50, wallHeight, { isStatic: true, friction: 0, label: 'wall' });
    Matter.World.add(world, [wallLeft, wallRight]);

    // Platforms
    level.platforms.forEach(p => {
      const body = Matter.Bodies.rectangle(p.x, p.y, p.width, p.height, {
        isStatic: true,
        friction: PHYSICS_OPTS.friction,
        label: 'platform', // Crucial for one-way logic
        render: { fillStyle: '#000' } // Debug
      });
      if (p.rotation) Matter.Body.rotate(body, p.rotation);
      Matter.World.add(world, body);

      const graphics = new PIXI.Graphics();
      graphics.beginFill(COLORS.platform);
      graphics.lineStyle(4, COLORS.platformStroke);
      graphics.drawRoundedRect(-p.width/2, -p.height/2, p.width, p.height, 12);
      graphics.endFill();
      
      // Deco
      graphics.beginFill(0x000000, 0.1);
      graphics.drawRect(-p.width/2 + 5, -p.height/2 + 5, p.width - 10, p.height/2 - 5);
      graphics.endFill();

      graphics.x = p.x;
      graphics.y = p.y;
      graphics.rotation = p.rotation || 0;
      worldStage.addChild(graphics);
    });

    // Player
    const playerRadius = 25;
    const playerBody = Matter.Bodies.circle(level.startPos.x, level.startPos.y, playerRadius, {
      friction: PHYSICS_OPTS.friction,
      frictionAir: PHYSICS_OPTS.frictionAir,
      restitution: PHYSICS_OPTS.restitution,
      label: 'player'
    });
    Matter.World.add(world, playerBody);

    const playerGraphics = new PIXI.Container();
    const bodyG = new PIXI.Graphics();
    bodyG.beginFill(COLORS.player);
    bodyG.lineStyle(3, 0xFFFFFF);
    bodyG.drawCircle(0, 0, playerRadius);
    bodyG.endFill();
    playerGraphics.addChild(bodyG);

    // Eyes
    const eye = new PIXI.Graphics();
    eye.beginFill(0xFFFFFF);
    eye.drawCircle(-8, -5, 8);
    eye.drawCircle(8, -5, 8);
    eye.endFill();
    eye.beginFill(0x000000);
    eye.drawCircle(-8, -5, 3);
    eye.drawCircle(8, -5, 3);
    eye.endFill();
    playerGraphics.addChild(eye);

    worldStage.addChild(playerGraphics);
    entitiesRef.current.playerBody = playerBody;
    entitiesRef.current.playerGraphics = playerGraphics;

    // Aim Line
    const aimLine = new PIXI.Graphics();
    app.stage.addChild(aimLine); 
    entitiesRef.current.aimLine = aimLine;

    // Goal
    // Increased Goal Hitbox Size for easier winning
    const goalBody = Matter.Bodies.rectangle(level.goalPos.x, level.goalPos.y, 100, 100, {
      isStatic: true,
      isSensor: true,
      label: 'goal'
    });
    Matter.World.add(world, goalBody);

    const goalGraphics = new PIXI.Container();
    goalGraphics.x = level.goalPos.x;
    goalGraphics.y = level.goalPos.y;
    
    // Pole
    const pole = new PIXI.Graphics();
    pole.beginFill(COLORS.flagPole);
    pole.drawRect(-4, -40, 8, 80);
    pole.endFill();
    goalGraphics.addChild(pole);
    
    // Flag
    const flag = new PIXI.Graphics();
    flag.beginFill(COLORS.flag);
    flag.moveTo(0, -40);
    flag.lineTo(50, -20);
    flag.lineTo(0, 0);
    flag.endFill();
    goalGraphics.addChild(flag);

    worldStage.addChild(goalGraphics);

    // Initial Camera Setup
    entitiesRef.current.cameraY = level.startPos.y - GAME_HEIGHT * 0.7;
    worldStage.pivot.y = entitiesRef.current.cameraY;

    // --- 4. Game Loop ---
    const runner = Matter.Runner.create();
    runnerRef.current = runner;
    Matter.Runner.run(runner, engine);

    // One-Way Platform Logic (Robust Implementation)
    // Cast event to any because the default IEvent<Engine> type might not include 'pairs' property in strict TS configurations
    Matter.Events.on(engine, 'preSolve', (event: any) => {
        event.pairs.forEach((pair: any) => {
            const { bodyA, bodyB } = pair;
            const player = bodyA.label === 'player' ? bodyA : (bodyB.label === 'player' ? bodyB : null);
            const platform = bodyA.label === 'platform' ? bodyA : (bodyB.label === 'platform' ? bodyB : null);

            if (player && platform) {
                // Logic: collision is ACTIVE by default. We disable it if conditions meet.
                
                // 1. If moving UP, disable collision.
                // 2. If moving DOWN but currently inside/below the platform, disable collision.
                
                // Get bounds
                const playerBottom = player.position.y + playerRadius;
                // platform.bounds.min.y is the top edge
                const platformTop = platform.bounds.min.y;
                
                // Tolerance makes sure we don't fall through when standing
                // but allows us to pass through if we are just cresting the top
                const tolerance = 5; 

                if (player.velocity.y < 0) {
                     // Moving UP - Pass through
                     pair.isActive = false;
                } else if (playerBottom > platformTop + tolerance) {
                     // Moving DOWN (or stationary), but our feet are below the platform surface.
                     // This means we are inside or coming from below.
                     pair.isActive = false;
                }
                // Otherwise (Moving down AND feet are above platform), let collision happen (pair.isActive = true)
            }
        });
    });

    app.ticker.add((delta) => {
      if (!isGameActive.current || !engine || !entitiesRef.current.playerBody) return;

      const pBody = entitiesRef.current.playerBody;
      const pGraph = entitiesRef.current.playerGraphics;

      // 1. Sync Graphics
      if (pGraph) {
        pGraph.x = pBody.position.x;
        pGraph.y = pBody.position.y;
        pGraph.rotation = pBody.angle;
      }

      // 2. Camera Follow (Vertical)
      const targetCamY = pBody.position.y - GAME_HEIGHT * 0.6;
      entitiesRef.current.cameraY += (targetCamY - entitiesRef.current.cameraY) * 0.1;
      worldStage.pivot.y = entitiesRef.current.cameraY;
      worldStage.pivot.x = 0; 

      // 3. Trail Effect
      const trail = entitiesRef.current.trailPoints;
      const tGraph = entitiesRef.current.trailGraphics;
      if (tGraph) {
          // Add new point occasionally or every frame
          trail.push({ x: pBody.position.x, y: pBody.position.y, alpha: 0.6 });
          if (trail.length > 20) trail.shift();
          
          tGraph.clear();
          trail.forEach((p, i) => {
              // Fade out
              p.alpha -= 0.02;
              if (p.alpha <= 0) p.alpha = 0;
              
              const size = (i / trail.length) * 20; // Getting bigger towards player? Or smaller trailing off.
              tGraph.beginFill(COLORS.player, p.alpha * 0.5);
              tGraph.drawCircle(p.x, p.y, size);
              tGraph.endFill();
          });
          // Remove invisible
          entitiesRef.current.trailPoints = trail.filter(p => p.alpha > 0);
      }

      // 4. Draw Aim Line
      const aim = entitiesRef.current.aimLine;
      if (aim) {
        aim.clear();
        if (dragStart.current && dragCurrent.current) {
            const start = dragStart.current;
            const curr = dragCurrent.current;
            const dx = start.x - curr.x;
            const dy = start.y - curr.y;
            const playerScreenX = pBody.position.x;
            const playerScreenY = pBody.position.y - worldStage.pivot.y;
            const len = Math.sqrt(dx*dx + dy*dy);
            const maxLen = 200;
            const scale = len > maxLen ? maxLen / len : 1;
            
            aim.lineStyle(6, COLORS.aimLine, 0.6);
            aim.moveTo(playerScreenX, playerScreenY);
            aim.lineTo(playerScreenX + dx * scale, playerScreenY + dy * scale);
            aim.drawCircle(playerScreenX + dx * scale, playerScreenY + dy * scale, 10);
        }
      }

      // 5. Win Condition
      const dist = Matter.Vector.magnitude(Matter.Vector.sub(pBody.position, level.goalPos));
      if (dist < 60) { // Increased win distance check logic as backup
        isGameActive.current = false;
        onWin(jumpsRef.current);
      }

      // 6. Fall Reset
      const screenBottomY = entitiesRef.current.cameraY + GAME_HEIGHT;
      if (pBody.position.y > screenBottomY + 100) {
        Matter.Body.setPosition(pBody, level.startPos);
        Matter.Body.setVelocity(pBody, { x: 0, y: 0 });
        Matter.Body.setAngularVelocity(pBody, 0);
        entitiesRef.current.cameraY = level.startPos.y - GAME_HEIGHT * 0.7;
        entitiesRef.current.trailPoints = []; // Clear trail
        jumpCount.current = 1; 
      }
    });

    // Collision Logic (Ground detection)
    Matter.Events.on(engine, 'collisionStart', (event) => {
        event.pairs.forEach(pair => {
            const bodyA = pair.bodyA;
            const bodyB = pair.bodyB;
            const player = bodyA.label === 'player' ? bodyA : (bodyB.label === 'player' ? bodyB : null);
            const other = bodyA === player ? bodyB : bodyA;
            
            if (player && other) {
                if (other.isSensor) {
                    if (other.label === 'goal') {
                         isGameActive.current = false;
                         onWin(jumpsRef.current);
                    }
                } else if (other.label !== 'wall') {
                    // Reset jump on land
                    if (player.velocity.y >= -1) {
                        jumpCount.current = 0;
                    }
                }
            }
        });
    });

    return () => {
      isGameActive.current = false;
      if (runnerRef.current) Matter.Runner.stop(runnerRef.current);
      if (engineRef.current) Matter.World.clear(engineRef.current.world, false);
      if (appRef.current) appRef.current.destroy(true, { children: true, texture: true });
    };
  }, [level]);

  // Input Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isGameActive.current) return;
    dragStart.current = { x: e.clientX, y: e.clientY };
    dragCurrent.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragStart.current) return;
    dragCurrent.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragStart.current || !dragCurrent.current || !entitiesRef.current.playerBody) {
        dragStart.current = null;
        return;
    }
    const dx = dragStart.current.x - dragCurrent.current.x;
    const dy = dragStart.current.y - dragCurrent.current.y;
    dragStart.current = null;
    dragCurrent.current = null;

    const mag = Math.sqrt(dx*dx + dy*dy);
    if (mag < 20) return;

    if (jumpCount.current < 2) {
        const body = entitiesRef.current.playerBody;
        const forceX = dx * PHYSICS_OPTS.jumpForceMultiplier;
        const forceY = dy * PHYSICS_OPTS.jumpForceMultiplier;
        const forceMag = Math.sqrt(forceX*forceX + forceY*forceY);
        const scale = forceMag > PHYSICS_OPTS.maxJumpForce ? PHYSICS_OPTS.maxJumpForce / forceMag : 1;

        Matter.Body.applyForce(body, body.position, {
            x: forceX * scale,
            y: forceY * scale
        });

        jumpCount.current++;
        setJumps(prev => prev + 1);
    }
  };

  return (
    <div 
        className="w-full h-full bg-gray-900 select-none touch-none flex items-center justify-center overflow-hidden"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
    >
      <div ref={containerRef} className="w-full h-full max-w-[750px] flex items-center justify-center" />
      
      {/* HUD */}
      <div className="absolute top-4 left-0 w-full px-6 flex justify-between items-start text-white pointer-events-none z-20">
        <div className="flex flex-col gap-1">
            <span className="font-black text-3xl drop-shadow-md text-yellow-400">LVL {level.id}</span>
            <span className="font-bold text-xl drop-shadow-md opacity-80">Jumps: {jumps}</span>
        </div>
        <button 
            onClick={onExit} 
            className="pointer-events-auto bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-xl border border-white/30 text-sm font-bold active:scale-95 transition-all"
        >
            PAUSE
        </button>
      </div>

      {/* Tutorial Hint */}
      {jumps === 0 && level.id === 1 && (
        <div className="absolute bottom-20 left-0 w-full text-center pointer-events-none animate-pulse">
            <p className="text-white text-xl font-bold drop-shadow-lg">Drag & Release to Jump!</p>
            <div className="mt-2 text-3xl">👇</div>
        </div>
      )}
    </div>
  );
};

export default GameCanvas;