import { powerCardImagePath } from "@/lib/assetPaths";
import { PowerCard as PowerCardType } from "@/types/game";

interface Props {
  card: PowerCardType;
  hidden: boolean;
  disabled: boolean;
  onUse: () => void;
}

function cardArtStyle(kind: PowerCardType["kind"]) {
  return {
    backgroundImage: `url("${powerCardImagePath(kind)}")`,
  };
}

export default function PowerCard({ card, hidden, disabled, onUse }: Props) {
  return (
    <button className={`power-card ${card.used ? "used" : ""} ${hidden ? "hidden" : ""}`} disabled={disabled} onClick={onUse}>
      {hidden ? (
        <>
          <span className="power-card-art hidden-art" />
          <span>비공개</span>
        </>
      ) : (
        <>
          <span className="power-card-art" style={cardArtStyle(card.kind)} />
          <strong>{card.name}</strong>
          <small>{card.description}</small>
          <span>{card.used ? "사용 완료" : disabled ? card.timing : "사용 가능"}</span>
        </>
      )}
    </button>
  );
}
