import CharacterPortrait from "@/components/CharacterPortrait";
import PowerCard from "@/components/PowerCard";
import { getNode } from "@/lib/boardPaths";
import { Phase, Piece, Player, PlayerId, PowerCard as PowerCardType, YutResult } from "@/types/game";

interface Props {
  side: "mine" | "opponent";
  player: Player;
  pieces: Piece[];
  currentPlayer: PlayerId;
  cardsDisabled: boolean;
  phase: Phase;
  selectedResultId: string | null;
  storedResults: YutResult[];
  hasSelectionIntent: boolean;
  onUseCard: (cardId: string) => void;
  canUsePower: (card: PowerCardType) => boolean;
  onPiece: (pieceId: string) => void;
}

function pieceLabel(piece: Piece) {
  if (piece.state === "finished") return "완주 완료";
  if (piece.state === "start") return "대기";
  return getNode(piece.nodeId).name;
}

export default function PlayerPanel({
  side,
  player,
  pieces,
  currentPlayer,
  cardsDisabled,
  phase,
  selectedResultId,
  storedResults,
  hasSelectionIntent,
  onUseCard,
  canUsePower,
  onPiece,
}: Props) {
  const mine = side === "mine";
  const playerPieces = pieces.filter((piece) => piece.playerId === player.id);
  const selectedResult = storedResults.find((result) => result.id === selectedResultId) || null;
  const canSelectPieces =
    mine && currentPlayer === "me" && !cardsDisabled && ((phase === "moving" && !!selectedResultId) || hasSelectionIntent);

  return (
    <aside className={`player-panel ${side}`}>
      <div className="profile-card">
        <span className="profile-avatar-frame">
          <CharacterPortrait index={player.avatarIndex} className="avatar" />
        </span>
        <div>
          <h2>{player.name}</h2>
          <p>{player.animal} · 완주 {player.finishedCount}/4 · 낙 {player.fallCount}/2</p>
        </div>
      </div>
      <div className="power-section">
        <h3>{mine ? "내 초능력" : "상대 초능력"}</h3>
        <div className="power-list">
          {player.powerCards.map((card) => (
            <PowerCard
              key={card.id}
              card={card}
              hidden={!mine && !card.revealed}
              disabled={cardsDisabled || currentPlayer !== player.id || !canUsePower(card)}
              onUse={() => onUseCard(card.id)}
            />
          ))}
        </div>
      </div>
      <div className="piece-section">
        <h3>{mine ? "내 말" : "상대 말"}</h3>
        <div className="piece-slots">
          {playerPieces.map((piece) => (
            <button
              key={piece.id}
              className={`piece-state ${piece.state}`}
              disabled={!canSelectPieces || piece.state === "finished" || (piece.state === "start" && !!selectedResult && selectedResult.move <= 0)}
              onClick={() => onPiece(piece.id)}
            >
              <span className="piece-mini-frame">
                <CharacterPortrait index={player.avatarIndex} className="piece-mini" />
              </span>
              <b>{pieceLabel(piece)}</b>
              {piece.state === "finished" && <span className="finish-mark">✓</span>}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
