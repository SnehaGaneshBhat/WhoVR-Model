import React from "react";
import "./WalletChoiceBox.css";

type WalletChoiceBoxProps = {
  onChoose: (choice: "100" | "500") => void;
};

export default function WalletChoiceBox({ onChoose }: WalletChoiceBoxProps) {
  return (
    <div className="wallet-choice-box">
      <p className="wallet-choice-text">What do you want to give the beggar?</p>
      <div className="wallet-choice-buttons">
        <button className="wallet-choice-btn" onClick={() => onChoose("100")}>
          100
        </button>
        <button className="wallet-choice-btn" onClick={() => onChoose("500")}>
          500
        </button>
      </div>
    </div>
  );
}