import React, { useState, useEffect, forwardRef, useRef } from "react";
import "./Person.css";
import personImg from "../../assets/Temple-Beggar/person.png";

interface PersonProps {
  beggarRef: React.RefObject<HTMLDivElement | null>;
  zoomedIn: boolean;
  onIgnore: () => void;
  onNearBeggar: (near: boolean) => void;
}

const Person = forwardRef<HTMLDivElement, PersonProps>(
  ({ beggarRef, zoomedIn, onIgnore, onNearBeggar }, ref) => {
    const [x, setX] = useState(0);
    const [ignoredOnce, setIgnoredOnce] = useState(false);

    // 👇 internal ref for the person element
    const personRef = useRef<HTMLDivElement>(null);

    // Expose personRef to parent if needed
    useEffect(() => {
      if (typeof ref === "function") {
        ref(personRef.current);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLDivElement | null>).current =
          personRef.current;
      }
    }, [ref]);

    // Handle arrow key movement
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "ArrowLeft") {
          setX((prev) => Math.max(prev - 20, 0));
        } else if (e.key === "ArrowRight") {
          setX((prev) => prev + 20);
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Proximity + ignore logic
    useEffect(() => {
      const beggarEl = beggarRef.current;
      const personEl = personRef.current;

      if (!zoomedIn && beggarEl && personEl) {
        const beggarRect = beggarEl.getBoundingClientRect();
        const personRect = personEl.getBoundingClientRect();

        const beggarCenter = beggarRect.left + beggarRect.width / 2;
        const personCenter = personRect.left + personRect.width / 2;

        const distance = Math.abs(personCenter - beggarCenter);

        // 👇 glow when within 50px
        onNearBeggar(distance <= 150);

        // 👇 ignore when person has passed beggar
        if (!ignoredOnce && personCenter > beggarCenter + 150) {
          onIgnore();
          setIgnoredOnce(true);
        }
      }
    }, [x, zoomedIn, beggarRef, onIgnore, ignoredOnce, onNearBeggar]);

    return (
      <div ref={personRef} className="person" style={{ left: `${x}px` }}>
        <img src={personImg} alt="Person" className="person-img" />
      </div>
    );
  }
);

export default Person;