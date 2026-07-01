import ResultTray from "@/components/ResultTray";
import YutShape from "@/components/YutShape";
import { GameState } from "@/types/game";

interface Props {
  state: GameState;
  onRoll: () => void;
  onResult: (id: string) => void;
  onEndTurn: () => void;
  onSurrender: () => void;
}

export default function YutThrowArea({ state, onRoll, onResult, onEndTurn, onSurrender }: Props) {
  const canRoll =
    state.currentPlayer === "me" &&
    !state.isThrowing &&
    (state.phase === "rolling" || state.phase === "bonusRolling" || (state.phase === "moving" && state.extraRolls > 0));
  const canEnd = state.currentPlayer === "me" && !state.isThrowing && state.phase === "turnEndReady";
  const helper =
    state.phase === "moving" && state.extraRolls > 0
      ? "저장 결과를 먼저 이동하거나 추가 던지기를 먼저 사용할 수 있습니다."
      : state.phase === "moving"
        ? "저장 결과를 고른 뒤 이동할 말을 선택하세요."
        : state.phase === "turnEndReady"
          ? "모든 결과를 처리했습니다. 턴을 넘겨 주세요."
          : state.currentPlayer === "ai"
            ? "AI가 진행 중입니다."
            : "윷을 던져 결과를 저장하세요.";

  return (
    <footer className="throw-area">
      <div className="throw-actions">
        <button className="roll-button" disabled={!canRoll} onClick={onRoll}>윷 던지기</button>
        <button className="end-turn-button" disabled={!canEnd} onClick={onEndTurn}>턴 넘기기</button>
        <button className="giveup-button" onClick={onSurrender}>포기하기</button>
      </div>
      <div className="latest-result">
        <span>최근 결과</span>
        <YutShape result={state.lastRollResult} rolling={state.isThrowing} compact />
        <b>{state.isThrowing ? "..." : state.lastRollResult?.name || "-"}</b>
        {state.lastRollResult?.grantsExtraRoll && <em>추가 던지기 +1</em>}
      </div>
      <p className="action-helper">{helper}</p>
      <ResultTray state={state} onSelect={onResult} />
      <div className="game-log">
        {state.gameLog.map((log, index) => <p key={`${log}-${index}`}>{log}</p>)}
      </div>
    </footer>
  );
}
