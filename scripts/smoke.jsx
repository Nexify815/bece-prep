// Render smoke test.
//
// The build cannot catch a ReferenceError in JSX: `onClick={next}` compiles
// fine and only throws when the identifier is evaluated. That shipped a crash
// into the guided tour. This actually renders the components, so that class of
// bug fails here instead of in front of a student.
//
// Run: npm run smoke
import { renderToString } from "react-dom/server";
import { createElement as h } from "react";

// --- minimal browser shims the components touch at import/render time --------
if (typeof window === "undefined") {
  globalThis.window = {
    addEventListener() {},
    removeEventListener() {},
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
    innerWidth: 1280,
    innerHeight: 800,
    location: { hash: "" },
    localStorage: {
      _d: {},
      getItem(k) { return this._d[k] ?? null; },
      setItem(k, v) { this._d[k] = String(v); },
      removeItem(k) { delete this._d[k]; },
    },
  };
}
if (typeof document === "undefined") {
  globalThis.document = {
    documentElement: { setAttribute() {}, getAttribute: () => null },
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener() {},
    removeEventListener() {},
    createElement: () => ({ style: {}, setAttribute() {}, appendChild() {} }),
    body: { appendChild() {}, style: {} },
  };
}
if (typeof navigator === "undefined") {
  globalThis.navigator = { onLine: true, userAgent: "node" };
}

const results = [];

function smoke(name, fn) {
  try {
    fn();
    results.push({ name, ok: true });
  } catch (e) {
    results.push({ name, ok: false, err: e && e.message ? e.message : String(e) });
  }
}

async function run() {
  // --- the onboarding screens (plain presentational, no app context) --------
  const OnboardingTour = (await import("../src/components/OnboardingTour.jsx")).default;
  const WelcomeScreen = (await import("../src/components/WelcomeScreen.jsx")).default;
  const Modal = (await import("../src/components/Modal.jsx")).default;
  const ConfirmDialog = (await import("../src/components/ConfirmDialog.jsx")).default;
  const Mascot = (await import("../src/components/Mascot.jsx")).default;
  const Toast = (await import("../src/components/Snackbar.jsx")).SnackProvider;

  const steps = [
    { selector: '[data-tour="a"]', Icon: Mascot, title: "t", body: "b" },
    { selector: '[data-tour="b"]', Icon: Mascot, title: "t", body: "b" },
  ];

  smoke("OnboardingTour", () =>
    renderToString(h(OnboardingTour, { steps, onFinish() {} }))
  );
  smoke("WelcomeScreen", () =>
    renderToString(h(WelcomeScreen, { initialName: "", initialGoalSecs: 3600, onStart() {}, onSkip() {} }))
  );
  smoke("Modal", () =>
    renderToString(h(Modal, { title: "t", children: "body", onCancel() {}, actions: null }))
  );
  smoke("ConfirmDialog", () =>
    renderToString(h(ConfirmDialog, { title: "Leave?", message: "sure?", onConfirm() {}, onCancel() {} }))
  );
  smoke("Mascot", () => renderToString(h(Mascot, { size: 20 })));
  smoke("Mascot happy", () => renderToString(h(Mascot, { size: 20, happy: true })));
  smoke("SnackProvider", () => renderToString(h(Toast, { children: "child" })));

  const failed = results.filter((r) => !r.ok);
  results.forEach((r) => console.log((r.ok ? "  pass  " : "  FAIL  ") + r.name + (r.err ? "\n         " + r.err : "")));
  console.log(
    "\n" + (results.length - failed.length) + "/" + results.length + " components rendered"
  );
  if (failed.length) {
    console.error("\nsmoke test FAILED");
    process.exit(1);
  }
}

run();
