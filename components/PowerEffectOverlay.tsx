import { powerCardImagePath } from "@/lib/assetPaths";
import { GameState } from "@/types/game";

export default function PowerEffectOverlay({ state }: { state: GameState }) {
  const effect = state.powerEffect;
  if (!effect) return null;

  return (
    <div className={`power-effect-overlay ${effect.kind} ${effect.actor}`} aria-live="polite">
      <div className="power-effect-burst">
        <span>{effect.actor === "me" ? "내 초능력" : "상대 초능력"}</span>
        <img className="power-effect-card-image" src={powerCardImagePath(effect.kind)} alt="" />
        <strong>{effect.cardName}</strong>
        <b>{effect.text}</b>
      </div>
    </div>
  );
}
