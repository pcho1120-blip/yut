import { formatTime } from "@/lib/gameRules";

export default function TurnTimer({ seconds }: { seconds: number }) {
  return <span className={seconds <= 10 ? "timer danger" : "timer"}>{formatTime(seconds)}</span>;
}
