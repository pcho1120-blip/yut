"use client";

import { useState } from "react";
import CharacterSelectScreen from "@/components/CharacterSelectScreen";
import GameBoard from "@/components/GameBoard";
import GameResultModal from "@/components/GameResultModal";
import LandingPage from "@/components/LandingPage";
import NicknameScreen from "@/components/NicknameScreen";
import PathChoiceModal from "@/components/PathChoiceModal";
import PlayerPanel from "@/components/PlayerPanel";
import PowerEffectOverlay from "@/components/PowerEffectOverlay";
import PowerSelectScreen from "@/components/PowerSelectScreen";
import SurrenderModal from "@/components/SurrenderModal";
import TurnStatusBar from "@/components/TurnStatusBar";
import YutThrowArea from "@/components/YutThrowArea";
import { useGameSounds } from "@/lib/useGameSounds";
import { useYutGame } from "@/lib/useYutGame";

export default function YutGame() {
  const game = useYutGame();
  useGameSounds(game.state);
  const [nickname, setNickname] = useState("나");
  const [avatarIndex, setAvatarIndex] = useState(2);

  if (game.state.screen === "start") {
    return <LandingPage onStart={game.goNickname} />;
  }

  if (game.state.screen === "nickname") {
    return (
      <NicknameScreen
        nickname={nickname}
        onNickname={setNickname}
        onNext={game.openCharacterSelect}
      />
    );
  }

  if (game.state.screen === "select") {
    return (
      <CharacterSelectScreen
        selected={avatarIndex}
        nickname={nickname}
        onSelect={setAvatarIndex}
        onBack={game.goNickname}
        onStart={() => game.startMatch(nickname, avatarIndex)}
      />
    );
  }

  if (game.state.screen === "powerSelect") {
    return (
      <PowerSelectScreen
        player={game.state.players.me}
        opponent={game.state.players.ai}
        onBack={game.openCharacterSelect}
        onStart={game.beginGame}
      />
    );
  }

  if (game.state.screen === "result") {
    return <GameResultModal state={game.state} onReset={game.reset} />;
  }

  return (
    <main className="game-shell">
      <TurnStatusBar state={game.state} />
      <section className="play-layout">
        <PlayerPanel
          side="opponent"
          player={game.state.players.ai}
          pieces={game.state.pieces}
          currentPlayer={game.state.currentPlayer}
          cardsDisabled={game.state.isThrowing}
          phase={game.state.phase}
          selectedResultId={game.state.selectedResultId}
          storedResults={game.state.storedResults}
          hasSelectionIntent={!!game.state.selectionIntent}
          onUseCard={game.usePowerCard}
          canUsePower={game.canUsePower}
          onPiece={game.selectPiece}
        />
        <GameBoard
          state={game.state}
          stacks={game.stacks}
          onPiece={game.selectPiece}
          onNode={game.selectBoardNode}
        />
        <PlayerPanel
          side="mine"
          player={game.state.players.me}
          pieces={game.state.pieces}
          currentPlayer={game.state.currentPlayer}
          cardsDisabled={game.state.isThrowing}
          phase={game.state.phase}
          selectedResultId={game.state.selectedResultId}
          storedResults={game.state.storedResults}
          hasSelectionIntent={!!game.state.selectionIntent}
          onUseCard={game.usePowerCard}
          canUsePower={game.canUsePower}
          onPiece={game.selectPiece}
        />
      </section>
      <YutThrowArea
        state={game.state}
        onRoll={game.rollYut}
        onResult={game.selectResult}
        onEndTurn={game.endTurn}
        onSurrender={() => game.toggleSurrender(true)}
      />
      {game.state.pendingPathChoice && <PathChoiceModal choices={game.state.pendingPathChoice.choices} onChoose={game.choosePath} />}
      <PowerEffectOverlay state={game.state} />
      {game.state.surrenderModalOpen && (
        <SurrenderModal onCancel={() => game.toggleSurrender(false)} onConfirm={game.surrender} />
      )}
    </main>
  );
}
