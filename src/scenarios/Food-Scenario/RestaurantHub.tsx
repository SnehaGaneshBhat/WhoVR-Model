import React, { useState } from "react";
import FoodScenarioApp from "./Subway/FoodScenarioApp";
import SpiceOfIndiaApp from "./SpiceOfIndia/SpiceOfIndiaApp";
import bgImage from "../../assets/Food-Scenario/street_bg.jpg";

export default function RestaurantHub() {
  const [selected, setSelected] = useState<"subway" | "spice" | null>(null);

  // Shared scores across both restaurants
  const [allSimulationResults, setAllSimulationResults] = useState<number[]>([]);

  const handleReturnToHub = () => {
    setSelected(null);
  };

  if (selected === "subway") {
    return (
      <FoodScenarioApp
        onReturnToHub={handleReturnToHub}
        allSimulationResults={allSimulationResults}
        setAllSimulationResults={setAllSimulationResults}
      />
    );
  }
  if (selected === "spice") {
    return (
      <SpiceOfIndiaApp
        onReturnToHub={handleReturnToHub}
        allSimulationResults={allSimulationResults}
        setAllSimulationResults={setAllSimulationResults}
      />
    );
  }

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, currentTarget } = e;
    const { left, width } = currentTarget.getBoundingClientRect();
    const clickX = clientX - left;

    if (clickX < width / 2) {
      setSelected("subway");
    } else {
      setSelected("spice");
    }
  };

  return (
    <div
      className="restaurant-hub"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        width: "100vw",
        height: "100vh",
        cursor: "pointer",
      }}
      onClick={handleClick}
    >
      <h2 style={{ textAlign: "center", color: "white" }}>
        Click left for Subway, right for Spice of India
      </h2>
    </div>
  );
}
