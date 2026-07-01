export const characterNames = ["쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양", "원숭이", "닭", "개", "돼지"];

export function characterPosition(index: number) {
  const safeIndex = Math.max(0, Math.min(characterNames.length - 1, index));
  return {
    column: safeIndex % 4,
    row: Math.floor(safeIndex / 4),
  };
}
