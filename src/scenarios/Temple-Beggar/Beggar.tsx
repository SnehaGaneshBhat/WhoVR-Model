import React, { useState, useEffect, useRef } from "react";
import beggarCryImg from "../../assets/Temple-Beggar/beggar_cry.png";
import beggarSmileImg from "../../assets/Temple-Beggar/beggar_smile.png";
import "./Beggar.css";

type Mood = "crying" | "smiling";

interface BeggarProps {
  onDrop: (e: React.DragEvent<HTMLDivElement>, target: string) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  triggerHappy: boolean;
  pumpTrigger?: number;
  onClick?: () => void; // optional click handler
  glow?: boolean;       // 👈 new prop to toggle glow when player is nearby
}

export default function Beggar({
  onDrop,
  onDragOver,
  triggerHappy,
  pumpTrigger,
  onClick,
  glow = false, // default false
}: BeggarProps) {
  const [mood, setMood] = useState<Mood>("crying");
  const [pump, setPump] = useState(false);

  // Keep mood in sync
  useEffect(() => {
    setMood(triggerHappy ? "smiling" : "crying");
  }, [triggerHappy]);

  // Reliable pump re-trigger on every pumpTrigger change
  const lastPump = useRef<number>(-1);
  useEffect(() => {
    if (pumpTrigger === undefined) return;
    if (pumpTrigger === lastPump.current) return;
    lastPump.current = pumpTrigger;

    setPump(false);
    const rafId = requestAnimationFrame(() => {
      setPump(true);
    });

    const timeoutId = setTimeout(() => setPump(false), 900);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
    };
  }, [pumpTrigger]);

  return (
    <div
      onDrop={(e) => onDrop(e, "beggar")}
      onDragOver={onDragOver}
      onClick={onClick}
      className="beggar-container"
    >
      <img
        src={mood === "crying" ? beggarCryImg : beggarSmileImg}
        alt="Beggar"
        className={`beggar ${mood} ${pump ? "pump" : ""} ${glow ? "nearby" : ""}`}
      />
    </div>
  );
}