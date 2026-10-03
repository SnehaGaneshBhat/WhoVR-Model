import React from 'react';
import './scoreboard.css';

type Log = {
  pieceId: string;
  action: string;
  correct: boolean;
  score: number;
};

interface Props {
  logs: Log[];
  ignored: number;
  finalScore: number;     // already computed in scoring.ts
  simulations: number[];
  averageScore: number;   // computed in scoring.ts
  overallAverage: number; // computed in scoring.ts
}

const Scoreboard: React.FC<Props> = ({ logs, ignored, finalScore, simulations, averageScore, overallAverage }) => {
  return (
    <div className="scoreboard">
      <h2>Scoreboard</h2>

      {/* Individual results in id:score(correct/wrong) format */}
      <h3>Results per piece</h3>
      <ul>
        {logs.map((log, idx) => (
          <li key={idx}>
            {log.pieceId}:{log.score.toFixed(2)}({log.correct ? 'correct' : 'wrong'})
          </li>
        ))}
      </ul>

      {/* Average before penalty */}
      <h3>Average Score before penalty: {averageScore.toFixed(2)}</h3>

      {/* Penalty details */}
      {ignored > 0 && <p>Ignored pieces: {ignored}</p>}

      {/* Final score */}
      <h3>Final Score (this run): {finalScore.toFixed(2)}</h3>
      {finalScore === 10 && <p>🎉 Perfect! All trash correctly placed!</p>}

      {/* Simulation history */}
      <h3>Previous Simulations:</h3>
      <ul>
        {simulations.map((score, idx) => (
          <li key={idx}>
            Simulation {idx + 1}: {score.toFixed(2)}
          </li>
        ))}
      </ul>

      {simulations.length > 0 && (
        <h3>Overall Average Score: {overallAverage.toFixed(2)}</h3>
      )}
    </div>
  );
};

export default Scoreboard;