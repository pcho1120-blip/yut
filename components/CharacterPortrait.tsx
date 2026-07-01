import { characterNames } from "@/lib/characters";

interface Props {
  index: number;
  className?: string;
}

export function characterPortraitPath(index: number) {
  const name = characterNames[index] || characterNames[0];
  return encodeURI(`/assets/assets5/${name}.png`);
}

export default function CharacterPortrait({ index, className = "" }: Props) {
  const name = characterNames[index] || "캐릭터";

  return (
    <img
      className={`character-portrait-image ${className}`}
      src={characterPortraitPath(index)}
      alt={name}
      draggable={false}
    />
  );
}
