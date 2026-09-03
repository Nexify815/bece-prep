import { createContext, useContext, useState, useCallback, useRef } from "react";

const SnackContext = createContext(() => {});

export function SnackProvider({ children }) {
  const [msg, setMsg] = useState("");
  const [show, setShow] = useState(false);
  const timer = useRef(null);

  const showSnack = useCallback((text) => {
    setMsg(text);
    setShow(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setShow(false), 2600);
  }, []);

  return (
    <SnackContext.Provider value={showSnack}>
      {children}
      <div className={"snackbar" + (show ? " show" : "")} role="alert">
        {msg}
      </div>
    </SnackContext.Provider>
  );
}

export function useSnack() {
  return useContext(SnackContext);
}
