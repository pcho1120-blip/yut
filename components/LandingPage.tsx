"use client";

import { useState } from "react";
import CharacterPortrait from "@/components/CharacterPortrait";
import LandingGameplaySnapshot from "@/components/LandingGameplaySnapshot";
import PowerCard from "@/components/PowerCard";
import { characterNames } from "@/lib/characters";
import { cardCatalog } from "@/lib/powerCards";
import { CardKind } from "@/types/game";

interface Props {
  onStart: () => void;
}

const cardPreviews = cardCatalog.map((card) => ({
  ...card,
  id: `landing-${card.kind}`,
  used: false,
  revealed: true,
}));

function landingCard(kind: CardKind) {
  const card = cardCatalog.find((item) => item.kind === kind)!;
  return {
    ...card,
    id: `landing-combo-${kind}`,
    used: false,
    revealed: true,
  };
}

const playSteps = [
  {
    title: "던지기",
    text: "도, 개, 걸, 윷, 모, 빽도, 낙까지 한 번의 결과가 다음 선택을 바꿉니다.",
  },
  {
    title: "판짜기",
    text: "업기와 잡기, 지름길 선택으로 같은 윷판에서도 전혀 다른 흐름이 열립니다.",
  },
  {
    title: "뒤집기",
    text: "초능력 카드는 이동 전, 결과 직후, 결정적인 골인 앞에서 판세를 흔듭니다.",
  },
];

const roundFlow = [
  "윷 던지기",
  "결과 저장",
  "말 선택",
  "업기와 잡기",
  "초능력 발동",
  "완주 경쟁",
];

const cardCombos = [
  {
    title: "고점 승부",
    text: "큰 수를 노리고 실패하면 다시 뒤집는 공격적인 한 방 조합입니다.",
    cards: [landingCard("highRoll"), landingCard("reroll")],
  },
  {
    title: "빠른 완주",
    text: "출발 전 말을 태우고 이동 거리를 늘려 한 묶음을 빠르게 밀어붙입니다.",
    cards: [landingCard("freeRide"), landingCard("turbo")],
  },
  {
    title: "결승 방해",
    text: "함정과 골인 차단으로 상대의 마지막 한 칸을 가장 불편하게 만듭니다.",
    cards: [landingCard("trap"), landingCard("finishBlock")],
  },
  {
    title: "역전 견제",
    text: "위치를 바꾸거나 출발로 돌려보내 유리한 판을 한순간에 흔듭니다.",
    cards: [landingCard("swap"), landingCard("vipReturn")],
  },
];

const reasons = [
  {
    title: "익숙해서 바로 시작",
    text: "윷놀이의 기본 흐름을 그대로 살려 첫 판부터 규칙이 부담스럽지 않습니다.",
  },
  {
    title: "매 판 달라지는 변수",
    text: "초능력 카드와 저장 결과 선택이 같은 보드에서도 다른 결정을 만듭니다.",
  },
  {
    title: "짧아도 선명한 승부",
    text: "잡기, 보너스 던지기, 마지막 골인 방해가 한 턴마다 긴장감을 만듭니다.",
  },
];

