export type PlayerId = "me" | "ai";
export type Screen = "nickname" | "start" | "select" | "powerSelect" | "game" | "result";
export type Phase = "rolling" | "moving" | "bonusRolling" | "pathChoice" | "turnEndReady" | "gameOver";
export type PieceState = "start" | "board" | "finished";
export type PathName = "outer" | "diagFromTopRight" | "diagFromTopLeft";

export type CardKind =
  | "immortal"
  | "reroll"
  | "copyMove"
  | "doOrFold"
  | "highRoll"
  | "freeRide"
  | "turbo"
  | "moveBack"
  | "swap"
  | "trap"
  | "pullBehind"
  | "skillBlock"
  | "coordinate"
  | "split"
  | "vipReturn"
  | "finishBlock";

export interface BoardNode {
  id: number;
  name: string;
  x: number;
  y: number;
  role?: "start" | "corner" | "center" | "diagonal";
}

export interface YutResult {
  baseId: "fall" | "backdo" | "do" | "gae" | "geol" | "yut" | "mo";
  id: string;
  name: string;
  move: number;
  probability: number;
  grantsExtraRoll: boolean;
  isFall?: boolean;
  isBackDo?: boolean;
}

export interface Piece {
  id: string;
  playerId: PlayerId;
  state: PieceState;
  nodeId: number;
  path: PathName;
  stackId: string;
  shield: boolean;
  finishBlockedTurns: number;
}

export interface PowerCard {
  id: string;
  kind: CardKind;
  name: string;
  type: "self" | "attack";
  description: string;
  timing: string;
  used: boolean;
  revealed: boolean;
}

export interface Player {
  id: PlayerId;
  name: string;
  animal: string;
  avatarIndex: number;
  finishedCount: number;
  fallCount: number;
  fallRewardGranted: boolean;
  skillBlockedTurns: number;
  powerCards: PowerCard[];
  usedCards: string[];
}

export interface Trap {
  owner: PlayerId;
  nodeId: number;
}

export interface PendingPathChoice {
  pieceId: string;
  resultId: string;
  choices: PathName[];
}

export interface SelectionIntent {
  cardId: string;
  kind: CardKind;
  actor: PlayerId;
  targets: string[];
}

export interface PowerEffect {
  id: string;
  kind: CardKind;
  actor: PlayerId;
  cardName: string;
  text: string;
}

export interface CaptureEffect {
  id: string;
  actor: PlayerId;
  target: PlayerId;
  nodeId: number;
  count: number;
}

export interface RollResultEffect {
  id: string;
  resultName: string;
  baseId: YutResult["baseId"];
  grantsExtraRoll: boolean;
}

export interface GameState {
  screen: Screen;
  players: Record<PlayerId, Player>;
  currentPlayer: PlayerId;
  phase: Phase;
  pieces: Piece[];
  storedResults: YutResult[];
  extraRolls: number;
  captureBonusRolls: number;
  selectedResultId: string | null;
  selectedPieceId: string | null;
  lastRollResult: YutResult | null;
  hiddenRollResult: YutResult | null;
  isThrowing: boolean;
  pendingRerollAvailable: boolean;
  forcedNextRoll: "doOrMo" | "yutOrMo" | null;
  usedPowerThisTurn: boolean;
  traps: Trap[];
  pendingPathChoice: PendingPathChoice | null;
  selectionIntent: SelectionIntent | null;
  turnTimeLeft: number;
  notice: string;
  gameLog: string[];
  winner: PlayerId | null;
  surrenderModalOpen: boolean;
  powerEffect: PowerEffect | null;
  captureEffect: CaptureEffect | null;
  rollResultEffect: RollResultEffect | null;
}
