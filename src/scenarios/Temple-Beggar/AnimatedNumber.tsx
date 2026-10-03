import React, { useEffect, useState } from "react";

export default function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const step = value / 30; // 30 frames
    const interval = setInterval(() => {
      start += step;
      if (start >= value) {
        setDisplay(Number(value.toFixed(1)));
        clearInterval(interval);
      } else {
        setDisplay(Number(start.toFixed(1)));
      }
    }, 30); // 30ms per frame
    return () => clearInterval(interval);
  }, [value]);

  return <span>{display}</span>;
}