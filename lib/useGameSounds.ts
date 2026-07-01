"use client";

import { useEffect, useRef } from "react";
import { GameState, PlayerId, YutResult } from "@/types/game";

type SoundName = "click" | "throw" | "result" | "bonus" | "fall" | "capture" | "card" | "turn" | "win" | "lose";

const AudioCtor = () => window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

const voiceLines: Record<YutResult["baseId"], string> = {
  backdo: "빽도~! 살짝만 뒤로 가자!",
  do: "도~! 한 칸 출발!",
  gae: "개~! 두 칸 간다!",
  geol: "걸~! 세 칸 쭉쭉!",
  yut: "윷이다~! 한 번 더!",
  mo: "모오오~! 최고야!",
  fall: "낙이야! 아이고, 아깝다아~!",
};

const voiceClips: Record<YutResult["baseId"], string> = {
  backdo: "/assets/voices/01_backdo.mp3",
  do: "/assets/voices/02_do.mp3",
  gae: "/assets/voices/03_gae.mp3",
  geol: "/assets/voices/04_geol.mp3",
  yut: "/assets/voices/05_yut.mp3",
  mo: "/assets/voices/06_mo.mp3",
  fall: "/assets/voices/07_nak.mp3",
};

const voiceEnergy: Record<YutResult["baseId"], { pitch: number; rate: number; motif: number[] }> = {
  backdo: { pitch: 1.42, rate: 1.04, motif: [740, 659, 523] },
  do: { pitch: 1.5, rate: 1.08, motif: [784, 988] },
  gae: { pitch: 1.56, rate: 1.1, motif: [880, 1109] },
  geol: { pitch: 1.62, rate: 1.12, motif: [988, 1245, 1568] },
  yut: { pitch: 1.7, rate: 1.15, motif: [1175, 1568, 1760] },
  mo: { pitch: 1.78, rate: 1.17, motif: [1319, 1760, 2093] },
  fall: { pitch: 1.48, rate: 1.08, motif: [523, 440, 392] },
};

class SoundEngine {
  private context: AudioContext | null = null;
  private unlocked = false;
  private muted = false;
  private bgmTimer: number | null = null;
  private bgmStep = 0;
  private bgmRequested = false;
  private bgmMode: "menu" | "game" | "win" | "lose" | null = null;
  private voiceAudio: HTMLAudioElement | null = null;

  unlock() {
    if (this.muted) return;
    const Ctor = AudioCtor();
    if (!Ctor) return;
    if (!this.context) this.context = new Ctor();
    this.context.resume().catch(() => {});
    this.unlocked = true;
    if (this.bgmRequested) this.startBgm(this.bgmMode || "menu");
  }

