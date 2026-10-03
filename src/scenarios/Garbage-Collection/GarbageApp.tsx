import React, { useState, useRef } from 'react';
import dryBinImg from '../../assets/Garbage-Collection/dry_bin.png';
import wetBinImg from '../../assets/Garbage-Collection/wet_bin.png';
import bananaImg from '../../assets/Garbage-Collection/banana.png';
import wrapperImg from '../../assets/Garbage-Collection/wrapper.png';
import appleImg from '../../assets/Garbage-Collection/apple.png';
import paperImg from '../../assets/Garbage-Collection/paper.png';
import leavesImg from '../../assets/Garbage-Collection/leaves.png';
import bottlesImg from '../../assets/Garbage-Collection/bottles.png';
import pizzaImg from '../../assets/Garbage-Collection/pizza.png';
import coconutImg from '../../assets/Garbage-Collection/coconut.png';

import { GarbageScenario } from '../../engine/scenarios/GarbageScenario';
import { ActionId } from '../../data/karma_actions';
import { useSessionRecorder } from '../../telemetry/SessionContext';
import { TrigunaProfileBox, Profile, TrigunaStatus } from '../../telemetry/TrigunaProfileBox';

import Player from './Player';
import Scoreboard from './Scoreboard';

import './bins.css';
import './trash.css';
import './scoreboard.css';

type TrashPiece = {
  id: string;
  type: 'dry' | 'wet';
  disgustingness: number;
  img: string;
  cssClass: string;
};

const initialTrash: TrashPiece[] = [
  { id: 'banana', type: 'wet', disgustingness: 8, img: bananaImg, cssClass: 'banana' },
  { id: 'apple', type: 'wet', disgustingness: 7, img: appleImg, cssClass: 'apple' },
  { id: 'wrapper', type: 'dry', disgustingness: 1, img: wrapperImg, cssClass: 'wrapper' },
  { id: 'paper', type: 'dry', disgustingness: 2, img: paperImg, cssClass: 'paper' },
  { id: 'leaves', type: 'dry', disgustingness: 3, img: leavesImg, cssClass: 'leaves' },
  { id: 'bottles', type: 'dry', disgustingness: 3, img: bottlesImg, cssClass: 'bottles' },
  { id: 'pizza', type: 'wet', disgustingness: 9, img: pizzaImg, cssClass: 'pizza' },
  { id: 'coconut', type: 'wet', disgustingness: 4, img: coconutImg, cssClass: 'coconut' }
];

type InteractionLog = {
  pieceId: string;
  action: ActionId;
  correct: boolean;
  score: number;
};

// M3 Decision Deliberation: designer-set latency threshold (see spec's
// tau_DL). This game only has one task type ("choose a bin"), so one
// constant covers everything -- a placeholder until pilot data suggests
// a better value.
const GARBAGE_DECISION_LATENCY_THRESHOLD_SEC = 3.0;

// M1 Level of Focus: designer-set max disruption rate (see spec's
// tau_s). Current game has no disruption mechanic at all (disruption
// count is always 0), so this threshold doesn't do much yet -- it's
// here so the metric is well-formed if disruptions get added later.
const GARBAGE_MAX_DISRUPTION_RATE = 0.2;

