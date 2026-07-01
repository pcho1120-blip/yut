"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { chooseAIMove, chooseAIPath, chooseBestMove } from "@/lib/aiLogic";
import { branchChoices, getDestination, getTravelNodes, START_NODE, stepsToFinish } from "@/lib/boardPaths";
import { cloneYutResult, getWeightedRandomYutResult, resultByBaseId } from "@/lib/gameRules";
import { animals, dealOpeningCards, rewardCard } from "@/lib/powerCards";
import { CardKind, GameState, PathName, Piece, PlayerId, PowerCard, YutResult } from "@/types/game";

const TURN_SECONDS = 30;
const THROW_MS = 2200;
const AI_STEP_MS = 360;
const AI_END_MS = 220;
const other = (player: PlayerId): PlayerId => (player === "me" ? "ai" : "me");
const uid = () => Math.random().toString(36).slice(2, 9);
const randomOpponentAvatar = (blockedIndex: number) => {
  const candidates = animals.map((_, index) => index).filter((index) => index !== blockedIndex);
  return candidates[Math.floor(Math.random() * candidates.length)] ?? 11;
};

function addLog(state: GameState, line: string) {
  state.gameLog = [line, ...state.gameLog].slice(0, 10);
}

function createPieces(): Piece[] {
  return (["me", "ai"] as PlayerId[]).flatMap((playerId) =>
    Array.from({ length: 4 }, (_, index) => ({
      id: `${playerId}-${index + 1}`,
      playerId,
      state: "start" as const,
      nodeId: -1,
      path: "outer" as PathName,
      stackId: `${playerId}-stack-${index + 1}`,
      shield: false,
      finishBlockedTurns: 0,
    })),
  );
}

function initialGame(): GameState {
  return {
    screen: "start",
    currentPlayer: "me",
    phase: "rolling",
    players: {
      me: {
        id: "me",
        name: "나",
        animal: "호랑이",
        avatarIndex: 2,
        finishedCount: 0,
        fallCount: 0,
        fallRewardGranted: false,
        skillBlockedTurns: 0,
        powerCards: dealOpeningCards("me"),
        usedCards: [],
      },
      ai: {
        id: "ai",
        name: "상대방",
        animal: "돼지",
        avatarIndex: 11,
        finishedCount: 0,
        fallCount: 0,
        fallRewardGranted: false,
        skillBlockedTurns: 0,
        powerCards: dealOpeningCards("ai"),
        usedCards: [],
      },
    },
    pieces: createPieces(),
    storedResults: [],
    extraRolls: 0,
    captureBonusRolls: 0,
    selectedResultId: null,
    selectedPieceId: null,
    lastRollResult: null,
    hiddenRollResult: null,
    isThrowing: false,
    pendingRerollAvailable: false,
    forcedNextRoll: null,
    usedPowerThisTurn: false,
    traps: [],
    pendingPathChoice: null,
    selectionIntent: null,
    turnTimeLeft: TURN_SECONDS,
    notice: "닉네임과 캐릭터를 고르고 시작하세요.",
    gameLog: ["윷능력자에 오신 걸 환영합니다."],
    winner: null,
    surrenderModalOpen: false,
    powerEffect: null,
    captureEffect: null,
    rollResultEffect: null,
  };
}

function cleanBaseText(state: GameState) {
  state.players.me.name = state.players.me.name.trim() || "나";
  state.players.me.animal = animals[state.players.me.avatarIndex] || "호랑이";
  state.players.ai.name = "상대방";
  state.players.ai.animal = animals[state.players.ai.avatarIndex] || "돼지";
  state.notice = "닉네임과 캐릭터를 고르고 시작하세요.";
  state.gameLog = ["윷능력자에 오신 걸 환영합니다."];
  return state;
}
function copyState(prev: GameState): GameState {
  return {
    ...prev,
    players: {
      me: { ...prev.players.me, powerCards: prev.players.me.powerCards.map((card) => ({ ...card })), usedCards: [...prev.players.me.usedCards] },
      ai: { ...prev.players.ai, powerCards: prev.players.ai.powerCards.map((card) => ({ ...card })), usedCards: [...prev.players.ai.usedCards] },
    },
    pieces: prev.pieces.map((piece) => ({ ...piece })),
    storedResults: prev.storedResults.map((result) => ({ ...result })),
    traps: prev.traps.map((trap) => ({ ...trap })),
    gameLog: [...prev.gameLog],
    pendingPathChoice: prev.pendingPathChoice ? { ...prev.pendingPathChoice, choices: [...prev.pendingPathChoice.choices] } : null,
    selectionIntent: prev.selectionIntent ? { ...prev.selectionIntent, targets: [...prev.selectionIntent.targets] } : null,
    powerEffect: prev.powerEffect ? { ...prev.powerEffect } : null,
    captureEffect: prev.captureEffect ? { ...prev.captureEffect } : null,
    rollResultEffect: prev.rollResultEffect ? { ...prev.rollResultEffect } : null,
  };
}

function boardStacks(pieces: Piece[], playerId?: PlayerId) {
  const stacks = new Map<string, Piece[]>();
  pieces
    .filter((piece) => piece.state === "board" && (!playerId || piece.playerId === playerId))
    .forEach((piece) => stacks.set(piece.stackId, [...(stacks.get(piece.stackId) || []), piece]));
  return [...stacks.values()].map((items) => items.sort((a, b) => a.id.localeCompare(b.id)));
}

function canMoveWithResult(piece: Piece, result: YutResult) {
  if (piece.state === "finished") return false;
  if (piece.state === "start" && result.move <= 0) return false;
  return true;
}

function hasExecutableResult(state: GameState, playerId: PlayerId) {
  return state.storedResults.some((result) =>
    state.pieces.some((piece) => piece.playerId === playerId && canMoveWithResult(piece, result)),
  );
}