  play(name: SoundName) {
    if (this.muted || !this.unlocked) return;
    const ctx = this.context;
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});

    if (name === "click") this.tone(620, 0.025, 0.035, "triangle");
    if (name === "throw") this.throwWood();
    if (name === "result") this.chime([520, 660], 0.05, 0.06);
    if (name === "bonus") this.chime([620, 840, 1040], 0.06, 0.07);
    if (name === "fall") this.chime([260, 180], 0.08, 0.08);
    if (name === "capture") this.hit(130, 0.11, 0.18);
    if (name === "card") this.chime([440, 660, 990], 0.04, 0.055);
    if (name === "turn") this.chime([360, 480], 0.035, 0.05);
    if (name === "win") this.chime([520, 660, 780, 1040], 0.1, 0.12);
    if (name === "lose") this.chime([360, 300, 240], 0.09, 0.11);
  }

  startBgm(mode: "menu" | "game" | "win" | "lose" = "game") {
    this.bgmRequested = true;
    if (this.bgmMode !== mode) this.stopBgm(false);
    this.bgmMode = mode;
    if (this.muted || !this.unlocked || this.bgmTimer !== null) return;
    const playStep = () => {
      const melody =
        mode === "game"
          ? [523, 659, 784, 659, 587, 698, 880, 698]
          : mode === "win"
            ? [784, 988, 1175, 1319, 1175, 988, 1047, 1319]
            : mode === "lose"
              ? [392, 349, 330, 294, 330, 349, 392, 330]
              : [659, 784, 880, 784, 698, 784, 988, 880];
      const bass =
        mode === "game"
          ? [196, 196, 220, 220, 174, 174, 196, 196]
          : mode === "win"
            ? [262, 330, 392, 392, 349, 294, 330, 392]
            : mode === "lose"
              ? [196, 196, 174, 174, 165, 165, 147, 147]
              : [262, 262, 294, 294, 247, 247, 262, 262];
      const index = this.bgmStep % melody.length;
      const isResult = mode === "win" || mode === "lose";
      this.tone(
        melody[index],
        mode === "lose" ? 0.28 : mode === "game" ? 0.16 : 0.13,
        mode === "win" ? 0.018 : mode === "lose" ? 0.012 : mode === "game" ? 0.018 : 0.013,
        mode === "lose" ? "sine" : "triangle",
      );
      if (index % 2 === 0) this.tone(bass[index], isResult ? 0.28 : 0.2, mode === "lose" ? 0.009 : mode === "game" ? 0.012 : 0.008, "sine");
      if (mode === "win" && index % 4 === 0) this.chime([1047, 1319], 0.06, 0.022);
      if (!isResult && index % 4 === 0) this.softTap();
      this.bgmStep += 1;
      this.bgmTimer = window.setTimeout(playStep, mode === "lose" ? 520 : mode === "game" ? 360 : 420);
    };
    playStep();
  }

  stopBgm(clearRequest = true) {
    if (clearRequest) this.bgmRequested = false;
    if (this.bgmTimer !== null) window.clearTimeout(this.bgmTimer);
    this.bgmTimer = null;
    this.bgmMode = null;
  }

  announceResult(baseId: YutResult["baseId"] | null) {
    if (!baseId) return;
    this.playVoiceClip(baseId);
  }

  private now() {
    return this.context?.currentTime || 0;
  }

  private tone(frequency: number, duration: number, volume: number, type: OscillatorType = "sine", delay = 0) {
    const ctx = this.context;
    if (!ctx) return;
    const start = this.now() + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  private chime(frequencies: number[], duration: number, volume: number) {
    frequencies.forEach((frequency, index) => this.tone(frequency, duration, volume, "sine", index * duration * 0.8));
  }

  private hit(frequency: number, duration: number, volume: number, delay = 0) {
    const ctx = this.context;
    if (!ctx) return;
    const start = this.now() + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(frequency, start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(50, frequency * 0.55), start + duration);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  private softTap(delay = 0) {
    this.hit(220, 0.035, 0.018, delay);
    this.hit(330, 0.025, 0.012, delay + 0.035);
  }

  private noise(duration: number, volume: number, delay = 0) {
    const ctx = this.context;
    if (!ctx) return;
    const start = this.now() + delay;
    const buffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * duration)), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) data[index] = (Math.random() * 2 - 1) * (1 - index / data.length);
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(920, start);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.buffer = buffer;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start(start);
  }

  private throwWood() {
    this.noise(0.16, 0.06);
    this.hit(260, 0.045, 0.07, 0.04);
    this.hit(190, 0.055, 0.08, 0.11);
    this.hit(150, 0.06, 0.09, 0.19);
    this.hit(118, 0.075, 0.1, 0.29);
    this.noise(0.08, 0.045, 0.31);
  }

  private playVoiceClip(baseId: YutResult["baseId"]) {
    if (!this.unlocked) return;
    const audio = new Audio(voiceClips[baseId]);
    audio.volume = 0.9;
    this.voiceAudio?.pause();
    this.voiceAudio = audio;
    audio.play().catch(() => this.cuteVoice(baseId));
  }

  private cuteVoice(baseId: YutResult["baseId"]) {
    const energy = voiceEnergy[baseId];
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(voiceLines[baseId]);
      const voices = window.speechSynthesis.getVoices();
      utterance.lang = "ko-KR";
      utterance.voice =
        voices.find((voice) => voice.lang.toLowerCase().startsWith("ko") && /female|yuna|유나|google/i.test(voice.name)) ||
        voices.find((voice) => voice.lang.toLowerCase().startsWith("ko")) ||
        null;
      utterance.pitch = energy.pitch;
      utterance.rate = energy.rate;
      utterance.volume = 0.9;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }

    energy.motif.forEach((frequency, index) => {
      this.tone(frequency, 0.09, 0.045, "triangle", index * 0.075);
      this.tone(frequency * 1.5, 0.055, 0.018, "sine", index * 0.075 + 0.012);
    });
    this.tone(energy.motif[energy.motif.length - 1] * 1.25, 0.08, 0.026, "square", energy.motif.length * 0.075 + 0.02);
  }
}

interface SoundSnapshot {
  screen: GameState["screen"];
  currentPlayer: PlayerId;
  isThrowing: boolean;
  lastRollId: string | null;
  lastRollBase: YutResult["baseId"] | null;
  logHead: string;
  myUsed: number;
  aiUsed: number;
  winner: PlayerId | null;
}

function snapshot(state: GameState): SoundSnapshot {
  return {
    screen: state.screen,
    currentPlayer: state.currentPlayer,
    isThrowing: state.isThrowing,
    lastRollId: state.lastRollResult?.id || null,
    lastRollBase: state.lastRollResult?.baseId || null,
    logHead: state.gameLog[0] || "",
    myUsed: state.players.me.usedCards.length,
    aiUsed: state.players.ai.usedCards.length,
    winner: state.winner,
  };
}

export function useGameSounds(state: GameState) {
  const engineRef = useRef<SoundEngine | null>(null);
  const previousRef = useRef<SoundSnapshot | null>(null);

  if (!engineRef.current && typeof window !== "undefined") engineRef.current = new SoundEngine();

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const engine = engineRef.current;
      if (!engine) return;
      engine.unlock();
      const target = event.target as HTMLElement | null;
      if (target?.closest("button:not(:disabled)")) engine.play("click");
    };
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const prev = previousRef.current;
    const next = snapshot(state);
    previousRef.current = next;
    if (!prev) return;

    if (!prev.isThrowing && next.isThrowing) engine.play("throw");
    if (prev.lastRollId !== next.lastRollId && next.lastRollId) {
      if (next.lastRollBase === "fall") engine.play("fall");
      else if (next.lastRollBase === "yut" || next.lastRollBase === "mo") engine.play("bonus");
      else engine.play("result");
      engine.announceResult(next.lastRollBase);
    }
    if (prev.logHead !== next.logHead && next.logHead.includes("잡기 성공")) engine.play("capture");
    if (prev.myUsed !== next.myUsed || prev.aiUsed !== next.aiUsed) engine.play("card");
    if (prev.currentPlayer !== next.currentPlayer && next.screen === "game") engine.play("turn");
    if (prev.winner !== next.winner && next.winner) engine.play(next.winner === "me" ? "win" : "lose");
    if (next.screen === "game") engine.startBgm("game");
    else if (next.screen === "result" && next.winner) engine.startBgm(next.winner === "me" ? "win" : "lose");
    else engine.startBgm("menu");
  }, [state]);

  useEffect(() => () => engineRef.current?.stopBgm(), []);
}
