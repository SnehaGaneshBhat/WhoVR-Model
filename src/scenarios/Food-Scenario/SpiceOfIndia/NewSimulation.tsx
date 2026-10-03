import React from "react";
import "./NewSimulation.css";

type NewSimulationProps = {
  onNewSimulation: () => void;
};

const NewSimulation: React.FC<NewSimulationProps> = ({ onNewSimulation }) => {
  return (
    <button
      className="new-simulation-button"
      onClick={onNewSimulation}
    >
      New Simulation
    </button>
  );
};

export default NewSimulation;
