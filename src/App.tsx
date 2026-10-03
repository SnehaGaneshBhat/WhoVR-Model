import React, { useState } from "react";
import TempleApp from "./scenarios/Temple-Beggar/TempleApp";
import GarbageApp from "./scenarios/Garbage-Collection/GarbageApp";
import FoodScenarioApp from "./scenarios/Food-Scenario/Subway/FoodScenarioApp";
import RestaurantHub from "./scenarios/Food-Scenario/RestaurantHub";
import { SessionProvider } from "./telemetry/SessionContext";

export default function App() {
  const [mode, setMode] = useState<"temple" | "garbage" | "food">("temple");

  return (
    <SessionProvider scenario={mode}>
      <div style={{ padding: "1rem" }}>
        <h1>Combined Model</h1>
        <div style={{ marginBottom: "1rem" }}>
          <button onClick={() => setMode("temple")}>Temple Scenario</button>
          <button onClick={() => setMode("garbage")}>Garbage Scenario</button>
          <button onClick={() => setMode("food")}>Food Scenario</button>
        </div>

        {mode === "temple" && <TempleApp />}
        {mode === "garbage" && <GarbageApp />}
        {mode === "food" && <RestaurantHub />}

      </div>
    </SessionProvider>
  );
}
