import { YutResult } from "@/types/game";
import type { CSSProperties } from "react";

const flatCounts: Record<YutResult["baseId"], number> = {
  fall: 0,
  backdo: 1,
  do: 1,
  gae: 2,
  geol: 3,
  yut: 4,
  mo: 0,
};

const rotations = [-12, 7, -4, 11];
const tossOffsets = [
  { x: -92, y: -238, spin: -260 },
  { x: 72, y: -272, spin: 240 },
  { x: -54, y: -218, spin: 210 },
  { x: 104, y: -246, spin: -250 },
];

export default function YutShape({
  result,
  rolling = false,
  compact = false,
  reveal = true,
}: {
  result: YutResult | null;
  rolling?: boolean;
  compact?: boolean;
  reveal?: boolean;
}) {
  const baseId = result?.baseId || "mo";
  const flatCount = result && reveal ? flatCounts[baseId] : 0;

  return (
    <div className={`yut-shape ${compact ? "compact" : ""} ${rolling ? "rolling" : ""} ${baseId}`} aria-label={result?.name || "윷"}>
      {Array.from({ length: 4 }, (_, index) => {
        const isFlat = reveal ? index < flatCount : index % 2 === 0;
        const toss = tossOffsets[index];
        return (
          <span
            key={index}
            className={`yut-stick ${isFlat ? "flat" : "round"} ${baseId === "backdo" && index === 0 ? "backdo-mark" : ""}`}
            style={
              {
                "--stick-rotate": `${rotations[index]}deg`,
                "--toss-x": `${toss.x}px`,
                "--toss-x-small": `${toss.x * 0.18}px`,
                "--toss-x-small-neg": `${toss.x * -0.18}px`,
                "--toss-x-small-reverse": `${toss.x * -0.108}px`,
                "--toss-x-mid": `${toss.x * 0.66}px`,
                "--toss-x-land": `${toss.x * 0.12}px`,
                "--toss-x-bounce": `${toss.x * 0.042}px`,
                "--toss-y": `${toss.y}px`,
                "--toss-spin": `${toss.spin}deg`,
                "--stick-depth": `${index * 3}px`,
              } as CSSProperties
            }
          >
            {(!isFlat || !reveal) && <i aria-hidden="true" />}
          </span>
        );
      })}
      {reveal && baseId === "fall" && <b className="fall-mark">낙</b>}
    </div>
  );
}