const characterStories = [
  "누구보다 먼저 윷판 위 작은 발자국을 남긴 재빠른 길잡이. 몸집은 작지만, 남들이 놓친 길을 가장 먼저 찾아냅니다.",
  "천천히 걷는 것처럼 보여도 한 번 정한 길은 절대 놓치지 않는 든든한 완주자. 묵직한 한 걸음으로 판의 흐름을 자기 쪽으로 끌어옵니다.",
  "웃는 얼굴로 등장하지만, 승부처에서는 누구보다 과감하게 뛰어드는 윷판의 승부사. 상대 말을 잡는 순간 가장 크게 빛납니다.",
  "겁이 많아 보이지만 위기 앞에서는 누구보다 빠르게 방향을 바꾸는 영리한 도전자. 작은 틈 하나로도 판세를 뒤집을 줄 압니다.",
  "오래된 윷판의 흐름을 읽는 신비로운 전략가. 조용히 기다리다가 결정적인 순간에 큰 한 수를 내려놓습니다.",
  "말없이 판을 살피며 상대의 다음 움직임을 먼저 읽는 계산가. 보이지 않는 압박으로 상대를 불편하게 만드는 데 능합니다.",
  "시작 신호가 들리면 망설임 없이 달려 나가는 돌파형 주자. 멀리 돌아가는 길보다 빠르게 끝까지 밀어붙이는 승부를 좋아합니다.",
  "부드러운 미소 뒤에 흔들리지 않는 고집을 숨긴 평화로운 수호자. 함께 업힌 말들을 끝까지 지켜내며 차근차근 앞으로 나아갑니다.",
  "늘 장난스러운 표정으로 판을 어지럽히는 변수의 장인. 아무도 예상하지 못한 순간에 분위기를 자기 편으로 바꿉니다.",
  "새벽을 알리듯 결정적인 타이밍을 놓치지 않는 예리한 관찰자. 모두가 망설일 때 가장 먼저 다음 수를 외칩니다.",
  "한 번 편이 되면 끝까지 곁을 지키는 믿음직한 동료. 위기에는 앞장서고, 기회에는 함께 달리는 팀플레이에 강합니다.",
  "느긋하게 웃으며 판을 즐기는 행운의 마무리꾼. 불리한 순간에도 쉽게 흔들리지 않고, 마지막에 뜻밖의 복을 불러옵니다.",
];

