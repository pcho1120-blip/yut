import { characterNames } from "@/lib/characters";
import { CardKind, PlayerId, PowerCard } from "@/types/game";

const selfCards: Omit<PowerCard, "id" | "used" | "revealed">[] = [
  { kind: "immortal", name: "불사 버그", type: "self", description: "내 말 묶음의 다음 잡기를 한 번 막습니다.", timing: "이동 전" },
  { kind: "reroll", name: "리롤각", type: "self", description: "방금 나온 윷 결과를 다시 뒤집습니다.", timing: "결과 직후" },
  { kind: "copyMove", name: "복붙 이동", type: "self", description: "선택한 도, 개, 걸, 빽도 결과를 하나 더 복사합니다.", timing: "결과 선택 후" },
  { kind: "doOrFold", name: "도 아니면 접어", type: "self", description: "다음 결과가 도 또는 모로 나옵니다.", timing: "던지기 전" },
  { kind: "highRoll", name: "고점만 본다", type: "self", description: "다음 결과가 윷 또는 모로 나옵니다.", timing: "던지기 전" },
  { kind: "freeRide", name: "무임승차", type: "self", description: "출발 전 말 하나를 내 말 묶음에 태웁니다.", timing: "이동 전" },
  { kind: "turbo", name: "터보 킥", type: "self", description: "내 말 하나를 2칸 더 전진시킵니다.", timing: "이동 전" },
];

const attackCards: Omit<PowerCard, "id" | "used" | "revealed">[] = [
  { kind: "moveBack", name: "후진하세요", type: "attack", description: "상대 말 묶음을 2칸 뒤로 보냅니다.", timing: "이동 전" },
  { kind: "swap", name: "자리 바꿔", type: "attack", description: "내 말과 상대 말의 위치를 바꿉니다.", timing: "이동 전" },
  { kind: "trap", name: "밟아봐", type: "attack", description: "칸 하나에 함정을 설치합니다.", timing: "이동 전" },
  { kind: "pullBehind", name: "내 뒤로 와", type: "attack", description: "상대 말을 내 말 바로 뒤로 끌어옵니다.", timing: "이동 전" },
  { kind: "skillBlock", name: "스킬 압수", type: "attack", description: "상대가 다음 턴에 초능력을 쓰지 못합니다.", timing: "언제나" },
  { kind: "coordinate", name: "좌표 오류", type: "attack", description: "상대 말 두 묶음의 위치를 바꿉니다.", timing: "이동 전" },
  { kind: "split", name: "합체 해제", type: "attack", description: "상대 업힌 말 하나를 분리합니다.", timing: "이동 전" },
  { kind: "vipReturn", name: "VIP 귀가 셔틀", type: "attack", description: "상대 말 묶음을 출발로 돌려보냅니다.", timing: "이동 전" },
  { kind: "finishBlock", name: "결승전 공사중", type: "attack", description: "상대의 다음 골인을 한 번 막습니다.", timing: "이동 전" },
];

export const cardCatalog = [...selfCards, ...attackCards];

export const animals = characterNames;

export function makeCard(kind: CardKind, owner: PlayerId, index: number): PowerCard {
  const base = cardCatalog.find((card) => card.kind === kind)!;
  return {
    ...base,
    id: `${owner}-${kind}-${index}-${Math.random().toString(36).slice(2, 8)}`,
    used: false,
    revealed: owner === "me",
  };
}

export function dealOpeningCards(owner: PlayerId) {
  return [
    makeCard(pick(selfCards).kind, owner, 0),
    makeCard(pick(attackCards).kind, owner, 1),
  ];
}

export function rewardCard(owner: PlayerId, owned: PowerCard[]) {
  const blocked = new Set(owned.map((card) => card.kind));
  const candidates = cardCatalog.filter((card) => !blocked.has(card.kind));
  if (!candidates.length) return null;
  return makeCard(pick(candidates).kind, owner, owned.length);
}

function pick<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}
