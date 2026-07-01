"use client";

interface Props {
  nickname: string;
  onNickname: (value: string) => void;
  onNext: () => void;
}

export default function NicknameScreen({ nickname, onNickname, onNext }: Props) {
  return (
    <main className="nickname-screen">
      <img className="nickname-bg" src="/assets/nickname/nickname-bg.png" alt="" />
      <section className="nickname-card" aria-label="닉네임 만들기">
        <h1>닉네임 만들기</h1>
        <input
          value={nickname}
          maxLength={10}
          onChange={(event) => onNickname(event.target.value)}
          className="nickname-input"
          aria-label="닉네임"
          placeholder="닉네임"
        />
        <button className="menu-button gold" onClick={onNext} disabled={!nickname.trim()}>
          생성하기
        </button>
      </section>
    </main>
  );
}
