import { resultCharacterImagePath } from "@/lib/assetPaths";
import { characterNames } from "@/lib/characters";

interface Props {
  index: number;
  mood: "win" | "lose";
  className?: string;
}

export default function ResultExpressionSprite({ index, mood, className = "" }: Props) {
  const safeIndex = Math.max(0, Math.min(11, index));
  const characterName = characterNames[safeIndex];

  return (
    <img
      className={`result-expression-sprite ${className}`}
      src={resultCharacterImagePath(characterName, mood)}
      alt={`${characterName} ${mood === "win" ? "승리" : "패배"}`}
      draggable={false}
    />
  );
}
