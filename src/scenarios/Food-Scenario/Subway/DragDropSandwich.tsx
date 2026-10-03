import React, { useState } from "react";
import "./DragDropSandwich.css";


interface Veggie {
  id: string;
  img: string;
  label: string;
}

interface Props {
  items: Veggie[];
}

export default function DragDropSandwich({ items }: Props) {
  const [sandwichItems, setSandwichItems] = useState<Veggie[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const handleDrop = (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const currentCount = counts[id] || 0;
    if (currentCount < 3) {
      setSandwichItems([...sandwichItems, item]);
      setCounts({ ...counts, [id]: currentCount + 1 });
    }
  };

  return (
    <div className="dragdrop-container">
      {/* Veggie palette */}
      <div className="veggie-palette">
        {items.map(item => (
          <img
            key={item.id}
            src={item.img}
            alt={item.label}
            className="palette-veggie"
            draggable
            onDragStart={(e) => e.dataTransfer.setData("veggie", item.id)}
          />
        ))}
      </div>

      {/* Sandwich drop zone */}
      <div
        className="sandwich-area"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          const veggieId = e.dataTransfer.getData("veggie");
          handleDrop(veggieId);
        }}
      >
        <h3>Build your sandwich:</h3>
        {sandwichItems.map((item, idx) => (
          <img
            key={`${item.id}-${idx}`}
            src={item.img}
            alt={item.label}
            className="sandwich-veggie"
          />
        ))}
      </div>
    </div>
  );
}
