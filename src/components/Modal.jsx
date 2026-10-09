import { useEffect } from "react";
import { LuX } from "react-icons/lu";

// One modal for every overlay in the app.
//
// On a phone it is a bottom sheet, because that is the shape a thumb expects.
// On a desktop it centres instead — a sheet glued to the bottom of a 1440px
// screen reads as a bug, not a dialog. Escape and backdrop-click both cancel.
export default function Modal({
  title,
  icon: Icon,
  tone = "default",
  onCancel,
  children,
  actions,
  closeLabel = "Close",
}) {
  useEffect(() => {
    if (!onCancel) return;
    const onKey = (e) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div
        className={"modal modal-" + tone}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        {(Icon || onCancel) && (
          <div className="modal-top">
            {Icon && (
              <span className={"modal-icon modal-icon-" + tone}>
                <Icon size={22} color="#fff" />
              </span>
            )}
            {onCancel && (
              <button className="modal-close" onClick={onCancel} aria-label={closeLabel}>
                <LuX size={18} />
              </button>
            )}
          </div>
        )}

        {title && <div className="modal-title">{title}</div>}
        {children}

        {actions && <div className="modal-actions">{actions}</div>}
      </div>
    </div>
  );
}