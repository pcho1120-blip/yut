"use client";

import { useMemo, useState } from "react";
import PowerCard from "@/components/PowerCard";
import { makeCard } from "@/lib/powerCards";
import { CardKind } from "@/types/game";

interface Props {
  nickname: string;
  onBack: () => void;
  onStart: () => void;
}

const allPowerKinds: CardKind[] = [
  "immortal",
  "reroll",
  "copyMove",
  "doOrFold",
  "highRoll",
  "freeRide",
  "turbo",
  "moveBack",
  "swap",
  "trap",
  "pullBehind",
  "skillBlock",
  "coordinate",
  "split",
  "vipReturn",
  "finishBlock",
];

export default function StartScreen({ onBack, onStart }: Props) {
  const [showPowers, setShowPowers] = useState(false);
  const previewCards = useMemo(() => allPowerKinds.map((kind, index) => makeCard(kind, "me", index)), []);

  return (
    <main className="start-screen">
      <img className="start-bg" src="/assets/generated/main-menu-screen-final.png" alt="" />
      <section className={`start-overlay ${showPowers ? "powers-open" : ""}`}>
        <img className="start-logo-image" src="/assets/generated/yut-neungnyeokja-logo.png" alt="윷능력자" />
        <div className="start-title-block">
          <h1>초능력으로 판을 뒤집어 보세요</h1>
          <p>말을 업고, 자리를 바꾸고, 결정적인 순간에 카드를 사용하는 전략 윷놀이입니다.</p>
        </div>

        <div className="start-actions primary-actions">
          <button className="menu-button gold" onClick={onStart}>시작하기</button>
          <button className="menu-button brown" onClick={onBack}>닉네임 만들기</button>
        </div>

        <button className="power-preview-toggle" onClick={() => setShowPowers((value) => !value)}>
          초능력 16종 {showPowers ? "닫기" : "보기"}
        </button>

        {showPowers && (
          <div className="start-power-list full">
            {previewCards.map((card) => (
              <PowerCard key={card.kind} card={card} hidden={false} disabled onUse={() => {}} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
