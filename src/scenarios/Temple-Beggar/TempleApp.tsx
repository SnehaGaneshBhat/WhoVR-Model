import React, { useState, useRef } from "react";
import templeBg from "../../assets/Temple-Beggar/background.jpg";

import { WalletScenario } from "../../engine/scenarios/TempleScenario";
import type { ActionId } from "../../data/karma_actions";
import { useSessionRecorder } from "../../telemetry/SessionContext";
import { TrigunaProfileBox, Profile, TrigunaStatus } from "../../telemetry/TrigunaProfileBox";

import Beggar from "./Beggar";
import Person from "./Person";
import HistoryBox from "./HistoryBox";
import ZoomScene from "./ZoomScene";

import {
  appContainerStyle,
  charactersRowStyle,
  bottomBarStyle,
  newSimulationButtonStyleMain,
  doneButtonStyleMain,
  newSimulationButtonStyleZoom,
  doneButtonStyleZoom,
} from "./styles";

export default function TempleApp() {
  const [selectedAction, setSelectedAction] = useState<ActionId | null>(null);
  const [karmaScore, setKarmaScore] = useState<number | null>(null);
  const [rounds, setRounds] = useState<{ action: ActionId; score: number }[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [showScoreBox, setShowScoreBox] = useState(false);
  const [locked, setLocked] = useState(false);
  const [zoomedBgOn, setZoomedBgOn] = useState(false);
  const [simulations, setSimulations] = useState<
    { id: number; rounds: { action: ActionId; score: number }[]; avg: number }[]
  >([]);

  const beggarRef = useRef<HTMLDivElement>(null);
  const [nearBeggar, setNearBeggar] = useState(false);

  const [trigunaProfile, setTrigunaProfile] = useState<Profile | null>(null);
  const [trigunaStatus, setTrigunaStatus] = useState<TrigunaStatus>("idle");
  const [trigunaError, setTrigunaError] = useState<string | undefined>(undefined);

  // ✅ Instantiate WalletScenario scorer once
  const walletScorer = new WalletScenario();
  const recorder = useSessionRecorder();

  // M7 Dharmic Orientation mapping for this scenario: GIVE_NOTE and
  // PAY_FROM_POCKET are the only actions that cost the player something
  // AND are prosocial -- TAKE_NOTE and IGNORE are the only costless
  // options, and neither is prosocial. This scenario has no time-horizon
  // dimension (no short-term/long-term choice), so chosen_is_long_term
  // is always null.
  //
  // NOTE: because prosocial and costly are the exact same two actions
  // here (and non-prosocial and costless are the exact same other two),
  // M7's cost-sensitivity submetric will behave close to a fixed
  // constant rather than genuinely varying by player -- it can't
  // distinguish "generous even without needing to sacrifice" from
  // "generous only when it costs something," because this game doesn't
  // currently have a free-to-give or a costly-but-selfish option. Worth
  // flagging to whoever reviews the calibration data.
  const PROSOCIAL_ACTIONS: ActionId[] = ["GIVE_NOTE", "PAY_FROM_POCKET"];
  const COSTLY_ACTIONS: ActionId[] = ["GIVE_NOTE", "PAY_FROM_POCKET"];

  // M6 Post-Trigger Behavioral Consistency: this scenario has no
  // built-in loss/gain event the way most games do, so we interpret
  // giving something up as a "loss" trigger for the player and keeping
  // a note as a "gain" trigger. IGNORE isn't mapped -- nothing actually
  // changes hands, so there's no clear trigger to tag it as.
  const TRIGGER_MAP: Partial<Record<ActionId, "loss" | "gain">> = {
    GIVE_NOTE: "loss",
    PAY_FROM_POCKET: "loss",
    TAKE_NOTE: "gain",
  };

  const handleAction = (action: ActionId) => {
    if (locked) return;
    setSelectedAction(action);

    recorder.logGoalSelection({
      goal_id: `wallet_choice_${rounds.length + 1}`,
      chosen_is_prosocial: PROSOCIAL_ACTIONS.includes(action),
      has_cost: COSTLY_ACTIONS.includes(action),
      chosen_is_long_term: null,
    });

    const triggerType = TRIGGER_MAP[action];
    if (triggerType) {
      recorder.logTrigger({
        trigger_id: `wallet_trigger_${rounds.length + 1}`,
        trigger_type: triggerType,
      });
    }

    const allActions = [...rounds.map(r => r.action), action];
    const result = walletScorer.score(allActions);

    const displayScore = parseFloat(result.total.toFixed(1));

    const newRounds = [...rounds, { action, score: displayScore }];
    setRounds(newRounds);

    const sum = newRounds.reduce((acc, r) => acc + r.score, 0);
    const avg = sum / newRounds.length;

    setTotalScore(avg);
    setKarmaScore(displayScore);
  };

  const handleDone = async () => {
    if (rounds.length === 0) {
      handleAction("IGNORE");
    }
    setShowScoreBox(true);
    setLocked(true);

    // Ends this scenario's session (karma score above is unaffected --
    // this is the separate, independent Triguna profile), then starts
    // a fresh session so a "New Simulation" round keeps being tracked.
    setTrigunaStatus("loading");
    try {
      const profile = await recorder.endSession();
      setTrigunaProfile(profile);
      setTrigunaStatus("done");
      await recorder.startSession("temple");
    } catch (err) {
      setTrigunaError(err instanceof Error ? err.message : "Unknown error");
      setTrigunaStatus("error");
    }
  };

  const handleNewSimulation = () => {
    if (rounds.length > 0) {
      const sum = rounds.reduce((acc, r) => acc + r.score, 0);
      const avg = sum / rounds.length;

      setSimulations(prev => [
        ...prev,
        { id: prev.length + 1, rounds, avg }
      ]);
    }

    setRounds([]);
    setTotalScore(0);
    setSelectedAction(null);
    setKarmaScore(null);
    setShowScoreBox(false);
    setLocked(false);
    setZoomedBgOn(false);
    setTrigunaProfile(null);
    setTrigunaStatus("idle");
    setTrigunaError(undefined);
  };

  const handleBeggarClick = () => {
    setZoomedBgOn(true);
  };

  return (
    <>
      {zoomedBgOn ? (
        <ZoomScene
          karmaScore={karmaScore}
          rounds={rounds}
          onAction={handleAction}
        />
      ) : (
        <div
          style={{
            ...appContainerStyle,
            backgroundImage: `url(${templeBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            width: "100vw",
            height: "100vh",
          }}
        >
          <Person
            beggarRef={beggarRef}
            zoomedIn={false}
            onIgnore={() => handleAction("IGNORE")}
            onNearBeggar={setNearBeggar}
          />
          <div style={charactersRowStyle}>
            <div ref={beggarRef}>
              <Beggar
                onClick={handleBeggarClick}
                onDrop={() => { }}
                onDragOver={() => { }}
                triggerHappy={false}
                pumpTrigger={0}
                glow={nearBeggar}
              />
            </div>
          </div>
        </div>
      )}

      <div style={bottomBarStyle}>
        <button
          style={zoomedBgOn ? newSimulationButtonStyleZoom : newSimulationButtonStyleMain}
          onClick={handleNewSimulation}
        >
          New Simulation
        </button>
        <button
          style={zoomedBgOn ? doneButtonStyleZoom : doneButtonStyleMain}
          onClick={handleDone}
        >
          Done
        </button>
      </div>

      {showScoreBox && rounds.length > 0 && (
        <>
          <HistoryBox
            rounds={rounds}
            total={totalScore}
            show={showScoreBox}
            simulations={simulations}
          />
          <TrigunaProfileBox
            status={trigunaStatus}
            profile={trigunaProfile}
            errorMessage={trigunaError}
          />
        </>
      )}
    </>
  );
}