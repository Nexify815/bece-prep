import ReadButton from "./ReadButton.jsx";

// Shows the bonus "formula" and "how to use it" cards when a glossary term
// (or lesson term) has them. Renders nothing otherwise, so older data with
// just term/definition/example is unaffected.
export default function TermExtras({ term }) {
  if (!term || (!term.formula && !term.howTo)) return null;
  const readText = [
    term.formula ? `Formula. ${term.formula}` : "",
    term.howTo ? `How to use it. ${term.howTo}` : "",
  ].filter(Boolean).join(". ");
  return (
    <div className="term-extras">
      {term.formula && (
        <div className="term-box term-formula">
          <span className="term-box-label">Formula</span>
          <code className="term-formula-text">{term.formula}</code>
        </div>
      )}
      {term.howTo && (
        <div className="term-box term-howto">
          <span className="term-box-label">How to use it</span>
          <p className="term-howto-text">{term.howTo}</p>
        </div>
      )}
      <ReadButton text={readText} className="read-inline" />
    </div>
  );
}