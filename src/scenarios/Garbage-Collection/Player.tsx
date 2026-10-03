import React, { useEffect, useState } from 'react';
import playerImg from '../../assets/Garbage-Collection/player.png';
import './player.css';

type Position = { x: number; y: number };

interface PlayerProps {
  target?: Position;
  onArrived?: () => void; // <-- new optional callback
}

const Player: React.FC<PlayerProps> = ({ target, onArrived }) => {
  const [pos, setPos] = useState<Position>({ x: -90, y: 450 }); // lowered start

  // Keyboard movement
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      setPos(prev => {
        switch (e.key) {
          case 'ArrowUp': return { ...prev, y: prev.y };
          case 'ArrowDown': return { ...prev, y: prev.y };
          case 'ArrowLeft': return { ...prev, x: prev.x };
          case 'ArrowRight': return { ...prev, x: prev.x };
          default: return prev;
        }
      });
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Auto‑move toward target
  useEffect(() => {
    if (!target) return;
    let animationFrame: number;

    const step = () => {
      setPos(prev => {
        const dx = target.x - prev.x;
        const dy = target.y - prev.y;

        // If close enough, stop and trigger onArrived
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
          if (onArrived) onArrived();
          return prev;
        }

        return {
          x: prev.x + Math.sign(dx) * 5,
          y: prev.y + Math.sign(dy) * 5
        };
      });
      animationFrame = requestAnimationFrame(step);
    };

    animationFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrame);
  }, [target, onArrived]);

  return (
    <img
      src={playerImg}
      alt="Player"
      className="player"
      style={{ left: pos.x, top: pos.y, position: 'absolute' }}
    />
  );
};

export default Player;