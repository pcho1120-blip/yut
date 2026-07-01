export default function SurrenderModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="modal-backdrop">
      <section className="small-modal">
        <h2>정말 포기할까요?</h2>
        <p>포기하면 이번 게임은 패배 처리됩니다.</p>
        <div className="modal-actions">
          <button onClick={onCancel}>계속 플레이</button>
          <button className="danger" onClick={onConfirm}>포기하기</button>
        </div>
      </section>
    </div>
  );
}
