"use client";

import CharacterPortrait from "@/components/CharacterPortrait";
import { characterNames } from "@/lib/characters";

interface Props {
  selected: number;
  nickname: string;
  onSelect: (index: number) => void;
  onBack: () => void;
  onStart: () => void;
}

export default function CharacterSelectScreen({ selected, nickname, onSelect, onBack, onStart }: Props) {
  return (
    <main className="character-screen">
      <div className="character-backdrop" />
      <section className="select-panel">
        <div className="select-header">
          <div className="select-copy">
            <span>말 고르기</span>
            <h1>캐릭터 선택</h1>
            <p>{nickname}의 대표 말을 선택하세요.</p>
          </div>
          <div className="selected-character-card">
            <CharacterPortrait key={selected} index={selected} className="selected-character-preview" />
            <strong>{characterNames[selected]}</strong>
          </div>
        </div>
        <div className="character-grid">
          {characterNames.map((animal, index) => (
            <button
              key={animal}
              className={`character-tile ${selected === index ? "active" : ""}`}
              onClick={() => onSelect(index)}
              aria-pressed={selected === index}
            >
              <CharacterPortrait index={index} />
              <b>{animal}</b>
            </button>
          ))}
        </div>
        <div className="select-actions">
          <button className="soft-3d" onClick={onBack}>돌아가기</button>
          <button className="soft-3d primary" onClick={onStart}>선택 완료</button>
        </div>
      </section>
    </main>
  );
}
