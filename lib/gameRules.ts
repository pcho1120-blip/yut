import { YutResult } from "@/types/game";

export const baseYutResults: Omit<YutResult, "id">[] = [
  { baseId: "fall", name: "낙", move: 0, probability: 3, grantsExtraRoll: false, isFall: true },
  { baseId: "backdo", name: "빽도", move: -1, probability: 5, grantsExtraRoll: false, isBackDo: true },
  { baseId: "do", name: "도", move: 1, probability: 24, grantsExtraRoll: false },
  { baseId: "gae", name: "개", move: 2, probability: 31, grantsExtraRoll: false },
  { baseId: "geol", name: "걸", move: 3, probability: 22, grantsExtraRoll: false },
  { baseId: "yut", name: "윷", move: 4, probability: 9, grantsExtraRoll: true },
  { baseId: "mo", name: "모", move: 5, probability: 6, grantsExtraRoll: true },
];

export function cloneYutResult(result: Omit<YutResult, "id"> | YutResult): YutResult {
  return { ...result, id: `${result.baseId}-${Math.random().toString(36).slice(2, 8)}` };
}

export function resultByBaseId(baseId: YutResult["baseId"]) {
  return cloneYutResult(baseYutResults.find((item) => item.baseId === baseId)!);
}

export function getWeightedRandomYutResult() {
  const total = baseYutResults.reduce((sum, result) => sum + result.probability, 0);
  let ticket = Math.random() * total;
  for (const result of baseYutResults) {
    ticket -= result.probability;
    if (ticket <= 0) return cloneYutResult(result);
  }
  return cloneYutResult(baseYutResults[baseYutResults.length - 1]);
}

export function formatTime(seconds: number) {
  return `00:${String(Math.max(0, seconds)).padStart(2, "0")}`;
}
