import React, { useState } from "react";
import "./SpiceOfIndiaApp.css";
import DoneButton from "./DoneButton";
import NewSimulation from "./NewSimulation";
import { FoodScenario } from "../../../engine/scenarios/FoodScenario";

import backgroundImg from "../../../assets/Food-Scenario/indian_main_bg.jpg";

import vadaImg from "../../../assets/Food-Scenario/vada.png";
import turmericImg from "../../../assets/Food-Scenario/turmeric.png";
import rasamImg from "../../../assets/Food-Scenario/sambar.png";
import pickleImg from "../../../assets/Food-Scenario/pickles.png";
import gheeImg from "../../../assets/Food-Scenario/ghee.png";
import riceImg from "../../../assets/Food-Scenario/rice.png";
import mirchiBajjiImg from "../../../assets/Food-Scenario/mirchi_bajji.png";
import idlyImg from "../../../assets/Food-Scenario/idly.png";
import gajarHalwaImg from "../../../assets/Food-Scenario/gajar_halwa.png";
import kesariBathImg from "../../../assets/Food-Scenario/kesari_bath.png";
import onionImg from "../../../assets/Food-Scenario/onion.png";

import bananaLeafImg from "../../../assets/Food-Scenario/banana_leaf.png";
import feastImg from "../../../assets/Food-Scenario/feast.png";

type SpiceOfIndiaAppProps = {
  onReturnToHub: () => void;
  allSimulationResults: number[];
  setAllSimulationResults: React.Dispatch<React.SetStateAction<number[]>>;
};

export default function SpiceOfIndiaApp({
  onReturnToHub,
  allSimulationResults,
  setAllSimulationResults,
}: SpiceOfIndiaAppProps) {
  const [leafItems, setLeafItems] = useState<{id:string,img:string,label:string,css:string}[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);

  // Engine result states
  const [itemScores, setItemScores] = useState<{id:string; score:number}[]>([]);
  const [rawScore, setRawScore] = useState(0);
  const [penalty, setPenalty] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [excessHealthy, setExcessHealthy] = useState(0);
  const [excessUnhealthy, setExcessUnhealthy] = useState(0);

  // South Indian feast items
  const allItems = [
    { id: "ADD_TURMERIC", img: turmericImg, label: "Turmeric", css: "turmeric" },
    { id: "ADD_GHEE", img: gheeImg, label: "Ghee", css: "ghee" },
    { id: "ADD_RASAM", img: rasamImg, label: "Rasam", css: "rasam" },
    { id: "ADD_RICE", img: riceImg, label: "Rice", css: "rice" },
    { id: "ADD_IDLY", img: idlyImg, label: "Idly", css: "idly" },
    { id: "ADD_ONION", img: onionImg, label: "Onion", css: "onion" },
    { id: "ADD_VADA", img: vadaImg, label: "Vada", css: "vada" },
    { id: "ADD_MIRCHI_BAJJI", img: mirchiBajjiImg, label: "Mirchi Bajji", css: "mirchi_bajji" },
    { id: "ADD_PICKLE", img: pickleImg, label: "Pickle", css: "pickle" },
    { id: "ADD_GAJAR_HALWA", img: gajarHalwaImg, label: "Gajar Halwa", css: "gajar_halwa" },
    { id: "ADD_KESARI_BATH", img: kesariBathImg, label: "Kesari Bath", css: "kesari_bath" },
  ];

  const handleDrop = (id: string) => {
    const item = allItems.find(i => i.id === id);
    if (!item) return;

    const currentCount = counts[item.id] || 0;
    if (currentCount < 3) {
      setLeafItems([...leafItems, item]);
      setCounts({ ...counts, [item.id]: currentCount + 1 });
    }
  };

  const handleDone = () => {
    setDone(true);

    const selectedIds = leafItems.map(i => i.id);
    const scenario = new FoodScenario();
    const result = scenario.score(selectedIds);

    setItemScores(result.itemScores);
    setRawScore(result.rawScore);
    setPenalty(result.penalty);
    setFinalScore(result.finalScore);
    setExcessHealthy(result.excessHealthy);
    setExcessUnhealthy(result.excessUnhealthy);

    // Save into shared results
    setAllSimulationResults([...allSimulationResults, result.finalScore]);
  };

  return (
    <div className="food-app" style={{ backgroundImage: `url(${backgroundImg})` }}>
      {/* Food palette */}
      {allItems.map(item => (
        <img
          key={item.id}
          src={item.img}
          alt={item.label}
          className={`food-item ${item.css}`}
          draggable
          onDragStart={(e) => e.dataTransfer.setData("food", item.id)}
        />
      ))}

      {/* Banana leaf drop zone */}
      {!done && (
        <div className="food-item leaf-drop"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            const foodId = e.dataTransfer.getData("food");
            handleDrop(foodId);
          }}
        >
          <img src={bananaLeafImg} alt="banana leaf" className="leaf-img" />
          {leafItems.map((item, idx) => (
            <img key={`${item.id}-${idx}`} src={item.img} alt={item.label} className="leaf-food" />
          ))}
        </div>
      )}

      {/* Final feast */}
      {done && (
        <div className="food-item feast-final">
          <img src={feastImg} alt="feast" className="feast-img" />
        </div>
      )}

      {/* Scoreboard */}
      {done ? (
        <div className="score-panel">
          <h3>Selected Items & Scores:</h3>
          <ul>
            {leafItems.map((i, idx) => (
              <li key={idx}>
                {i.label} → {itemScores.find(s => s.id === i.id)?.score.toFixed(2)}
              </li>
            ))}
          </ul>

          <h3>Raw Score (before penalties): {rawScore.toFixed(2)}</h3>
          <h3>Penalty Breakdown:</h3>
          <p>Excess Healthy: {excessHealthy} × -1 = -{excessHealthy}</p>
          <p>Excess Unhealthy: {excessUnhealthy} × -2 = -{excessUnhealthy * 2}</p>
          <h3>Total Penalty: {penalty}</h3>
          <h3>Final Score (0–10): {finalScore.toFixed(2)}</h3>

          {allSimulationResults.length > 0 && (
            <h3>
              Overall Karma Score (average of {allSimulationResults.length} runs):{" "}
              {(allSimulationResults.reduce((a, b) => a + b, 0) / allSimulationResults.length).toFixed(2)}
            </h3>
          )}

          {/*  New Simulation now returns to hub */}
          <NewSimulation onNewSimulation={onReturnToHub} />
        </div>
      ) : (
        <DoneButton onDone={handleDone} />
      )}
    </div>
  );
}
