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
  
  // Refs to hold instances
  const appRef = useRef<PIXI.Application | null>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  
  // References for game loop access
  const entitiesRef = useRef<{
    playerBody: Matter.Body | null;
    playerGraphics: PIXI.Container | null;
  }>({ playerBody: null, playerGraphics: null });

  // Input and State Refs (to avoid stale closures in loop)
  const keys = useRef<{ [key: string]: boolean }>({});
  
  // Jump logic state
  const jumpCount = useRef(0);
  const isGameActive = useRef(true);
  const jumpsRef = useRef(0);

  // Sync state to ref for the game loop
  useEffect(() => {
    jumpsRef.current = jumps;
  }, [jumps]);

  // Initialize Game
  useEffect(() => {
    if (!containerRef.current) return;

    // --- 1. Setup PixiJS v7 (Synchronous) ---
    const app = new PIXI.Application({
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      backgroundColor: COLORS.background,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });
    
    containerRef.current.appendChild(app.view as unknown as Node);
    appRef.current = app;

    // --- 2. Setup Matter.js ---
    const engine = Matter.Engine.create();
    engine.gravity.y = PHYSICS_OPTS.gravity;
    const world = engine.world;
    engineRef.current = engine;

    // --- 3. Create Scene Content ---

    // Background Clouds
    const cloudContainer = new PIXI.Container();
    app.stage.addChild(cloudContainer);
    for(let i=0; i<5; i++) {
        const cloud = new PIXI.Graphics();
        cloud.beginFill(0xFFFFFF, 0.4);
        cloud.drawCircle(0, 0, 40 + Math.random() * 30);
        cloud.drawCircle(30, -10, 50 + Math.random() * 30);
        cloud.drawCircle(60, 0, 40 + Math.random() * 30);
        cloud.endFill();
        cloud.x = Math.random() * GAME_WIDTH;
        cloud.y = Math.random() * GAME_HEIGHT * 0.8;
        cloudContainer.addChild(cloud);
    }

    // Platforms
    level.platforms.forEach(p => {
      // Matter Body
      const body = Matter.Bodies.rectangle(p.x, p.y, p.width, p.height, {
        isStatic: true,
        friction: 0.1
      });
      if (p.rotation) Matter.Body.rotate(body, p.rotation);
      Matter.World.add(world, body);

      // Pixi Graphics (v7 API)
      const graphics = new PIXI.Graphics();
      graphics.beginFill(COLORS.platform);
      graphics.lineStyle(2, COLORS.platformStroke);
      graphics.drawRoundedRect(-p.width/2, -p.height/2, p.width, p.height, 8);
      graphics.endFill();
      
      // Detail lines
      graphics.lineStyle(1, COLORS.platformStroke, 0.5);
      graphics.moveTo(-p.width/2 + 10, -p.height/2);
      graphics.lineTo(-p.width/2 + 10, p.height/2);
      graphics.moveTo(p.width/2 - 10, -p.height/2);
      graphics.lineTo(p.width/2 - 10, p.height/2);

      graphics.x = p.x;
      graphics.y = p.y;
      graphics.rotation = p.rotation || 0;
      app.stage.addChild(graphics);
    });

    // Player
    const playerSize = 34;
    const playerBody = Matter.Bodies.rectangle(level.startPos.x, level.startPos.y, playerSize, playerSize, {
      inertia: Infinity, // Prevent rotation
      friction: PHYSICS_OPTS.friction,
      frictionAir: PHYSICS_OPTS.frictionAir,
      restitution: PHYSICS_OPTS.restitution,
      label: 'player'
    });
    Matter.World.add(world, playerBody);

    const playerGraphics = new PIXI.Container();
    
    const bodyG = new PIXI.Graphics();
    bodyG.beginFill(COLORS.player);
    bodyG.lineStyle(2, 0xcc6600);
    bodyG.drawRoundedRect(-playerSize/2, -playerSize/2, playerSize, playerSize, 4);
    bodyG.endFill();
    playerGraphics.addChild(bodyG);

    const eye = new PIXI.Graphics();
    eye.beginFill(0xFFFFFF);
    eye.drawCircle(-7, -5, 5);
    eye.drawCircle(7, -5, 5);
    eye.endFill();
    eye.beginFill(0x0000AA);
    eye.drawCircle(-7, -5, 2);
    eye.drawCircle(7, -5, 2);
    eye.endFill();
    playerGraphics.addChild(eye);

    const mouth = new PIXI.Graphics();
    mouth.lineStyle(1.5, 0x000000);
    mouth.arc(0, 3, 5, 0, Math.PI);
    playerGraphics.addChild(mouth);

    app.stage.addChild(playerGraphics);
    entitiesRef.current.playerBody = playerBody;
    entitiesRef.current.playerGraphics = playerGraphics;

    // Goal (Flag)
    const goalBody = Matter.Bodies.rectangle(level.goalPos.x, level.goalPos.y, 40, 60, {
      isStatic: true,
      isSensor: true,
      label: 'goal'
    });
    Matter.World.add(world, goalBody);

    const goalGraphics = new PIXI.Container();
    goalGraphics.x = level.goalPos.x;
    goalGraphics.y = level.goalPos.y;

    const pole = new PIXI.Graphics();
    pole.beginFill(COLORS.flagPole);
    pole.drawRect(10, -30, 4, 60);
    pole.endFill();
    goalGraphics.addChild(pole);

    const flag = new PIXI.Graphics();
    flag.beginFill(COLORS.flag);
    flag.moveTo(14, -30);
    flag.lineTo(34, -20);
    flag.lineTo(14, -10);
    flag.endFill();
    goalGraphics.addChild(flag);
    
    const base = new PIXI.Graphics();
    base.beginFill(COLORS.platform);
    base.drawRoundedRect(-20, 20, 50, 10, 3);
    base.endFill();
    goalGraphics.addChild(base);

    app.stage.addChild(goalGraphics);

    // --- 4. Start Loops ---
    const runner = Matter.Runner.create();
    runnerRef.current = runner;
    Matter.Runner.run(runner, engine);

    app.ticker.add(() => {
      if (!isGameActive.current || !engine || !entitiesRef.current.playerBody) return;

      const pBody = entitiesRef.current.playerBody;
      const pGraph = entitiesRef.current.playerGraphics;

      // 1. Uniform Horizontal Movement (Velocity Based)
      // Directly set X velocity for precise "start/stop" behavior
      let velocityX = 0;
      if (keys.current['ArrowLeft']) {
        velocityX = -PHYSICS_OPTS.moveSpeed;
      } else if (keys.current['ArrowRight']) {
        velocityX = PHYSICS_OPTS.moveSpeed;
      }
      
      // Preserve current Y velocity (gravity)
      Matter.Body.setVelocity(pBody, { x: velocityX, y: pBody.velocity.y });

      // 2. Sync Graphics
      if (pGraph) {
        pGraph.x = pBody.position.x;
        pGraph.y = pBody.position.y;
        pGraph.rotation = pBody.angle;
      }

      // 3. Win Condition
      const dist = Matter.Vector.magnitude(Matter.Vector.sub(pBody.position, level.goalPos));
      if (dist < 30) {
        isGameActive.current = false;
        Matter.Runner.stop(runner);
        app.ticker.stop();
        onWin(jumpsRef.current);
      }

      // 4. Fall Reset
      if (pBody.position.y > GAME_HEIGHT + 50) {
        Matter.Body.setPosition(pBody, level.startPos);
        Matter.Body.setVelocity(pBody, { x: 0, y: 0 });
        jumpCount.current = 1; 
      }
    });

    // Collision Event for Jump Reset
    Matter.Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach(pair => {
          const other = pair.bodyA.label === 'player' ? pair.bodyB : (pair.bodyB.label === 'player' ? pair.bodyA : null);
          if (other && !other.isSensor) {
              // Reset jump count when touching ground/platform
              // Only if we are somewhat above it (simple check using y velocity or position could be added, but this suffices for now)
              jumpCount.current = 0;
          }
      });
    });

    // Cleanup Function
    return () => {
      isGameActive.current = false;

      // Stop MatterJS
      if (runnerRef.current) Matter.Runner.stop(runnerRef.current);
      if (engineRef.current) {
        Matter.World.clear(engineRef.current.world, false);
        Matter.Engine.clear(engineRef.current);
      }
      
      // Stop and Destroy PixiJS
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true });
        appRef.current = null;
      }
    };
  }, [level]); // Re-run when level changes

  // Input Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
      
      // Jump Logic
      if ((e.code === 'Space' || e.code === 'ArrowUp') && isGameActive.current && entitiesRef.current.playerBody) {
        if (jumpCount.current < 2) {
          const body = entitiesRef.current.playerBody;
          
          // Velocity-based Jump
          // We keep current X velocity, but force Y velocity upwards.
          // This ensures consistent jump height regardless of previous fall speed.
          Matter.Body.setVelocity(body, { 
            x: body.velocity.x, 
            y: -PHYSICS_OPTS.jumpPower 
          });

          jumpCount.current += 1;
          setJumps(prev => prev + 1);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div className="relative w-full h-full flex justify-center items-center bg-gray-900">
      <div ref={containerRef} className="rounded-lg overflow-hidden shadow-2xl border-4 border-gray-800" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }} />
      
      {/* HUD */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-[800px] px-6 py-2 flex justify-between items-center text-white font-bold text-xl pointer-events-none">
        <div className="flex gap-6">
            <span className="drop-shadow-md">Level: {level.id}</span>
            <span className="drop-shadow-md">Jumps: {jumps}</span>
        </div>
        <div className="flex gap-4 pointer-events-auto">
             <button onClick={onExit} className="hover:text-yellow-400 transition-colors drop-shadow-md">Menu</button>
        </div>
      </div>
    </div>
  );
};

export default GameCanvas;