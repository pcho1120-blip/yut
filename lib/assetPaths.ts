import { CardKind } from "@/types/game";

export const powerCardImageNames: Record<CardKind, string> = {
  immortal: "불사 버그.png",
  reroll: "리롤각.png",
  copyMove: "복붙 이동.png",
  doOrFold: "도 아니면 접어.png",
  highRoll: "고점만 본다.png",
  freeRide: "무임승차.png",
  turbo: "터보 킥.png",
  moveBack: "제목 없는 디자인 (15).png",
  swap: "자리 바꿔.png",
  trap: "밟아봐.png",
  pullBehind: "내 뒤로 와.png",
  skillBlock: "스킬 압수.png",
  coordinate: "좌표 오류.png",
  split: "합체 해제.png",
  vipReturn: "vip 귀가 셔틀.png",
  finishBlock: "결승전 공사중.png",
};

function publicAsset(path: string) {
  return encodeURI(path);
}

export function powerCardImagePath(kind: CardKind) {
  return publicAsset(`/assets/generated/power-cards-assets4/${powerCardImageNames[kind]}`);
}

export function resultCharacterImagePath(characterName: string, mood: "win" | "lose") {
  return publicAsset(`/assets/assets3/${characterName} ${mood === "win" ? "승리" : "패배"}.png`);
}

export function yutSheetImagePath() {
  return publicAsset("/assets/assets3/윷.png");
}
