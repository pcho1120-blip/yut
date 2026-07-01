import { PathName } from "@/types/game";

export default function PathChoiceModal({ choices, onChoose }: { choices: PathName[]; onChoose: (path: PathName) => void }) {
  const shortcut = choices.find((choice) => choice !== "outer") || choices[0];
  return (
    <div className="modal-backdrop">
      <section className="small-modal">
        <h2>어느 길로 이동할까요?</h2>
        <div className="modal-actions">
          <button onClick={() => onChoose("outer")}>외곽길</button>
          <button onClick={() => onChoose(shortcut)}>지름길</button>
        </div>
      </section>
    </div>
  );
}
