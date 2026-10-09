import Modal from "./Modal.jsx";
import { LuTriangleAlert } from "react-icons/lu";

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Leave",
  cancelLabel = "Stay",
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      title={title}
      icon={LuTriangleAlert}
      tone="warn"
      onCancel={onCancel}
      actions={
        <>
          <button className="focus-btn" onClick={onConfirm}>
            {confirmLabel}
          </button>
          <button className="focus-link" onClick={onCancel}>
            {cancelLabel}
          </button>
        </>
      }
    >
      <p className="modal-def">{message}</p>
    </Modal>
  );
}