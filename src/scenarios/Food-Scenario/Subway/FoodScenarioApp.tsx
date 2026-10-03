import React, { useState } from "react";
import { FoodScenario } from "../../../engine/scenarios/FoodScenario";
import "./FoodScenarioApp.css";
import DoneButton from "./DoneButton";
import NewSimulation from "./NewSimulation";

import backgroundImg from "../../../assets/Food-Scenario/background.jpg";

import potatoImg from "../../../assets/Food-Scenario/potato.png";
import tomatoImg from "../../../assets/Food-Scenario/tomato.png";
import cucumberImg from "../../../assets/Food-Scenario/cucumber.png";
import lettuceImg from "../../../assets/Food-Scenario/lettuce.png";
import onionImg from "../../../assets/Food-Scenario/onion.png";
import redCapsicumImg from "../../../assets/Food-Scenario/red_capsicum.png";
import yellowCapsicumImg from "../../../assets/Food-Scenario/yellow_capsicum.png";

import candyImg from "../../../assets/Food-Scenario/candy_jar.png";
import muffinImg from "../../../assets/Food-Scenario/cupcakes.png";
import cookiesImg from "../../../assets/Food-Scenario/cookies.png";
import sprinklesImg from "../../../assets/Food-Scenario/sprinkles.png";
import wafersImg from "../../../assets/Food-Scenario/wafers.png";

import singleMuffinImg from "../../../assets/Food-Scenario/single_muffin.png";
import singleCookieImg from "../../../assets/Food-Scenario/single_cookie.png";
import singleWafersImg from "../../../assets/Food-Scenario/single_wafers.png";
import candyPouchImg from "../../../assets/Food-Scenario/candy_pouch.png";

import bellImg from "../../../assets/Food-Scenario/bell.png";
import breadImg from "../../../assets/Food-Scenario/bread.png";
import sprinklesBatchImg from "../../../assets/Food-Scenario/sprinkle_batch.png";
import sandwichImg from "../../../assets/Food-Scenario/sandwich.png";

type FoodScenarioAppProps = {
  onReturnToHub: () => void;
  allSimulationResults: number[];
  setAllSimulationResults: React.Dispatch<React.SetStateAction<number[]>>;
};

