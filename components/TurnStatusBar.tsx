import { formatTime } from "@/lib/gameRules";
import { GameState } from "@/types/game";

const phaseLabel = {
  rolling: "던지기",
  moving: "이동",
  bonusRolling: "잡기 보너스",
  pathChoice: "갈림길 선택",
  turnEndReady: "턴 종료 대기",
  gameOver: "게임 종료",
};

export default function TurnStatusBar({ state }: { state: GameState }) {
  return (
    <header className="turn-bar">
      <div className="turn-title">윷능력자</div>
      <div className={`turn-timer ${state.turnTimeLeft <= 10 ? "danger" : ""}`}>{formatTime(state.turnTimeLeft)}</div>
      <div className="turn-info">
        <span>{state.currentPlayer === "me" ? "내 차례" : "상대 차례"}</span>
        <span>{phaseLabel[state.phase]}</span>
        <span>추가 {state.extraRolls}</span>
        <span>잡기 보너스 {state.captureBonusRolls}</span>
      </div>
      <p className="turn-notice">{state.notice}</p>
    </header>
  );
}
