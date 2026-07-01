import { GameState } from "@/types/game";

const resultMeta = {
  fall: { symbol: "!", label: "낙" },
  backdo: { symbol: "←", label: "빽도" },
  do: { symbol: "1", label: "도" },
  gae: { symbol: "2", label: "개" },
  geol: { symbol: "3", label: "걸" },
  yut: { symbol: "4", label: "윷" },
  mo: { symbol: "5", label: "모" },
};

export default function ResultTray({ state, onSelect }: { state: GameState; onSelect: (id: string) => void }) {
  const canChoose = state.currentPlayer === "me" && state.phase === "moving" && !state.isThrowing;
  return (
    <div className="result-tray">
      <h3>저장 결과 <span>{state.storedResults.length}</span></h3>
      <div className="result-chip-row">
        {state.storedResults.length === 0 && <span className="empty-result">없음</span>}
        {state.storedResults.map((result) => (
          <button
            key={result.id}
            className={`result-chip ${result.baseId} ${state.selectedResultId === result.id ? "selected" : ""}`}
            disabled={!canChoose}
            onClick={() => onSelect(result.id)}
            aria-label={`${result.name} 선택`}
          >
            <b>{resultMeta[result.baseId].symbol}</b>
            <span>{resultMeta[result.baseId].label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