export default function FoodScenarioApp({
  onReturnToHub,
  allSimulationResults,
  setAllSimulationResults,
}: FoodScenarioAppProps) {
  const [sandwichItems, setSandwichItems] = useState<{id:string,img:string,label:string}[]>([]);
  const [unhealthyItems, setUnhealthyItems] = useState<{id:string,img:string,label:string,multiplier:number}[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);
  const [bellClicked, setBellClicked] = useState(false);

  const foodScenario = new FoodScenario();

  const veggies = [
    { id: "ADD_POTATO", img: potatoImg, label: "Potato", css: "potato" },
    { id: "ADD_TOMATO", img: tomatoImg, label: "Tomato", css: "tomato" },
    { id: "ADD_CUCUMBER", img: cucumberImg, label: "Cucumber", css: "cucumber" },
    { id: "ADD_LETTUCE", img: lettuceImg, label: "Lettuce", css: "lettuce" },
    { id: "ADD_ONION", img: onionImg, label: "Onion", css: "onion" },
    { id: "ADD_RED_CAPSICUM", img: redCapsicumImg, label: "Red Capsicum", css: "red_capsicum" },
    { id: "ADD_YELLOW_CAPSICUM", img: yellowCapsicumImg, label: "Yellow Capsicum", css: "yellow_capsicum" },
    { id: "ADD_SPRINKLES", img: sprinklesImg, label: "Sprinkles", css: "sprinkles" },
  ];

  const unhealthy = [
    { id: "ADD_MUFFIN", img: muffinImg, label: "Muffin", css: "muffin", spawnImg: singleMuffinImg, spawnLabel: "Single Muffin" },
    { id: "ADD_COOKIES", img: cookiesImg, label: "Cookies", css: "cookies", spawnImg: singleCookieImg, spawnLabel: "Single Cookie" },
    { id: "ADD_WAFERS", img: wafersImg, label: "Wafers", css: "wafers", spawnImg: singleWafersImg, spawnLabel: "Single Wafers" },
    { id: "ADD_CANDY", img: candyImg, label: "Candy Jar", css: "candy", spawnImg: candyPouchImg, spawnLabel: "Candy Pouch" },
  ];

  const handleDrop = (id: string) => {
    let item = veggies.find(i => i.id === id);
    if (!item) return;

    if (id === "ADD_SPRINKLES") {
      item = { id: "ADD_SPRINKLES", img: sprinklesBatchImg, label: "Sprinkles Batch", css: "sprinkles_batch" };
    }

    const currentCount = counts[item.id] || 0;
    if (currentCount < 3) {
      setSandwichItems([...sandwichItems, item]);
      setCounts({ ...counts, [item.id]: currentCount + 1 });
    }
  };

  const handleUnhealthyClick = (item: any) => {
    const currentCount = counts[item.id] || 0;
    if (currentCount < 3) {
      const multiplier = currentCount + 1;
      setUnhealthyItems([...unhealthyItems, { id: item.id, img: item.spawnImg, label: item.spawnLabel, multiplier }]);
      setCounts({ ...counts, [item.id]: currentCount + 1 });
    }
  };

  const handleDone = () => {
    setDone(true);
    // Save score into shared results
    setAllSimulationResults([...allSimulationResults, finalScore]);
  };

  const handleUiClick = (label: string) => {
    if (label === "Bell") setBellClicked(true);
    console.log(`${label} clicked`);
  };

  const result = foodScenario.score([
    ...sandwichItems.map(i => i.id),
    ...unhealthyItems.map(i => i.id)
  ]);

  const { itemScores, penalty, rawScore, finalScore, excessHealthy, excessUnhealthy } = result;

  return (
    <div className="food-app" style={{ backgroundImage: `url(${backgroundImg})` }}>
      {/* Veggies */}
      {veggies.map(item => (
        <img key={item.id} src={item.img} alt={item.label}
          className={`food-item ${item.css}`} draggable
          onDragStart={(e) => e.dataTransfer.setData("veggie", item.id)}
        />
      ))}

      {/* Unhealthy items */}
      {unhealthy.map(item => (
        <img key={item.id} src={item.img} alt={item.label}
          className={`food-item ${item.css}`}
          onClick={() => handleUnhealthyClick(item)}
        />
      ))}

      {/* Bell */}
      <img src={bellImg} alt="bell" className="food-item bell"
        onClick={() => handleUiClick("Bell")} />

      {/* Bread drop zone */}
      {bellClicked && !done && (
        <div className="food-item bread-drop"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            const veggieId = e.dataTransfer.getData("veggie");
            handleDrop(veggieId);
          }}
        >
          <img src={breadImg} alt="bread" className="bread-img" />
          {sandwichItems.map((item, idx) => (
            <img key={`${item.id}-${idx}`} src={item.img} alt={item.label} className="sandwich-veggie" />
          ))}
        </div>
      )}

      {/* Final sandwich */}
      {bellClicked && done && (
        <div className="food-item sandwich-final">
          <img src={sandwichImg} alt="sandwich" className="sandwich-img" />
        </div>
      )}

      {/* Render unhealthy spawned items */}
      {unhealthyItems.map((item, idx) => (
        <div key={`${item.id}-${idx}`} className={`unhealthy-spawn ${item.id.toLowerCase()}`}>
          <img src={item.img} alt={item.label} />
          {item.multiplier > 1 && <span className="multiplier-tag">x{item.multiplier}</span>}
        </div>
      ))}

      {/* Scoreboard */}
      {done ? (
        <div className="score-panel">
          <h3>Selected Items & Scores:</h3>
          <ul>
            {sandwichItems.map((i, idx) => (
              <li key={idx}>
                {i.label} → {itemScores.find(s => s.id === i.id)?.score.toFixed(2)}
                                {itemScores.find(s => s.id === i.id)?.score.toFixed(2)}
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

