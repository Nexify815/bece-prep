export default function ConfirmDialog({ title, message, confirmLabel = "Leave", cancelLabel = "Stay", onConfirm, onCancel }) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="card modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">{title}</div>
        <p className="modal-def">{message}</p>
        <div className="spacer" />
        <button className="btn btn-danger mt" onClick={onConfirm}>
          {confirmLabel}
        </button>
        <button className="btn btn-secondary mt" onClick={onCancel}>
          {cancelLabel}
        </button>
      </div>
    </div>
  );
}