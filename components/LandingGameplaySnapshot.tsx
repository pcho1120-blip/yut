import GameBoard from "@/components/GameBoard";
import PlayerPanel from "@/components/PlayerPanel";
import TurnStatusBar from "@/components/TurnStatusBar";
import YutThrowArea from "@/components/YutThrowArea";
import { resultByBaseId } from "@/lib/gameRules";
import { cardCatalog } from "@/lib/powerCards";
import { GameState, Piece, PlayerId, PowerCard } from "@/types/game";

const previewCards = (owner: PlayerId): PowerCard[] =>
  cardCatalog.slice(owner === "me" ? 0 : 7, owner === "me" ? 2 : 9).map((card, index) => ({
    ...card,
    id: `landing-${owner}-${card.kind}-${index}`,
    used: false,
    revealed: owner === "me",
  }));

const pieces: Piece[] = [
  { id: "me-1", playerId: "me", state: "board", nodeId: 17, path: "outer", stackId: "me-stack-1", shield: false, finishBlockedTurns: 0 },
  { id: "me-2", playerId: "me", state: "start", nodeId: -1, path: "outer", stackId: "me-stack-2", shield: false, finishBlockedTurns: 0 },
  { id: "me-3", playerId: "me", state: "start", nodeId: -1, path: "outer", stackId: "me-stack-3", shield: false, finishBlockedTurns: 0 },
  { id: "me-4", playerId: "me", state: "finished", nodeId: 0, path: "outer", stackId: "me-4-finished", shield: false, finishBlockedTurns: 0 },
  { id: "ai-1", playerId: "ai", state: "board", nodeId: 8, path: "outer", stackId: "ai-stack-1", shield: false, finishBlockedTurns: 0 },
  { id: "ai-2", playerId: "ai", state: "board", nodeId: 8, path: "outer", stackId: "ai-stack-1", shield: false, finishBlockedTurns: 0 },
  { id: "ai-3", playerId: "ai", state: "start", nodeId: -1, path: "outer", stackId: "ai-stack-3", shield: false, finishBlockedTurns: 0 },
  { id: "ai-4", playerId: "ai", state: "finished", nodeId: 0, path: "outer", stackId: "ai-4-finished", shield: false, finishBlockedTurns: 0 },
];

const previewResults = [resultByBaseId("do"), resultByBaseId("gae"), resultByBaseId("yut")].map((result, index) => ({
  ...result,
  id: `landing-result-${index}`,
}));

const previewState: GameState = {
  screen: "game",
  currentPlayer: "me",
  phase: "moving",
  players: {
    me: {
      id: "me",
      name: "나",
      animal: "호랑이",
      avatarIndex: 2,
      finishedCount: 1,
      fallCount: 0,
      fallRewardGranted: false,
      skillBlockedTurns: 0,
      powerCards: previewCards("me"),
      usedCards: [],
    },
    ai: {
      id: "ai",
      name: "상대",
      animal: "토끼",
      avatarIndex: 3,
      finishedCount: 1,
      fallCount: 0,
      fallRewardGranted: false,
      skillBlockedTurns: 0,
      powerCards: previewCards("ai"),
      usedCards: [],
    },
  },
  pieces,
  storedResults: previewResults,
  extraRolls: 1,
  captureBonusRolls: 0,
  selectedResultId: previewResults[1].id,
  selectedPieceId: null,
  lastRollResult: previewResults[2],
  hiddenRollResult: null,
  isThrowing: false,
  pendingRerollAvailable: true,
  forcedNextRoll: null,
  usedPowerThisTurn: false,
  traps: [{ owner: "me", nodeId: 12 }],
  pendingPathChoice: null,
  selectionIntent: null,
  turnTimeLeft: 24,
  notice: "저장 결과를 고른 뒤 이동할 말을 선택하세요.",
  gameLog: ["잡기 성공! 보너스 던지기 +1", "나: 윷 기록", "상대가 함정에 접근 중입니다."],
  winner: null,
  surrenderModalOpen: false,
  powerEffect: null,
  captureEffect: null,
  rollResultEffect: null,
};

const stacks = [
  pieces.filter((piece) => piece.stackId === "me-stack-1"),
  pieces.filter((piece) => piece.stackId === "ai-stack-1"),
];

export default function LandingGameplaySnapshot() {
  return (
    <div className="landing-live-game" aria-label="실제 인게임 화면 미리보기">
      <TurnStatusBar state={previewState} />
      <section className="play-layout">
        <PlayerPanel
          side="opponent"
          player={previewState.players.ai}
          pieces={previewState.pieces}
          currentPlayer={previewState.currentPlayer}
          cardsDisabled
          phase={previewState.phase}
          selectedResultId={previewState.selectedResultId}
          storedResults={previewState.storedResults}
          hasSelectionIntent={false}
          onUseCard={() => {}}
          canUsePower={() => false}
          onPiece={() => {}}
        />
        <GameBoard state={previewState} stacks={stacks} onPiece={() => {}} onNode={() => {}} />
        <PlayerPanel
          side="mine"
          player={previewState.players.me}
          pieces={previewState.pieces}
          currentPlayer={previewState.currentPlayer}
          cardsDisabled
          phase={previewState.phase}
          selectedResultId={previewState.selectedResultId}
          storedResults={previewState.storedResults}
          hasSelectionIntent={false}
          onUseCard={() => {}}
          canUsePower={() => false}
          onPiece={() => {}}
        />
      </section>
      <YutThrowArea state={previewState} onRoll={() => {}} onResult={() => {}} onEndTurn={() => {}} onSurrender={() => {}} />
    </div>
  );
}
