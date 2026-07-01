import CharacterPortrait from "@/components/CharacterPortrait";
import YutShape from "@/components/YutShape";
import { boardNodes, getNode } from "@/lib/boardPaths";
import { GameState, Piece } from "@/types/game";

interface Props {
  state: GameState;
  stacks: Piece[][];
  onPiece: (pieceId: string) => void;
  onNode: (nodeId: number) => void;
}

function boardPoint(x: number, y: number) {
  return {
    x,
    y,
  };
}

export default function GameBoard({ state, stacks, onPiece, onNode }: Props) {
  const movingPieceSelectable = state.currentPlayer === "me" && state.phase === "moving" && !!state.selectedResultId && !state.isThrowing;
  const trapTargetSelectable = state.currentPlayer === "me" && state.selectionIntent?.kind === "trap" && !state.isThrowing;

  const isCardTargetSelectable = (stack: Piece[]) => {
    const intent = state.selectionIntent;
    const head = stack[0];
    if (!intent || state.currentPlayer !== "me" || state.isThrowing || !head) return false;
    if (intent.kind === "trap") return false;
    if (intent.kind === "immortal" || intent.kind === "turbo") return head.playerId === intent.actor;
    if (intent.kind === "freeRide") return intent.targets.length === 0 ? false : head.playerId === intent.actor;
    if (intent.kind === "moveBack" || intent.kind === "vipReturn" || intent.kind === "finishBlock") return head.playerId !== intent.actor;
    if (intent.kind === "swap" || intent.kind === "pullBehind") return intent.targets.length === 0 ? head.playerId === intent.actor : head.playerId !== intent.actor;
    if (intent.kind === "coordinate") return head.playerId !== intent.actor && !intent.targets.includes(head.id);
    if (intent.kind === "split") return head.playerId !== intent.actor && stack.length >= 2;
    return false;
  };

  return (
    <section className="board-stage">
      <div className="board-image-wrap">
        <img src="/assets/generated/yut-board-final.png" alt="윷놀이판" className="board-image" />
        {boardNodes.map((node) => (
          (() => {
            const point = boardPoint(node.x, node.y);
            return (
              <button
                key={node.id}
                className={`node-hit ${node.role || ""} ${trapTargetSelectable ? "targetable" : ""} ${state.traps.some((trap) => trap.nodeId === node.id) ? "trap" : ""}`}
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
                onClick={() => onNode(node.id)}
                aria-label={node.name}
              />
            );
          })()
        ))}
        {stacks.map((stack) => {
          const head = stack[0];
          const node = getNode(head.nodeId);
          const point = boardPoint(node.x, node.y);
          const avatarIndex = state.players[head.playerId].avatarIndex;
          const selectable = isCardTargetSelectable(stack) || (movingPieceSelectable && head.playerId === "me");
          return (
            <button
              key={head.stackId}
              className={`piece-token ${head.playerId} ${selectable ? "selectable" : ""}`}
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
              onClick={() => onPiece(head.id)}
              aria-label="말 선택"
            >
              <span className="piece-pawn-core">
                <CharacterPortrait index={avatarIndex} className="piece-character" />
              </span>
              {stack.length > 1 && <b>x{stack.length}</b>}
              {stack.some((piece) => piece.shield) && <em>방패</em>}
            </button>
          );
        })}
        {state.isThrowing && (
          <div className="board-yut-throw" aria-hidden="true">
            <YutShape result={state.hiddenRollResult || state.lastRollResult} rolling />
          </div>
        )}
        {state.rollResultEffect && (
          <div key={state.rollResultEffect.id} className={`roll-result-pop ${state.rollResultEffect.baseId}`} aria-live="polite">
            <strong>{state.rollResultEffect.resultName}</strong>
            {state.rollResultEffect.grantsExtraRoll && <span>추가 던지기</span>}
          </div>
        )}
        {state.captureEffect && (
          (() => {
            const node = getNode(state.captureEffect.nodeId);
            const point = boardPoint(node.x, node.y);
            return (
              <div
                key={state.captureEffect.id}
                className={`capture-effect ${state.captureEffect.actor}`}
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
                aria-hidden="true"
              >
                <span>잡았다!</span>
                <b>+보너스</b>
                <i />
              </div>
            );
          })()
        )}
      </div>
    </section>
  );
}
