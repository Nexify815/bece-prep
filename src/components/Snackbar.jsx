import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

const SnackContext = createContext(() => {});

export function SnackProvider({ children }) {
  const [msg, setMsg] = useState(null);
  const [show, setShow] = useState(false);
  const timer = useRef(null);

  // a pending toast must not fire setState after the provider unmounts
  useEffect(() => () => clearTimeout(timer.current), []);

  // `text` is a string or a node (callers can drop Lucide icons straight in).
  // `icon` optionally renders one ahead of the text for success/failure toasts.
  const showSnack = useCallback((text, icon) => {
    setMsg(icon ? { icon, text } : { text });
    setShow(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setShow(false), 2600);
  }, []);

  return (
    <SnackContext.Provider value={showSnack}>
      {children}
      <div
        className={"snackbar" + (show ? " show" : "")}
        role="alert"
        aria-live="polite"
        aria-hidden={!show}
      >
        {msg?.icon && (
          <span className="snackbar-icon">
            <msg.icon size={18} aria-hidden="true" />
          </span>
        )}
        <span className="snackbar-text">{msg?.text}</span>
      </div>
    </SnackContext.Provider>
  );
}

export function useSnack() {
  return useContext(SnackContext);
}