export default function LandingPage({ onStart }: Props) {
  const [selectedCharacter, setSelectedCharacter] = useState(2);

  return (
    <main className="landing-page">
      <section className="landing-hero" aria-labelledby="landing-title">
        <img className="landing-hero-bg" src="/assets/generated/main-menu-screen-final.png" alt="" />
        <div className="landing-hero-shade" />
        <nav className="landing-nav" aria-label="메인">
          <img src="/assets/generated/yut-neungnyeokja-logo.png" alt="윷능력자" />
        </nav>

        <div className="landing-hero-grid">
          <div className="landing-hero-copy">
            <span className="landing-kicker">전통 윷놀이 x 초능력 배틀</span>
            <h1 id="landing-title">윷판을 뒤집는 한 수, 윷능력자</h1>
            <p>
              던지고, 업고, 잡고, 마지막에는 초능력 카드로 판세를 바꾸는 1:1 전략 윷놀이.
            </p>
            <div className="landing-stat-row" aria-label="게임 특징">
              <span><b>십이지신</b></span>
              <span><b>16</b>초능력</span>
              <span><b>1:1</b>대결</span>
            </div>
            <div className="landing-hero-actions">
              <button className="menu-button gold" onClick={onStart}>바로 시작</button>
              <a href="#landing-powers" className="landing-link-button">초능력 보기</a>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-band landing-identity" aria-labelledby="landing-identity-title">
        <div className="landing-section-head">
          <span>십이지신 캐릭터</span>
          <h2 id="landing-identity-title">열두 캐릭터가 전부 플레이어의 말이 됩니다</h2>
          <p>쥐부터 돼지까지 모든 십이지신을 고를 수 있고, 선택한 캐릭터는 보드 위 말과 결과 화면까지 이어집니다.</p>
        </div>
        <div className="landing-character-row">
          {characterNames.map((name, index) => (
            <button
              key={index}
              className={`landing-character-card ${selectedCharacter === index ? "active" : ""}`}
              onClick={() => setSelectedCharacter(index)}
              aria-pressed={selectedCharacter === index}
              aria-label={`${name} 소개 보기`}
            >
              <CharacterPortrait index={index} />
              <strong>{name}</strong>
            </button>
          ))}
        </div>
        <aside className="landing-character-story" aria-live="polite">
          <CharacterPortrait key={selectedCharacter} index={selectedCharacter} />
          <div>
            <span>캐릭터 이야기</span>
            <h3>{characterNames[selectedCharacter]}</h3>
            <p>{characterStories[selectedCharacter]}</p>
          </div>
        </aside>
      </section>

      <section className="landing-band landing-flow" aria-labelledby="landing-flow-title">
        <LandingGameplaySnapshot />
        <div className="landing-flow-copy">
          <span>플레이 루프</span>
          <h2 id="landing-flow-title">짧은 턴 안에 계속 선택지가 생깁니다</h2>
          <div className="landing-step-list">
            {playSteps.map((step) => (
              <article key={step.title}>
                <strong>{step.title}</strong>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-band landing-powers" id="landing-powers" aria-labelledby="landing-powers-title">
        <div className="landing-power-copy">
          <span>16종 초능력</span>
          <h2 id="landing-powers-title">운만 믿기엔, 카드가 너무 강합니다</h2>
          <p>자기 강화 7종과 공격 카드 9종을 모두 공개합니다. 어떤 카드를 언제 쓰느냐가 한 판의 클라이맥스입니다.</p>
        </div>
        <div className="landing-power-grid">
          {cardPreviews.map((card) => (
            <PowerCard key={card.kind} card={card} hidden={false} disabled onUse={() => {}} />
          ))}
        </div>
      </section>

      <section className="landing-band landing-combos" aria-labelledby="landing-combos-title">
        <div className="landing-section-head">
          <span>카드 조합</span>
          <h2 id="landing-combos-title">카드는 한 장씩 써도, 전략은 묶어서 굴러갑니다</h2>
          <p>어떤 능력을 먼저 뽑았는지에 따라 빠른 완주, 역전 견제, 결승 방해처럼 판의 성격이 달라집니다.</p>
        </div>
        <div className="landing-combo-grid">
          {cardCombos.map((combo) => (
            <article key={combo.title} className="landing-combo-card">
              <div className="landing-combo-cards">
                {combo.cards.map((card) => (
                  <PowerCard key={card.kind} card={card} hidden={false} disabled onUse={() => {}} />
                ))}
              </div>
              <strong>{combo.title}</strong>
              <p>{combo.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-band landing-round" aria-labelledby="landing-round-title">
        <div className="landing-section-head">
          <span>한 판의 흐름</span>
          <h2 id="landing-round-title">던진 결과가 선택이 되고, 선택이 역전이 됩니다</h2>
        </div>
        <ol className="landing-round-track">
          {roundFlow.map((step, index) => (
            <li key={step}>
              <b>{index + 1}</b>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="landing-band landing-moment" aria-labelledby="landing-moment-title">
        <div className="landing-moment-art">
          <img src="/assets/assets3/호랑이 승리.png" alt="호랑이 승리 장면" />
          <img src="/assets/assets3/토끼 패배.png" alt="토끼 패배 장면" />
        </div>
        <div className="landing-moment-copy">
          <span>승패 리액션</span>
          <h2 id="landing-moment-title">마지막 말 하나까지 살아있는 한 판</h2>
          <p>따뜻한 한옥풍 화면, 캐릭터 표정, 윷 던지기 효과음이 짧은 판에도 확실한 긴장감을 만듭니다.</p>
        </div>
      </section>

      <section className="landing-band landing-reasons" aria-labelledby="landing-reasons-title">
        <div className="landing-section-head">
          <span>왜 윷능력자인가</span>
          <h2 id="landing-reasons-title">익숙한 윷판 위에, 매번 다른 선택지를 얹었습니다</h2>
        </div>
        <div className="landing-reason-grid">
          {reasons.map((reason) => (
            <article key={reason.title}>
              <strong>{reason.title}</strong>
              <p>{reason.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-final-cta" aria-labelledby="landing-final-title">
        <div className="landing-final-stage">
          <img className="landing-final-character" src="/assets/generated/landing-final-characters/tiger-win-cutout.png" alt="호랑이 승리 캐릭터" />
          <div className="landing-final-copy">
            <span>첫 판 준비 완료</span>
            <h2 id="landing-final-title">당신의 첫 능력자는 누구인가요?</h2>
            <p>닉네임을 만들고, 십이지신 캐릭터와 시작 초능력 2장을 뽑아 바로 한 판을 시작하세요.</p>
            <button className="menu-button gold" onClick={onStart}>내 능력자 고르기</button>
          </div>
          <img className="landing-final-character" src="/assets/generated/landing-final-characters/dragon-win-cutout.png" alt="용 승리 캐릭터" />
        </div>
      </section>
    </main>
  );
}
