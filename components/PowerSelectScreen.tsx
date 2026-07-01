"use client";

import { useState } from "react";
import CharacterPortrait from "@/components/CharacterPortrait";
import PowerCard from "@/components/PowerCard";
import { Player } from "@/types/game";

interface Props {
  player: Player;
  opponent: Player;
  onBack: () => void;
  onStart: () => void;
}

export default function PowerSelectScreen({ player, opponent, onBack, onStart }: Props) {
  const [revealed, setRevealed] = useState(false);

  return (
    <main className="power-select-screen">
      <div className="power-select-backdrop" />
      <section className="power-select-panel">
        <header className="power-select-header">
          <CharacterPortrait index={player.avatarIndex} className="power-select-avatar" />
          <div>
            <h1>초능력 뽑기</h1>
            <p>{player.name}의 시작 초능력 2장을 확인하세요.</p>
          </div>
        </header>

        <div className={`power-draw-zone ${revealed ? "revealed" : ""}`}>
          <div className="power-draw-row mine">
            {player.powerCards.map((card) => (
              <PowerCard key={card.id} card={card} hidden={!revealed} disabled onUse={() => {}} />
            ))}
          </div>
          <div className="power-draw-row opponent">
            {opponent.powerCards.map((card) => (
              <PowerCard key={card.id} card={card} hidden disabled onUse={() => {}} />
            ))}
          </div>
        </div>

        <div className="power-select-actions">
          <button className="soft-3d" onClick={onBack}>캐릭터 다시 선택</button>
          {!revealed ? (
            <button className="soft-3d primary draw-button" onClick={() => setRevealed(true)}>초능력 뽑기</button>
          ) : (
            <button className="soft-3d primary" onClick={onStart}>게임 시작</button>
          )}
        </div>
      </section>
    </main>
  );
}