function powerEffectText(kind: CardKind) {
  const map: Record<CardKind, string> = {
    immortal: "불사 방패 발동!",
    reroll: "다시 던지기!",
    copyMove: "복붙 이동 발동!",
    doOrFold: "도 아니면 모!",
    highRoll: "고점만 본다!",
    freeRide: "무임승차 발동!",
    turbo: "터보 한 칸!",
    moveBack: "후진하세요!",
    swap: "자리 바꾸기!",
    trap: "밟아봐 함정!",
    pullBehind: "내 뒤로 와!",
    skillBlock: "술사 봉인!",
    coordinate: "좌표 오류!",
    split: "합체 해제!",
    vipReturn: "VIP 귀가!",
    finishBlock: "결승점 공사중!",
  };
  return map[kind];
}
export function useYutGame() {
  const [state, setState] = useState<GameState>(() => cleanBaseText(initialGame()));
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const mutate = useCallback((fn: (draft: GameState) => void) => {
    setState((prev) => {
      const draft = copyState(prev);
      fn(draft);
      return draft;
    });
  }, []);

  const startMatch = useCallback((name: string, avatarIndex: number) => {
    mutate((draft) => {
      const next = cleanBaseText(initialGame());
      Object.assign(draft, next);
      const opponentAvatar = randomOpponentAvatar(avatarIndex);
      draft.screen = "powerSelect";
      draft.players.me.name = name.trim() || "나";
      draft.players.me.avatarIndex = avatarIndex;
      draft.players.me.animal = animals[avatarIndex] || "호랑이";
      draft.players.ai.name = "상대방";
      draft.players.ai.avatarIndex = opponentAvatar;
      draft.players.ai.animal = animals[opponentAvatar] || "돼지";
      draft.notice = "초능력을 뽑고 시작하세요.";
      draft.gameLog = ["게임 시작! 초능력 2장이 지급되었습니다.", ...draft.gameLog].slice(0, 10);
    });
  }, [mutate]);

  const beginGame = useCallback(() => {
    mutate((draft) => {
      if (draft.screen !== "powerSelect") return;
      draft.screen = "game";
      draft.notice = "내 차례입니다. 윷을 던져 주세요.";
      draft.gameLog = ["게임 시작! 초능력 2장이 지급되었습니다.", ...draft.gameLog].slice(0, 10);
    });
  }, [mutate]);

  const openCharacterSelect = useCallback(() => mutate((draft) => { draft.screen = "select"; }), [mutate]);
  const goStart = useCallback(() => mutate((draft) => { draft.screen = "start"; }), [mutate]);
  const goNickname = useCallback(() => mutate((draft) => { draft.screen = "nickname"; }), [mutate]);

  const finishTurn = useCallback((draft: GameState, reason?: string) => {
    const ending = draft.currentPlayer;
    draft.pieces.forEach((piece) => {
      if (piece.playerId === ending && piece.finishBlockedTurns > 0) piece.finishBlockedTurns -= 1;
    });
    if (draft.players[ending].skillBlockedTurns > 0) draft.players[ending].skillBlockedTurns -= 1;
    draft.currentPlayer = other(ending);
    draft.phase = "rolling";
    draft.storedResults = [];
    draft.extraRolls = 0;
    draft.captureBonusRolls = 0;
    draft.selectedResultId = null;
    draft.selectedPieceId = null;
    draft.pendingPathChoice = null;
    draft.selectionIntent = null;
    draft.lastRollResult = null;
    draft.hiddenRollResult = null;
    draft.pendingRerollAvailable = false;
    draft.usedPowerThisTurn = false;
    draft.turnTimeLeft = TURN_SECONDS;
    draft.notice = reason || `${draft.players[draft.currentPlayer].name} 차례가 끝났습니다.`;
    addLog(draft, `${draft.players[draft.currentPlayer].name} 턴 종료`);
  }, []);

  const grantFallReward = (draft: GameState, playerId: PlayerId) => {
    const player = draft.players[playerId];
    if (player.fallCount >= 2 && !player.fallRewardGranted) {
      const card = rewardCard(playerId, player.powerCards);
      if (card) player.powerCards.push(card);
      player.fallRewardGranted = true;
      addLog(draft, `${player.name} 낙 2회 보상으로 초능력 1장을 받았습니다.`);
    }
  };

  const handleFall = useCallback((draft: GameState) => {
    const player = draft.currentPlayer;
    draft.players[player].fallCount += 1;
    grantFallReward(draft, player);
    draft.storedResults = [];
    draft.extraRolls = 0;
    draft.captureBonusRolls = 0;
    draft.pendingRerollAvailable = true;
    draft.notice = "낙입니다. 이번 차례는 아쉽게 넘어갑니다.";
    addLog(draft, `${draft.players[player].name}: 낙`);
    finishTurn(draft, "낙이 나와 턴을 넘깁니다.");
  }, [finishTurn]);

  const setReadyIfDone = useCallback((draft: GameState) => {
    if (draft.winner || draft.isThrowing) return;
    if (draft.storedResults.length === 0 && draft.extraRolls === 0 && draft.captureBonusRolls === 0 && !draft.pendingPathChoice) {
      draft.phase = "turnEndReady";
      if (draft.currentPlayer === "me") draft.notice = "모든 결과를 처리했습니다. 턴을 넘겨 주세요.";
      else draft.notice = "AI가 턴을 마무리합니다.";
      return;
    }
    if (
      draft.storedResults.length > 0 &&
      draft.extraRolls === 0 &&
      draft.captureBonusRolls === 0 &&
      !draft.pendingPathChoice &&
      !hasExecutableResult(draft, draft.currentPlayer)
    ) {
      draft.phase = "turnEndReady";
      draft.selectedResultId = null;
      draft.selectedPieceId = null;
      draft.notice =
        draft.currentPlayer === "me"
          ? "이동할 수 없는 결과만 남았습니다. 턴을 넘겨 주세요."
          : "AI가 이동할 수 없는 결과만 가지고 있어 턴을 넘깁니다.";
      return;
    }
    if (draft.storedResults.length > 0 && !draft.pendingPathChoice) {
      enterMovingPhase(draft);
      return;
    }
    if (draft.extraRolls > 0) {
      draft.phase = "rolling";
      draft.notice = "추가 던지기가 남았습니다. 윷을 한 번 더 던져 주세요.";
    }
  }, []);

  const enterMovingPhase = (draft: GameState, notice?: string) => {
    draft.phase = "moving";
    if (draft.storedResults.length === 1) {
      draft.selectedResultId = draft.storedResults[0].id;
      draft.notice = notice || `${draft.storedResults[0].name} 선택됨. 이동할 말을 고르세요.`;
      return;
    }
    draft.notice = notice || "저장 결과를 선택하고 이동할 말을 고르세요.";
  };

  const applyFinish = (draft: GameState, moving: Piece[]) => {
    const owner = moving[0]?.playerId;
    if (!owner) return;
    moving.forEach((piece) => {
      piece.state = "finished";
      piece.nodeId = START_NODE;
      piece.path = "outer";
      piece.stackId = `${piece.id}-finished`;
    });
    draft.players[owner].finishedCount = draft.pieces.filter((piece) => piece.playerId === owner && piece.state === "finished").length;
    addLog(draft, `${draft.players[owner].name} 말 ${moving.length}개 완주!`);
    draft.notice = `${draft.players[owner].name} 말 ${moving.length}개 완주!`;
    if (draft.players[owner].finishedCount >= 4) {
      draft.winner = owner;
      draft.phase = "gameOver";
      draft.screen = "result";
      draft.notice = `${draft.players[owner].name} 승리!`;
    }
  };

  const applyTrap = (draft: GameState, moving: Piece[], travelNodes?: number[]) => {
    const head = moving[0];
    if (!head || head.state !== "board") return;
    const steppedNodes = travelNodes?.length ? travelNodes : [head.nodeId];
    const trap = draft.traps.find((item) => item.owner !== head.playerId && steppedNodes.includes(item.nodeId));
    if (!trap) return;
    moving.forEach((piece) => {
      piece.nodeId = -1;
      piece.path = "outer";
      piece.state = "start";
      piece.stackId = `${piece.id}-${uid()}`;
    });
    draft.traps = draft.traps.filter((item) => item !== trap);
    addLog(draft, "함정 발동! 지나가던 말이 출발점으로 돌아갔습니다.");
    draft.notice = "함정 발동! 말이 출발점으로 돌아갔습니다.";
  };

  const applyCapture = (draft: GameState, mover: PlayerId, moving: Piece[]) => {
    const head = moving[0];
    if (!head || head.state !== "board") return;
    const enemies = boardStacks(draft.pieces, other(mover)).filter((stack) => stack[0].nodeId === head.nodeId);
    enemies.forEach((stack) => {
      if (stack.some((piece) => piece.shield)) {
        stack.forEach((piece) => (piece.shield = false));
        addLog(draft, "불사 방패가 잡기를 막았습니다.");
        return;
      }
      const captureNodeId = head.nodeId;
      const capturedCount = stack.length;
      stack.forEach((piece) => {
        piece.state = "start";
        piece.nodeId = -1;
        piece.path = "outer";
        piece.stackId = `${piece.id}-${uid()}`;
      });
      draft.captureBonusRolls += 1;
      draft.captureEffect = {
        id: `capture-${uid()}`,
        actor: mover,
        target: other(mover),
        nodeId: captureNodeId,
        count: capturedCount,
      };
      addLog(draft, "잡기 성공! 보너스 던지기 +1");
      draft.notice = "상대 말을 잡았습니다. 보너스 던지기를 얻었습니다.";
    });
  };

  const applyStacking = (draft: GameState, owner: PlayerId, moving: Piece[]) => {
    const head = moving[0];
    if (!head || head.state !== "board") return;
    const allies = boardStacks(draft.pieces, owner).filter((stack) => stack[0].nodeId === head.nodeId && stack[0].stackId !== head.stackId);
    allies.flat().forEach((piece) => {
      piece.stackId = head.stackId;
      piece.path = head.path;
    });
    if (allies.length) {
      addLog(draft, "같은 칸의 내 말을 업었습니다.");
      draft.notice = "같은 칸의 내 말을 업었습니다.";
    }
  };

  const moveStack = useCallback((draft: GameState, pieceId: string, result: YutResult, pathChoice?: PathName) => {
    const piece = draft.pieces.find((item) => item.id === pieceId);
    if (!piece || piece.playerId !== draft.currentPlayer || piece.state === "finished") return false;
    if (!canMoveWithResult(piece, result)) return false;

    if (piece.state === "board" && !pathChoice && result.move > 0) {
      const choices = branchChoices(piece.nodeId);
      if (choices.length > 1 && draft.currentPlayer === "me") {
        draft.pendingPathChoice = { pieceId, resultId: result.id, choices };
        draft.phase = "pathChoice";
        draft.notice = "어느 길로 이동할까요?";
        return false;
      }
    }

    const path = pathChoice || (piece.state === "start" ? "outer" : piece.path);
    const moving = piece.state === "start" ? [piece] : draft.pieces.filter((item) => item.stackId === piece.stackId && item.state === "board");
    const fromNode = piece.state === "start" ? -1 : piece.nodeId;
    const dest = getDestination(path, fromNode, result.move);
    const travelNodes = getTravelNodes(path, fromNode, result.move);

    const routeTrap = draft.traps.find((item) => item.owner !== piece.playerId && travelNodes.includes(item.nodeId));
    if (routeTrap) {
      moving.forEach((item) => {
        item.state = "board";
        item.nodeId = routeTrap.nodeId;
        item.path = path;
      });
      applyTrap(draft, moving, travelNodes);
      return true;
    }

    if (dest.finished) {
      if (moving.some((item) => item.finishBlockedTurns > 0)) {
        const before = getDestination(path, fromNode, Math.max(0, stepsToFinish(path, fromNode) - 1));
        moving.forEach((item) => {
          item.state = "board";
          item.nodeId = before.nodeId;
          item.path = before.path;
        });
        addLog(draft, "결승점 공사중! 이번 골인은 막혔습니다.");
      } else {
        applyFinish(draft, moving);
        return true;
      }
    } else {
      moving.forEach((item) => {
        item.state = dest.nodeId < 0 ? "start" : "board";
        item.nodeId = dest.nodeId;
        item.path = dest.path;
      });
    }

    applyTrap(draft, moving, travelNodes);
    applyCapture(draft, piece.playerId, moving);
    applyStacking(draft, piece.playerId, moving);
    return true;
  }, []);

  const finishRoll = useCallback(() => {
    mutate((draft) => {
      if (!draft.hiddenRollResult) return;
      const result = draft.hiddenRollResult;
      draft.hiddenRollResult = null;
      draft.isThrowing = false;
      draft.lastRollResult = result;
      draft.pendingRerollAvailable = true;
      draft.rollResultEffect = {
        id: `roll-${uid()}`,
        resultName: result.name,
        baseId: result.baseId,
        grantsExtraRoll: result.grantsExtraRoll,
      };

      if (result.isFall) {
        handleFall(draft);
        return;
      }

      draft.storedResults.push(result);
      addLog(draft, `${draft.players[draft.currentPlayer].name}: ${result.name} 기록`);
      if (result.grantsExtraRoll) {
        draft.extraRolls += 1;
        draft.notice = `${result.name}! 추가 던지기 +1`;
      } else {
        draft.notice = `${result.name} 결과가 저장되었습니다. 이동할 말을 고르세요.`;
      }

      const shouldAutoEnterFromStart =
        draft.currentPlayer === "me" &&
        result.move > 0 &&
        !result.grantsExtraRoll &&
        !draft.pieces.some((piece) => piece.playerId === "me" && piece.state === "board");
      const firstStartPiece = draft.pieces.find((piece) => piece.playerId === "me" && piece.state === "start");
      if (shouldAutoEnterFromStart && firstStartPiece) {
        const moved = moveStack(draft, firstStartPiece.id, result);
        if (moved) {
          consumeResultAndCheck(draft, result.id);
          return;
        }
      }

      if (draft.captureBonusRolls > 0 && draft.storedResults.length === 0) {
        draft.phase = "bonusRolling";
      } else {
        setReadyIfDone(draft);
      }
    });
  }, [handleFall, moveStack, mutate, setReadyIfDone]);

  const rollYut = useCallback(() => {
    mutate((draft) => {
      const canUseExtraFromMoving = draft.phase === "moving" && draft.extraRolls > 0;
      if (draft.isThrowing || draft.phase === "gameOver" || !(["rolling", "bonusRolling"].includes(draft.phase) || canUseExtraFromMoving)) return;
      if (draft.currentPlayer === "me" && draft.storedResults.length > 0 && draft.extraRolls <= 0 && draft.phase !== "bonusRolling") return;

      if (draft.extraRolls > 0 && draft.phase !== "bonusRolling") draft.extraRolls -= 1;
      if (draft.phase === "bonusRolling" && draft.captureBonusRolls > 0) draft.captureBonusRolls -= 1;

      let result = getWeightedRandomYutResult();
      if (draft.forcedNextRoll === "doOrMo") result = Math.random() > 0.5 ? resultByBaseId("do") : resultByBaseId("mo");
      if (draft.forcedNextRoll === "yutOrMo") result = Math.random() > 0.5 ? resultByBaseId("yut") : resultByBaseId("mo");
      draft.forcedNextRoll = null;
      draft.hiddenRollResult = result;
      draft.isThrowing = true;
      draft.pendingRerollAvailable = false;
      draft.notice = "윷을 던지는 중입니다.";
    });
    window.setTimeout(finishRoll, THROW_MS);
  }, [finishRoll, mutate]);

  const selectResult = useCallback((id: string) => {
    mutate((draft) => {
      if (draft.currentPlayer !== "me" || draft.phase !== "moving" || draft.isThrowing) return;
      draft.selectedResultId = id;
      draft.notice = "이동할 말을 선택하세요.";
    });
  }, [mutate]);

  const consumeResultAndCheck = (draft: GameState, resultId: string) => {
    draft.storedResults = draft.storedResults.filter((item) => item.id !== resultId);
    draft.selectedResultId = null;
    draft.selectedPieceId = null;
    if (draft.winner) return;
    if (draft.storedResults.length > 0) {
      enterMovingPhase(draft, draft.storedResults.length === 1 ? "남은 결과가 자동 선택되었습니다. 이동할 말을 고르세요." : "남은 저장 결과를 이동하세요.");
      return;
    }
    if (draft.captureBonusRolls > 0) {
      draft.phase = "bonusRolling";
      draft.notice = "잡기 보너스 던지기입니다.";
      return;
    }
    setReadyIfDone(draft);
  };

  const choosePath = useCallback((path: PathName) => {
    mutate((draft) => {
      const pending = draft.pendingPathChoice;
      if (!pending) return;
      const result = draft.storedResults.find((item) => item.id === pending.resultId);
      draft.pendingPathChoice = null;
      if (!result) return;
      moveStack(draft, pending.pieceId, result, path);
      consumeResultAndCheck(draft, result.id);
    });
  }, [moveStack, mutate]);

  const selectPiece = useCallback((pieceId: string) => {
    mutate((draft) => {
      if (draft.currentPlayer !== "me" || draft.isThrowing) return;
      if (draft.selectionIntent) {
        resolveSelection(draft, pieceId);
        return;
      }
      if (draft.phase !== "moving" || !draft.selectedResultId) return;
      const result = draft.storedResults.find((item) => item.id === draft.selectedResultId);
      if (!result) return;
      const piece = draft.pieces.find((item) => item.id === pieceId);
      if (piece && !canMoveWithResult(piece, result)) {
        draft.notice = "출발 전 말에는 빽도를 사용할 수 없습니다. 다른 말을 선택하거나 턴을 넘기세요.";
        return;
      }
      const moved = moveStack(draft, pieceId, result);
      if (!moved || draft.pendingPathChoice) return;
      consumeResultAndCheck(draft, result.id);
    });
  }, [moveStack, mutate]);

  const endTurn = useCallback(() => {
    mutate((draft) => {
      if (draft.currentPlayer !== "me" || draft.isThrowing || draft.phase === "pathChoice" || draft.phase === "gameOver") return;
      const hasPendingRoll = draft.extraRolls > 0 || draft.captureBonusRolls > 0;
      const hasPendingMove = hasExecutableResult(draft, "me");
      if (hasPendingRoll || hasPendingMove) {
        setReadyIfDone(draft);
        draft.notice = "이동 가능한 결과가 없습니다. 남은 결과를 버리고 턴을 넘길 수 있습니다.";
        return;
      }
      const discarded = draft.storedResults.length + draft.extraRolls + draft.captureBonusRolls;
      draft.storedResults = [];
      draft.extraRolls = 0;
      draft.captureBonusRolls = 0;
      draft.selectedResultId = null;
      draft.selectedPieceId = null;
      draft.selectionIntent = null;
      draft.pendingPathChoice = null;
      if (discarded > 0) addLog(draft, `사용할 수 없는 결과 ${discarded}개를 버렸습니다.`);
      finishTurn(draft, "남은 결과를 정리하고 턴을 넘깁니다.");
    });
  }, [finishTurn, mutate, setReadyIfDone]);

  const timeoutTurn = useCallback(() => {
    mutate((draft) => {
      if (draft.phase === "gameOver" || draft.screen !== "game") return;
      if (draft.storedResults.length > 0) {
        const choice = chooseBestMove(draft, draft.currentPlayer);
        if (choice) {
          moveStack(draft, choice.piece.id, choice.result, choice.path);
          consumeResultAndCheck(draft, choice.result.id);
          draft.turnTimeLeft = TURN_SECONDS;
          addLog(draft, "추가 던지기를 먼저 사용합니다.");
          return;
        }
      }
      if (draft.extraRolls > 0 || draft.captureBonusRolls > 0) {
        draft.turnTimeLeft = TURN_SECONDS;
        draft.phase = draft.captureBonusRolls > 0 && draft.storedResults.length === 0 ? "bonusRolling" : "rolling";
        draft.notice = "추가 던지기가 남았습니다. 윷을 한 번 더 던져 주세요.";
        return;
      }
      draft.storedResults = [];
      draft.extraRolls = 0;
      draft.captureBonusRolls = 0;
      draft.selectedResultId = null;
      draft.selectedPieceId = null;
      draft.pendingPathChoice = null;
      draft.selectionIntent = null;
      addLog(draft, "추가 던지기 결과가 저장되었습니다.");
      finishTurn(draft, "추가 던지기를 사용하고 턴을 넘깁니다.");
    });
  }, [finishTurn, moveStack, mutate]);

  useEffect(() => {
    if (state.screen !== "game" || state.phase === "gameOver") return;
    const timer = window.setInterval(() => {
      const current = stateRef.current;
      if (current.screen !== "game" || current.phase === "gameOver") return;
      if (current.isThrowing) return;
      if (current.turnTimeLeft <= 1) {
        window.clearInterval(timer);
        timeoutTurn();
      } else {
        setState((prev) => ({ ...prev, turnTimeLeft: prev.turnTimeLeft - 1 }));
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [state.currentPlayer, state.phase, state.screen, timeoutTurn]);

  const canUsePower = useCallback((card: PowerCard) => {
    const draft = stateRef.current;
    const actor = draft.currentPlayer;
    const actorStacks = boardStacks(draft.pieces, actor);
    const foeStacks = boardStacks(draft.pieces, other(actor));
    const foeHeads = foeStacks.map((stack) => stack[0]);
    if (draft.isThrowing || card.used || draft.usedPowerThisTurn || draft.players[actor].skillBlockedTurns > 0 || draft.phase === "gameOver") return false;
    if (card.kind === "reroll") return draft.pendingRerollAvailable && !!draft.lastRollResult;
    if (card.kind === "copyMove") {
      const selected = draft.storedResults.find((item) => item.id === draft.selectedResultId);
      return !!selected && ["do", "gae", "geol", "backdo"].includes(selected.baseId);
    }
    if (card.kind === "doOrFold" || card.kind === "highRoll") return draft.phase === "rolling" || draft.phase === "bonusRolling";
    if (card.kind === "skillBlock" || card.kind === "trap") return true;
    if (card.kind === "freeRide") return draft.pieces.some((p) => p.playerId === actor && p.state === "start") && actorStacks.length > 0;
    if (card.kind === "immortal" || card.kind === "turbo") return actorStacks.length > 0;
    if (card.kind === "moveBack" || card.kind === "finishBlock") return foeStacks.length > 0;
    if (card.kind === "swap" || card.kind === "pullBehind") return actorStacks.length > 0 && foeStacks.length > 0;
    if (card.kind === "coordinate") return foeStacks.length >= 2;
    if (card.kind === "split") return foeStacks.some((stack) => stack.length >= 2);
    if (card.kind === "vipReturn") return foeHeads.some((head) => head && stepsToFinish(head.path, head.nodeId) > 3);
    if (card.type === "attack") return foeStacks.length > 0;
    return actorStacks.length > 0;
  }, []);

  const markCardUsed = (draft: GameState, card: PowerCard) => {
    card.used = true;
    card.revealed = true;
    draft.usedPowerThisTurn = true;
    draft.players[draft.currentPlayer].usedCards.push(card.name);
    draft.powerEffect = {
      id: `${card.kind}-${uid()}`,
      kind: card.kind,
      actor: draft.currentPlayer,
      cardName: card.name,
      text: powerEffectText(card.kind),
    };
    addLog(draft, `${card.name} 사용 · ${card.description}`);
  };

  const usePowerCard = useCallback((cardId: string) => {
    mutate((draft) => {
      const card = draft.players[draft.currentPlayer].powerCards.find((item) => item.id === cardId);
      if (!card || !canUsePower(card)) return;
      if (card.kind === "reroll") {
        const previous = draft.lastRollResult;
        if (previous && !previous.isFall) draft.storedResults = draft.storedResults.filter((item) => item.id !== previous.id);
        if (previous?.grantsExtraRoll && draft.extraRolls > 0) draft.extraRolls -= 1;
        let result = getWeightedRandomYutResult();
        draft.lastRollResult = result;
        markCardUsed(draft, card);
        if (result.isFall) handleFall(draft);
        else {
          draft.storedResults.push(result);
          if (result.grantsExtraRoll) draft.extraRolls += 1;
          draft.phase = draft.extraRolls > 0 ? "rolling" : "moving";
          draft.notice = `리롤 결과: ${result.name}`;
          if (draft.phase === "moving") enterMovingPhase(draft, `리롤 결과 ${result.name} 선택됨. 이동할 말을 고르세요.`);
        }
        return;
      }
      if (card.kind === "copyMove") {
        const result = draft.storedResults.find((item) => item.id === draft.selectedResultId);
        if (!result) return;
        draft.storedResults.push(cloneYutResult(result));
        markCardUsed(draft, card);
        draft.notice = "선택한 결과를 하나 더 복사했습니다.";
        return;
      }
      if (card.kind === "doOrFold" || card.kind === "highRoll") {
        draft.forcedNextRoll = card.kind === "doOrFold" ? "doOrMo" : "yutOrMo";
        markCardUsed(draft, card);
        return;
      }
      if (card.kind === "skillBlock") {
        draft.players[other(draft.currentPlayer)].skillBlockedTurns = 1;
        markCardUsed(draft, card);
        return;
      }
      if (card.kind === "trap") {
        draft.selectionIntent = { cardId, kind: "trap", actor: draft.currentPlayer, targets: [] };
        draft.notice = "함정을 설치할 칸을 선택하세요.";
        return;
      }
      draft.selectionIntent = { cardId, kind: card.kind, actor: draft.currentPlayer, targets: [] };
      draft.notice = selectionPrompt(card.kind);
    });
  }, [canUsePower, handleFall, mutate]);

  const selectBoardNode = useCallback((nodeId: number) => {
    mutate((draft) => {
      if (draft.selectionIntent?.kind !== "trap") return;
      draft.traps = draft.traps.filter((trap) => trap.owner !== draft.currentPlayer);
      draft.traps.push({ owner: draft.currentPlayer, nodeId });
      const card = draft.players[draft.currentPlayer].powerCards.find((item) => item.id === draft.selectionIntent?.cardId);
      if (card) markCardUsed(draft, card);
      draft.selectionIntent = null;
      draft.notice = "함정을 설치했습니다.";
    });
  }, [mutate]);

  const resolveSelection = (draft: GameState, pieceId: string) => {
    const intent = draft.selectionIntent!;
    const piece = draft.pieces.find((item) => item.id === pieceId);
    const card = draft.players[draft.currentPlayer].powerCards.find((item) => item.id === intent.cardId);
    if (!piece || !card) return;
    const actor = intent.actor;
    const foe = other(actor);
    const pushTarget = () => intent.targets.push(pieceId);
    const stack = (p: Piece) => draft.pieces.filter((item) => item.stackId === p.stackId && item.state === "board");
    const complete = () => {
      const target = (i: number) => draft.pieces.find((item) => item.id === intent.targets[i]);
      if (intent.kind === "immortal") stack(target(0)!).forEach((p) => (p.shield = true));
      if (intent.kind === "freeRide") {
        const starter = target(0);
        const board = target(1);
        if (starter && board) Object.assign(starter, { state: "board", nodeId: board.nodeId, path: board.path, stackId: board.stackId });
      }
      if (intent.kind === "turbo" && target(0)) {
        const saved = draft.currentPlayer;
        draft.currentPlayer = actor;
        moveStack(draft, target(0)!.id, resultByBaseId("gae"), target(0)!.path);
        draft.currentPlayer = saved;
      }
      if (intent.kind === "moveBack" && target(0)) {
        const head = target(0)!;
        const dest = getDestination(head.path, head.nodeId, -2);
        stack(head).forEach((p) => Object.assign(p, { nodeId: dest.nodeId, path: dest.path, state: dest.nodeId < 0 ? "start" : "board" }));
      }
      if ((intent.kind === "swap" || intent.kind === "pullBehind") && target(0) && target(1)) {
        const mine = target(0)!;
        const enemy = target(1)!;
        if (intent.kind === "swap") {
          const minePos = { nodeId: mine.nodeId, path: mine.path };
          const enemyPos = { nodeId: enemy.nodeId, path: enemy.path };
          stack(mine).forEach((p) => Object.assign(p, enemyPos));
          stack(enemy).forEach((p) => Object.assign(p, minePos));
        } else {
          const dest = getDestination(mine.path, mine.nodeId, -1);
          stack(enemy).forEach((p) => Object.assign(p, { nodeId: dest.nodeId, path: dest.path, state: dest.nodeId < 0 ? "start" : "board" }));
        }
      }
      if (intent.kind === "coordinate" && target(0) && target(1)) {
        const a = target(0)!;
        const b = target(1)!;
        const aPos = { nodeId: a.nodeId, path: a.path };
        const bPos = { nodeId: b.nodeId, path: b.path };
        stack(a).forEach((p) => Object.assign(p, bPos));
        stack(b).forEach((p) => Object.assign(p, aPos));
      }
      if (intent.kind === "split" && target(0)) {
        const items = stack(target(0)!);
        const split = items[items.length - 1];
        const dest = getDestination(split.path, split.nodeId, -1);
        split.stackId = `${split.id}-${uid()}`;
        Object.assign(split, { nodeId: dest.nodeId, path: dest.path, state: dest.nodeId < 0 ? "start" : "board" });
      }
      if (intent.kind === "vipReturn" && target(0)) {
        const head = target(0)!;
        if (stepsToFinish(head.path, head.nodeId) <= 3) {
          draft.notice = "결승점 3칸 이내 말에는 사용할 수 없습니다.";
          return;
        }
        stack(head).forEach((p) => Object.assign(p, { state: "start", nodeId: -1, path: "outer", stackId: `${p.id}-${uid()}` }));
      }
      if (intent.kind === "finishBlock" && target(0)) stack(target(0)!).forEach((p) => (p.finishBlockedTurns = 1));
      markCardUsed(draft, card);
      draft.selectionIntent = null;
    };

    if (intent.kind === "freeRide" && intent.targets.length === 0 && piece.playerId === actor && piece.state === "start") {
      pushTarget();
      draft.notice = "합류할 보드 위 말을 선택하세요.";
      return;
    }
    if (["swap", "pullBehind"].includes(intent.kind) && intent.targets.length === 0 && piece.playerId === actor && piece.state === "board") {
      pushTarget();
      draft.notice = "상대 말을 선택하세요.";
      return;
    }
    const rules: Partial<Record<CardKind, (p: Piece) => boolean>> = {
      immortal: (p) => p.playerId === actor && p.state === "board",
      freeRide: (p) => p.playerId === actor && p.state === "board",
      turbo: (p) => p.playerId === actor && p.state === "board",
      moveBack: (p) => p.playerId === foe && p.state === "board",
      swap: (p) => p.playerId === foe && p.state === "board",
      pullBehind: (p) => p.playerId === foe && p.state === "board",
      coordinate: (p) => p.playerId === foe && p.state === "board" && !intent.targets.includes(p.id),
      split: (p) => p.playerId === foe && p.state === "board" && stack(p).length >= 2,
      vipReturn: (p) => p.playerId === foe && p.state === "board",
      finishBlock: (p) => p.playerId === foe && p.state === "board",
    };
    if (!rules[intent.kind]?.(piece)) return;
    pushTarget();
    const needed = intent.kind === "coordinate" || intent.kind === "freeRide" || ["swap", "pullBehind"].includes(intent.kind) ? 2 : 1;
    if (intent.targets.length >= needed) complete();
  };

  const surrender = useCallback(() => {
    mutate((draft) => {
      draft.winner = "ai";
      draft.phase = "gameOver";
      draft.screen = "result";
      draft.surrenderModalOpen = false;
      addLog(draft, "기권했습니다.");
    });
  }, [mutate]);

  const toggleSurrender = useCallback((open: boolean) => mutate((draft) => { draft.surrenderModalOpen = open; }), [mutate]);
  const reset = useCallback(() => setState(cleanBaseText(initialGame())), []);

  useEffect(() => {
    if (state.currentPlayer !== "ai" || state.screen !== "game" || state.phase === "gameOver" || state.isThrowing) return;
    const timer = window.setTimeout(() => {
      const current = stateRef.current;
      if (current.currentPlayer !== "ai" || current.isThrowing) return;
      if (current.phase === "rolling" || current.phase === "bonusRolling") {
        maybeUseAIPower();
        rollYut();
        return;
      }
      if (current.phase === "moving") {
        mutate((draft) => {
          maybeUseAIPowerInMoveDraft(draft);
          const choice = chooseAIMove(draft);
          if (!choice) {
            if (draft.storedResults.length > 0) {
              addLog(draft, "AI가 이동할 수 없는 결과를 정리했습니다.");
              draft.storedResults = [];
              draft.selectedResultId = null;
              draft.selectedPieceId = null;
            }
            setReadyIfDone(draft);
            return;
          }
          moveStack(draft, choice.piece.id, choice.result, choice.path);
          consumeResultAndCheck(draft, choice.result.id);
        });
        return;
      }
      if (current.phase === "turnEndReady") {
        mutate((draft) => finishTurn(draft));
      }
    }, state.phase === "turnEndReady" ? AI_END_MS : AI_STEP_MS);
    return () => window.clearTimeout(timer);
  }, [
    finishTurn,
    moveStack,
    mutate,
    rollYut,
    setReadyIfDone,
    state.captureBonusRolls,
    state.currentPlayer,
    state.extraRolls,
    state.isThrowing,
    state.phase,
    state.screen,
    state.selectedResultId,
    state.storedResults.length,
  ]);

  useEffect(() => {
    if (!state.powerEffect) return;
    const effectId = state.powerEffect.id;
    const timer = window.setTimeout(() => {
      mutate((draft) => {
        if (draft.powerEffect?.id === effectId) draft.powerEffect = null;
      });
    }, 1700);
    return () => window.clearTimeout(timer);
  }, [mutate, state.powerEffect]);

  useEffect(() => {
    if (!state.captureEffect) return;
    const effectId = state.captureEffect.id;
    const timer = window.setTimeout(() => {
      mutate((draft) => {
        if (draft.captureEffect?.id === effectId) draft.captureEffect = null;
      });
    }, 1250);
    return () => window.clearTimeout(timer);
  }, [mutate, state.captureEffect]);

  useEffect(() => {
    if (!state.rollResultEffect) return;
    const effectId = state.rollResultEffect.id;
    const timer = window.setTimeout(() => {
      mutate((draft) => {
        if (draft.rollResultEffect?.id === effectId) draft.rollResultEffect = null;
      });
    }, 1250);
    return () => window.clearTimeout(timer);
  }, [mutate, state.rollResultEffect]);

  const maybeUseAIPower = () => {
    mutate((draft) => {
      if (draft.currentPlayer !== "ai" || draft.usedPowerThisTurn || draft.players.ai.skillBlockedTurns > 0) return;
      const card = draft.players.ai.powerCards.find((item) => !item.used && (item.kind === "highRoll" || item.kind === "doOrFold"));
      if (!card || Math.random() > 0.25) return;
      draft.forcedNextRoll = card.kind === "highRoll" ? "yutOrMo" : "doOrMo";
      card.used = true;
      card.revealed = true;
      draft.usedPowerThisTurn = true;
      draft.players.ai.usedCards.push(card.name);
      draft.powerEffect = {
        id: `${card.kind}-${uid()}`,
        kind: card.kind,
        actor: "ai",
        cardName: card.name,
        text: powerEffectText(card.kind),
      };
      addLog(draft, `상대방이 ${card.name} 사용`);
    });
  };

  const maybeUseAIPowerInMoveDraft = (draft: GameState) => {
    if (draft.currentPlayer !== "ai" || draft.usedPowerThisTurn || draft.players.ai.skillBlockedTurns > 0) return;
    const card = draft.players.ai.powerCards.find((item) => !item.used);
    if (!card || Math.random() > 0.38) return;
    const aiStacks = boardStacks(draft.pieces, "ai");
    const myStacks = boardStacks(draft.pieces, "me");
    const aiHead = aiStacks[0]?.[0];
    const myHead = myStacks[0]?.[0];
    const reveal = (text: string) => {
      card.used = true;
      card.revealed = true;
      draft.usedPowerThisTurn = true;
      draft.players.ai.usedCards.push(card.name);
      draft.powerEffect = {
        id: `${card.kind}-${uid()}`,
        kind: card.kind,
        actor: "ai",
        cardName: card.name,
        text: powerEffectText(card.kind),
      };
      addLog(draft, text);
    };

    if (card.kind === "immortal" && aiHead) {
      aiStacks[0].forEach((piece) => (piece.shield = true));
      reveal("상대방이 불사 방패를 사용했습니다.");
    } else if (card.kind === "copyMove" && draft.storedResults.some((result) => ["do", "gae", "geol", "backdo"].includes(result.baseId))) {
      draft.storedResults.push(cloneYutResult(draft.storedResults.find((result) => ["do", "gae", "geol", "backdo"].includes(result.baseId))!));
      reveal("상대방이 복붙 이동을 사용했습니다.");
    } else if (card.kind === "freeRide" && aiHead) {
      const starter = draft.pieces.find((piece) => piece.playerId === "ai" && piece.state === "start");
      if (!starter) return;
      Object.assign(starter, { state: "board" as const, nodeId: aiHead.nodeId, path: aiHead.path, stackId: aiHead.stackId });
      reveal("상대방이 무임승차를 사용했습니다.");
    } else if (card.kind === "turbo" && aiHead) {
      const saved = draft.currentPlayer;
      draft.currentPlayer = "ai";
      moveStack(draft, aiHead.id, resultByBaseId("gae"), chooseAIPath(draft, aiHead, resultByBaseId("gae")));
      draft.currentPlayer = saved;
      reveal("상대방이 터보 한 칸을 사용했습니다.");
    } else if (card.kind === "moveBack" && myHead) {
      const dest = getDestination(myHead.path, myHead.nodeId, -2);
      myStacks[0].forEach((piece) => Object.assign(piece, { nodeId: dest.nodeId, path: dest.path, state: dest.nodeId < 0 ? "start" as const : "board" as const }));
      reveal("상대방이 후진하세요를 사용했습니다.");
    } else if (card.kind === "swap" && aiHead && myHead) {
      const aiPos = { nodeId: aiHead.nodeId, path: aiHead.path };
      const myPos = { nodeId: myHead.nodeId, path: myHead.path };
      aiStacks[0].forEach((piece) => Object.assign(piece, myPos));
      myStacks[0].forEach((piece) => Object.assign(piece, aiPos));
      reveal("상대방이 자리 바꾸기를 사용했습니다.");
    } else if (card.kind === "trap" && myHead) {
      draft.traps = draft.traps.filter((trap) => trap.owner !== "ai");
      draft.traps.push({ owner: "ai", nodeId: myHead.nodeId });
      reveal("상대방이 밟아봐 함정을 설치했습니다.");
    } else if (card.kind === "pullBehind" && aiHead && myHead) {
      const dest = getDestination(aiHead.path, aiHead.nodeId, -1);
      myStacks[0].forEach((piece) => Object.assign(piece, { nodeId: dest.nodeId, path: dest.path, state: dest.nodeId < 0 ? "start" as const : "board" as const }));
      reveal("상대방이 내 뒤로 와를 사용했습니다.");
    } else if (card.kind === "skillBlock") {
      draft.players.me.skillBlockedTurns = 1;
      reveal("상대방이 술사 봉인을 사용했습니다.");
    } else if (card.kind === "coordinate" && myStacks.length >= 2) {
      const a = myStacks[0][0];
      const b = myStacks[1][0];
      const aPos = { nodeId: a.nodeId, path: a.path };
      const bPos = { nodeId: b.nodeId, path: b.path };
      myStacks[0].forEach((piece) => Object.assign(piece, bPos));
      myStacks[1].forEach((piece) => Object.assign(piece, aPos));
      reveal("상대방이 좌표 오류를 사용했습니다.");
    } else if (card.kind === "split") {
      const stacked = myStacks.find((stack) => stack.length >= 2);
      if (!stacked) return;
      const split = stacked[stacked.length - 1];
      const dest = getDestination(split.path, split.nodeId, -1);
      Object.assign(split, { stackId: `${split.id}-${uid()}`, nodeId: dest.nodeId, path: dest.path, state: dest.nodeId < 0 ? "start" as const : "board" as const });
      reveal("상대방이 합체 해제를 사용했습니다.");
    } else if (card.kind === "vipReturn" && myHead && stepsToFinish(myHead.path, myHead.nodeId) > 3) {
      myStacks[0].forEach((piece) => Object.assign(piece, { state: "start" as const, nodeId: -1, path: "outer" as const, stackId: `${piece.id}-${uid()}` }));
      reveal("상대방이 VIP 귀가를 사용했습니다.");
    } else if (card.kind === "finishBlock" && myHead) {
      myStacks[0].forEach((piece) => (piece.finishBlockedTurns = 1));
      reveal("상대방이 결승점 공사중을 사용했습니다.");
    }
  };

  const stacks = useMemo(() => boardStacks(state.pieces), [state.pieces]);

  return {
    state,
    stacks,
    startMatch,
    beginGame,
    openCharacterSelect,
    goStart,
    goNickname,
    rollYut,
    finishRoll,
    selectResult,
    selectPiece,
    choosePath,
    selectBoardNode,
    usePowerCard,
    canUsePower,
    endTurn,
    surrender,
    toggleSurrender,
    reset,
  };
}

function selectionPrompt(kind: CardKind) {
  const map: Partial<Record<CardKind, string>> = {
    immortal: "보호할 내 말을 선택하세요.",
    freeRide: "태울 내 말을 선택하세요.",
    turbo: "2칸 전진할 내 말을 선택하세요.",
    moveBack: "뒤로 보낼 상대 말을 선택하세요.",
    swap: "먼저 내 말을 선택하세요.",
    pullBehind: "먼저 기준이 될 내 말을 선택하세요.",
    coordinate: "위치를 바꿀 상대 말 2개를 선택하세요.",
    split: "분리할 업힌 말을 선택하세요.",
    vipReturn: "출발점으로 보낼 상대 말을 선택하세요.",
    finishBlock: "결승점을 막을 상대 말을 선택하세요.",
  };
  return map[kind] || "대상을 선택하세요.";
}