const App: React.FC = () => {
  const [trash, setTrash] = useState(initialTrash);
  const [logs, setLogs] = useState<InteractionLog[]>([]);
  const [carriedTrash, setCarriedTrash] = useState<TrashPiece | null>(null);
  const [playerTarget, setPlayerTarget] = useState<{ x: number; y: number }>();
  const [done, setDone] = useState(false);
  const [simulations, setSimulations] = useState<number[]>([]);
  const [averageScore, setAverageScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [overallAverage, setOverallAverage] = useState(0);

  const [trigunaProfile, setTrigunaProfile] = useState<Profile | null>(null);
  const [trigunaStatus, setTrigunaStatus] = useState<TrigunaStatus>("idle");
  const [trigunaError, setTrigunaError] = useState<string | undefined>(undefined);

  //  Instantiate the GarbageScenario scorer once
  const garbageScorer = new GarbageScenario();
  const recorder = useSessionRecorder();

  // M3 Decision Deliberation: timestamp of when the player picked up
  // the current piece of trash, so we can measure how long they took
  // to decide which bin to drop it in.
  const pickupTimeRef = useRef<number | null>(null);

  const getRelativePosition = (el: HTMLElement) => {
    const station = document.querySelector('.station') as HTMLElement;
    const stationRect = station.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    return {
      x: rect.left - stationRect.left,
      y: rect.top - stationRect.top
    };
  };

  const handleTrashClick = (piece: TrashPiece) => {
    if (carriedTrash) return;

    const el = document.querySelector(`.${piece.cssClass}`) as HTMLElement;
    if (el) {
      const pos = getRelativePosition(el);
      setPlayerTarget(pos);
    }

    setCarriedTrash(piece);
    pickupTimeRef.current = Date.now();
  };

  const handleBinClick = (binType: 'dry' | 'wet') => {
    if (!carriedTrash) return;

    const el = document.querySelector(`.bin.${binType}-bin`) as HTMLElement;
    if (el) {
      const pos = getRelativePosition(el);
      setPlayerTarget(pos);

      const correct = carriedTrash.type === binType;
      const animClass = correct ? 'pulse' : 'shake';
      el.classList.add(animClass);
      setTimeout(() => el.classList.remove(animClass), 400);

      const action: ActionId = correct
        ? (carriedTrash.type === 'wet' ? 'DISPOSE_WET_CORRECT' : 'DISPOSE_DRY_CORRECT')
        : (carriedTrash.type === 'wet' ? 'DISPOSE_WET_WRONG' : 'DISPOSE_DRY_WRONG');

      const decisionLatencySec = pickupTimeRef.current !== null
        ? (Date.now() - pickupTimeRef.current) / 1000
        : 0;

      recorder.logDecision({
        decision_id: `garbage_${carriedTrash.id}`,
        decision_latency: decisionLatencySec,
        latency_threshold: GARBAGE_DECISION_LATENCY_THRESHOLD_SEC,
        option_switch_count: 0, // current UI has no way to switch bins before committing
        num_options_available: 2, // wet bin, dry bin
      });

      // M1 Level of Focus / M5 Effort Distribution / M8 Activity
      // Patterns: each pickup-to-disposal cycle is this scenario's
      // "task." disgustingness (already tracked per piece) doubles as
      // task_difficulty. There's currently no way to abandon a piece
      // mid-carry, so completion_status is always 'complete' and
      // disruption_count is always 0.
      const taskDifficulty = Math.min(1.0, Math.max(0.1, carriedTrash.disgustingness / 10));
      recorder.logTaskActiveWindow({
        task_id: carriedTrash.id,
        completion_status: "complete",
        disruption_count: 0,
        time_on_task: decisionLatencySec,
        t_s: GARBAGE_MAX_DISRUPTION_RATE,
        task_difficulty: taskDifficulty,
      });

      // M6 Post-Trigger Behavioral Consistency: correct placement is a
      // clean "gain" trigger, incorrect placement a "failure" trigger --
      // no forced interpretation needed here, unlike the wallet scenario.
      recorder.logTrigger({
        trigger_id: `garbage_trigger_${carriedTrash.id}`,
        trigger_type: correct ? "gain" : "failure",
      });

      pickupTimeRef.current = null;

      //  Use GarbageScenario.score instead of scoreTrashAction
      const pieceScore = garbageScorer.score(action, carriedTrash.disgustingness, carriedTrash.type, correct);

      setLogs(prev => [
        ...prev,
        {
          pieceId: carriedTrash.id,
          action,
          correct,
          score: pieceScore
        }
      ]);

      setCarriedTrash(null);
    }
  };

  const onPlayerArrivedAtTarget = () => {
    if (carriedTrash) {
      setTrash(prev => prev.filter(t => t.id !== carriedTrash.id));
    }
  };

  const handleDone = async () => {
    setDone(true);

    let avg = logs.length > 0
      ? logs.reduce((sum, log) => sum + log.score, 0) / logs.length
      : 0;

    const allPlaced = logs.length === initialTrash.length;
    const allCorrect = logs.every(log => log.correct);

    let final: number;

    if (allPlaced && allCorrect) {
      final = 10;
      avg = 10;
    } else {
      const penaltyPerIgnored = 0.5;
      const ignorancePenalty = trash.length * penaltyPerIgnored;
      final = Math.max(0, avg - ignorancePenalty);
    }

    console.log("=== Garbage Collection Final Simulation ===");
    console.log("Logs Count:", logs.length);
    console.log("Average Score:", avg.toFixed(2));
    console.log("Ignored Pieces:", trash.length);
    console.log("All Placed:", allPlaced);
    console.log("All Correct:", allCorrect);
    console.log("Final Score:", final.toFixed(2));
    console.log("==========================================");

    setAverageScore(avg);
    setFinalScore(final);
    setSimulations(prev => {
      const updated = [...prev, final];
      const overall = updated.reduce((a, b) => a + b, 0) / updated.length;
      setOverallAverage(overall);
      return updated;
    });

    // Ends this scenario's session (karma score above is unaffected --
    // this is the separate, independent Triguna profile), then starts
    // a fresh session so a "New Simulation" round keeps being tracked.
    setTrigunaStatus("loading");
    try {
      const profile = await recorder.endSession();
      setTrigunaProfile(profile);
      setTrigunaStatus("done");
      await recorder.startSession("garbage");
    } catch (err) {
      setTrigunaError(err instanceof Error ? err.message : "Unknown error");
      setTrigunaStatus("error");
    }
  };

  const handleNewSimulation = () => {
    setTrash(initialTrash);
    setLogs([]);
    setCarriedTrash(null);
    setPlayerTarget(undefined);
    setDone(false);
    setAverageScore(0);
    setFinalScore(0);
    setTrigunaProfile(null);
    setTrigunaStatus("idle");
    setTrigunaError(undefined);
  };

  return (
    <div className="station">
      <Player target={playerTarget} onArrived={onPlayerArrivedAtTarget} />

      <img
        src={dryBinImg}
        alt="Dry Bin"
        className="bin dry-bin"
        onClick={() => handleBinClick('dry')}
      />

      <img
        src={wetBinImg}
        alt="Wet Bin"
        className="bin wet-bin"
        onClick={() => handleBinClick('wet')}
      />

      {trash.map(piece => (
        <img
          key={piece.id}
          src={piece.img}
          alt={piece.id}
          onClick={() => handleTrashClick(piece)}
          className={`trash-piece ${piece.cssClass} ${carriedTrash ? 'disabled' : ''}`}
        />
      ))}

      {!done && (
        <button className="done-button" onClick={handleDone}>
          Done
        </button>
      )}

      {done && (
        <div>
          <Scoreboard
            logs={logs}
            ignored={trash.length}
            finalScore={finalScore}
            simulations={simulations}
            averageScore={averageScore}
            overallAverage={overallAverage}
          />
          <TrigunaProfileBox
            status={trigunaStatus}
            profile={trigunaProfile}
            errorMessage={trigunaError}
          />
          <button className="new-simulation-button" onClick={handleNewSimulation}>
            New Simulation
          </button>
        </div>
      )}
    </div>
  );
};

export default App;