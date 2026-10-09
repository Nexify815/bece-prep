// FocusLayout — the shell for "do one thing" screens (lesson, quiz, practice).
//
// The rule that stops a desktop looking like a stretched phone: the task always
// lives in a 560px column, and any spare width becomes a context panel instead
// of a wider card. On a phone there is no panel and the actions stick above the
// bottom nav.
export default function FocusLayout({ title, count, progress = 0, children, actions, panel }) {
  return (
    <div className="focus-layout">
      <section className="focus-main">
        <div className="focus-head">
          <span className="focus-title">{title}</span>
          {count != null && <span className="focus-count">{count}</span>}
        </div>
        <div className="focus-bar">
          <span style={{ width: Math.max(0, Math.min(100, progress)) + "%" }} />
        </div>

        <div className="focus-body">{children}</div>

        {actions && <div className="focus-actions">{actions}</div>}
      </section>

      {panel && <aside className="focus-panel">{panel}</aside>}
    </div>
  );
}
