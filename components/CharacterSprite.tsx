import { characterNames, characterPosition } from "@/lib/characters";

interface Props {
  index: number;
  label?: string;
  className?: string;
  mode?: "full" | "portrait";
}

export default function CharacterSprite({ index, label, className = "", mode = "full" }: Props) {
  const { column, row } = characterPosition(index);
  const name = label || characterNames[index] || "캐릭터";
  const portrait = mode === "portrait";

  return (
    <span
      className={`character-sprite character-${index} ${portrait ? "portrait" : ""} ${className}`}
      role="img"
      aria-label={name}
      style={{
        backgroundImage: "url('/assets/generated/zodiac-character-sheet-cutout-v1.png')",
        backgroundSize: "400% 300%",
        backgroundPosition: `${column * 33.333333}% ${row * 50}%`,
      }}
    />
  );
}
