import React, { useRef, useState } from "react";
import "./ZoomScene.css";

import zoomBg from "../../assets/Temple-Beggar/zoom_bg.jpg";
import hundredNoteImg from "../../assets/Temple-Beggar/note_100.png";
import fiveHundredNoteImg from "../../assets/Temple-Beggar/note_500.png";

import Beggar from "./Beggar";
import Note from "./Note";
import Wallet from "./Wallet";
import WalletChoiceBox from "./WalletChoiceBox";
import { useSessionRecorder } from "../../telemetry/SessionContext";

import type { ActionId } from "../../data/karma_actions";

// M3 Decision Deliberation: designer-set latency threshold for the
// 100-vs-500 choice. A placeholder until pilot data suggests a better
// value.
const TEMPLE_CHOICE_LATENCY_THRESHOLD_SEC = 2.0;

type ZoomSceneProps = {
  karmaScore: number | null;
  rounds: { action: ActionId; score: number }[];
  onAction: (action: ActionId, bonus?: number) => void;
};

type FallingNote = {
  id: number;
  top: number;
  left: number;
  kind: "100" | "500";
};

export default function ZoomScene({ karmaScore, rounds, onAction }: ZoomSceneProps) {
  // Loose note visible at start (draggable 100)
  const [noteVisible, setNoteVisible] = useState(true);

  // Wallet counts
  const [walletCount, setWalletCount] = useState(5);      // 100s
  const [wallet500Count, setWallet500Count] = useState(0); // 500s

  // Whether a loose note was stored as 500
  const [noteStoredAs500, setNoteStoredAs500] = useState(false);

  // Visual effects: falling notes with explicit positions
  const [fallingNotes, setFallingNotes] = useState<FallingNote[]>([]);

  // Mood and pump
  const [pumpCount, setPumpCount] = useState(0);
  const [beggarHappy, setBeggarHappy] = useState(false);

  // Incremental bonus for PAY_FROM_POCKET (+0.3 per wallet-given note)
  const [payBonus, setPayBonus] = useState(0);

  // Guards
  const [givingInProgress, setGivingInProgress] = useState(false);
  const [clickCooldown, setClickCooldown] = useState(false);

  // Wallet click counter (to enforce 500 only after 100s are gone)
  const [walletClicks, setWalletClicks] = useState(0);
  const [showChoiceBox, setShowChoiceBox] = useState(false);
  const [choiceMade, setChoiceMade] = useState(false);

  // Wallet position ref to spawn notes exactly from wallet
  const walletRef = useRef<HTMLDivElement | null>(null);

  const recorder = useSessionRecorder();
  // M3 Decision Deliberation: timestamp of when the 100-vs-500 choice
  // box appeared, so we can measure how long the player took to pick.
  const choiceBoxShownAtRef = useRef<number | null>(null);

  // Utility: get wallet coordinates for spawning notes
  const getWalletPosition = () => {
    const el = walletRef.current;
    if (!el) return { top: 0, left: 0 };
    const rect = el.getBoundingClientRect();
    const container = el.closest(".zoom-container") as HTMLElement | null;

    if (!container) return { top: rect.top, left: rect.left };
    const cRect = container.getBoundingClientRect();
    return { top: rect.top - cRect.top, left: rect.left - cRect.left };
  };

  // Spawn a single falling note (100 or 500) from wallet position
  const spawnNoteFromWallet = (kind: "100" | "500") => {
    const { top, left } = getWalletPosition();
    const id = Math.random();
    setFallingNotes((arr) => [...arr, { id, top, left, kind }]);
  };

  // Give a 100 note from wallet
  const give100FromWallet = () => {
    if (givingInProgress || walletCount <= 0) return;

    setGivingInProgress(true);
    setWalletCount((c) => c - 1);
    spawnNoteFromWallet("100");
    setPumpCount((p) => p + 1);
    setBeggarHappy(true);

    const newBonus = payBonus + 0.3;
    setPayBonus(newBonus);
    onAction("PAY_FROM_POCKET", newBonus);

    setTimeout(() => setGivingInProgress(false), 0);
  };

  // Give a 500 note from wallet
  const give500FromWallet = () => {
    if (givingInProgress || wallet500Count <= 0) return;

    setGivingInProgress(true);
    setWallet500Count((c) => c - 1);
    spawnNoteFromWallet("500"); // ✅ show 500 visual
    setPumpCount((p) => p + 1);
    setBeggarHappy(true);

    const newBonus = payBonus + 0.3;
    setPayBonus(newBonus);
    onAction("PAY_FROM_POCKET", newBonus);

    setNoteStoredAs500(false);
    setTimeout(() => setGivingInProgress(false), 0);
  };

  // Wallet click: only give 500 after 100s are gone
  const handleWalletClick = () => {
    if (clickCooldown || givingInProgress) return;
    setClickCooldown(true);

    const newWalletClicks = walletClicks + 1;
    setWalletClicks(newWalletClicks);

    if (noteStoredAs500 && wallet500Count > 0 && !choiceMade) {
      //  only release 500 after 100s are finished
      setShowChoiceBox(true);
      choiceBoxShownAtRef.current = Date.now();
    } else {
      give100FromWallet();
    }

    setTimeout(() => setClickCooldown(false), 150);
  };

  // Drag start for the loose note (100)
  const handleNoteDragStart = (e: React.DragEvent<HTMLImageElement>) => {
    e.dataTransfer.setData("item", "note");
  };

  const handleChoice = (choice: "100" | "500") => {
  setShowChoiceBox(false);

  const latencySec = choiceBoxShownAtRef.current !== null
    ? (Date.now() - choiceBoxShownAtRef.current) / 1000
    : 0;

  recorder.logDecision({
    decision_id: `wallet_choice_box_${Date.now()}`,
    decision_latency: latencySec,
    latency_threshold: TEMPLE_CHOICE_LATENCY_THRESHOLD_SEC,
    option_switch_count: 0, // no way to preview/switch before clicking a button
    num_options_available: 2, // 100 or 500
  });
  choiceBoxShownAtRef.current = null;

  if (choice === "100") {
    give100FromWallet();
  } else {
    give500FromWallet();
  }
};

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, target: "beggar" | "wallet") => {
    e.preventDefault();
    const item = e.dataTransfer.getData("item");
    if (item !== "note") return;

    if (target === "beggar") {
      if (!noteVisible) return;
      setNoteVisible(false);
      setPumpCount((p) => p + 1);
      setBeggarHappy(true);
    
      spawnNoteFromWallet("500");
      onAction("GIVE_NOTE");
    }

    if (target === "wallet") {
      if (!noteVisible) return;
      setNoteVisible(false);
      setWallet500Count((c) => c + 1);
      setNoteStoredAs500(true);
      onAction("TAKE_NOTE");
      return;
    }
  };

  return (
    <div className="zoom-container" style={{ backgroundImage: `url(${zoomBg})` }}>
      {/* Beggar */}
      <div className="zoom-beggar">
        <Beggar
          onDrop={(e) => handleDrop(e, "beggar")}
          onDragOver={(e) => e.preventDefault()}
          triggerHappy={beggarHappy}
          pumpTrigger={pumpCount}
        />
      </div>

      {/* Loose note (draggable 100) */}
      {noteVisible && (
        <div className="zoom-note">
          <Note noteVisible={noteVisible} onDragStart={handleNoteDragStart} />
        </div>
      )}

      {/* Wallet */}
      <div className="zoom-wallet" ref={walletRef}>
        <Wallet
          count={walletCount}
          count500={wallet500Count}
          onClick={handleWalletClick}
          style={{}}
          onDrop={(e) => handleDrop(e, "wallet")}
          onDragOver={(e) => e.preventDefault()}
        />
      </div>

      {/* Falling notes */}
      {fallingNotes.map((n) => (
        <img
          key={n.id}
          src={n.kind === "100" ? hundredNoteImg : fiveHundredNoteImg}
          alt={n.kind === "100" ? "100 Rupee Note" : "500 Rupee Note"}
          className="falling-note"
          style={{
            top: `${n.top}px`,
            left: `${n.left}px`,
          }}
        />
      ))}

     {/*Render choice box*/ }
      {showChoiceBox && !choiceMade && (
     <WalletChoiceBox onChoose={handleChoice} />
      )}

      {/* Karma display */}
      <div className="karma-display">Karma: {karmaScore !== null ? karmaScore : "—"}</div>
    </div>
  );
}
