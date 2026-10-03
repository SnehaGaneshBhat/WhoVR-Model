import React, { useState } from "react";
import "./DragDropLeaf.css";

interface FoodItem {
  id: string;
  img: string;
  label: string;
}

interface Props {
  items: FoodItem[];
  onDropItems: (items: FoodItem[]) => void;
}

export default function DragDropLeaf({ items, onDropItems }: Props) {
  const [leafItems, setLeafItems] = useState<FoodItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const handleDrop = (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const currentCount = counts[id] || 0;
    if (currentCount < 3) {
      const newLeafItems = [...leafItems, item];
      setLeafItems(newLeafItems);
      setCounts({ ...counts, [id]: currentCount + 1 });
      onDropItems(newLeafItems); // send updated items back to parent
    }
  };

  return (
    <div className="dragdrop-container">
      {/* Palette of foods */}
      <div className="food-palette">
        {items.map(item => (
          <img
            key={item.id}
            src={item.img}
            alt={item.label}
            className="palette-food"
            draggable
            onDragStart={(e) => e.dataTransfer.setData("food", item.id)}
          />
        ))}
      </div>

      {/* Banana leaf drop zone */}
      <div
        className="leaf-area"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          const foodId = e.dataTransfer.getData("food");
          handleDrop(foodId);
        }}
      >
        <h3>Serve on the banana leaf:</h3>
        <img src="/assets/Food-Scenario/banana_leaf.png" alt="Banana Leaf" className="leaf-img" />
        {leafItems.map((item, idx) => (
          <img
            key={`${item.id}-${idx}`}
            src={item.img}
            alt={item.label}
            className="leaf-food"
          />
        ))}
      </div>
    </div>
  );
}
