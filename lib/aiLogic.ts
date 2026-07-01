import { branchChoices, getDestination, getTravelNodes, stepsToFinish } from "@/lib/boardPaths";
import { GameState, PathName, Piece, PlayerId, YutResult } from "@/types/game";

export function chooseAIPath(state: GameState, piece: Piece, result: YutResult): PathName {
  const choices = branchChoices(piece.nodeId);
  if (choices.length === 1) return choices[0];
  const enemyNodes = new Set(state.pieces.filter((p) => p.playerId === "me" && p.state === "board").map((p) => p.nodeId));
  const capture = choices.find((path) => enemyNodes.has(getDestination(path, piece.nodeId, result.move).nodeId));
  if (capture) return capture;
  return choices
    .slice()
    .sort((a, b) => stepsToFinish(a, piece.nodeId) - stepsToFinish(b, piece.nodeId))[0];
}

export function chooseBestMove(state: GameState, playerId: PlayerId) {
  const foe = playerId === "me" ? "ai" : "me";
  const pieces = state.pieces.filter((piece) => piece.playerId === playerId && piece.state !== "finished");
  const enemies = state.pieces.filter((piece) => piece.playerId === foe && piece.state === "board");
  const allies = state.pieces.filter((piece) => piece.playerId === playerId && piece.state === "board");
  const choices = state.storedResults.flatMap((result) =>
    pieces.filter((piece) => !(piece.state === "start" && result.move <= 0)).map((piece) => {
      const path = piece.state === "start" ? "outer" : chooseAIPath(state, piece, result);
      const dest = getDestination(path, piece.state === "start" ? -1 : piece.nodeId, result.move);
      const travelNodes = getTravelNodes(path, piece.state === "start" ? -1 : piece.nodeId, result.move);
      const hitsTrap = state.traps.some((trap) => trap.owner !== playerId && travelNodes.includes(trap.nodeId));
      const movingStackSize = piece.state === "board" ? pieces.filter((p) => p.state === "board" && p.stackId === piece.stackId).length : 1;
      const stacksOnDestination = !dest.finished && allies.filter((ally) => ally.nodeId === dest.nodeId && ally.stackId !== piece.stackId).length;
      let score = 10 + result.move * 10;
      if (dest.finished) score += 800;
      if (!dest.finished && enemies.some((enemy) => enemy.nodeId === dest.nodeId)) score += 600;
      if (stacksOnDestination) score += 420 + stacksOnDestination * 80;
      if (movingStackSize > 1) score += movingStackSize * 120;
      if (hitsTrap) score -= 1200;
      if (piece.state === "board") score += 160 - stepsToFinish(path, piece.nodeId) * 4;
      if (piece.state === "start" && allies.length > 0) score -= 35;
      return { piece, result, path, score };
    }),
  );
  return choices.sort((a, b) => b.score - a.score)[0] || null;
}

export function chooseAIMove(state: GameState) {
  return chooseBestMove(state, "ai");
}
