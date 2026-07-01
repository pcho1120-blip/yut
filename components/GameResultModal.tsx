import ResultExpressionSprite from "@/components/ResultExpressionSprite";
import { GameState, PlayerId } from "@/types/game";

function ResultSide({
  state,
  playerId,
  won,
}: {
  state: GameState;
  playerId: PlayerId;
  won: boolean;
}) {
  const player = state.players[playerId];
  const remainingCards = player.powerCards.filter((card) => !card.used).length;

  return (
    <article className={`result-live-side ${won ? "winner" : "loser"}`}>
      <div className="result-live-podium">
        <ResultExpressionSprite
          index={player.avatarIndex}
          mood={won ? "win" : "lose"}
          className="result-live-character"
        />
      </div>
      <strong>{won ? "승자" : "패자"} · {player.name}</strong>
      <span>{player.animal} · 완주 {player.finishedCount}/4 · 남은 카드 {remainingCards}장</span>
    </article>
  );
}

export default function GameResultModal({ state, onReset }: { state: GameState; onReset: () => void }) {
  const isWin = state.winner === "me";
  const winnerId: PlayerId = state.winner || "ai";
  const loserId: PlayerId = winnerId === "me" ? "ai" : "me";
  const winner = state.players[winnerId];
  const loser = state.players[loserId];

  return (
    <main className={`result-screen ${isWin ? "win" : "lose"}`}>
      <section className="result-live-panel">
        <div className="result-native-overlay result-dynamic-title">
          <span>{isWin ? "승리" : "패배"}</span>
          <p>{winner.name} 승리 · {loser.name} 패배</p>
        </div>

        <div className="result-live-stage">
          <ResultSide state={state} playerId={winnerId} won />
          <div className="result-versus">VS</div>
          <ResultSide state={state} playerId={loserId} won={false} />
        </div>

        <div className="result-actions result-live-actions">
          <button onClick={onReset}>다시 하기</button>
          <button onClick={onReset}>처음으로</button>
        </div>
      </section>
    </main>
  );
}
