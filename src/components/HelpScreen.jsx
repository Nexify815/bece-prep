import { QUIZ_SESSION } from "../lib/plan.js";

export default function HelpScreen() {
  return (
    <div>
      <h1 className="section-title">Help</h1>

      <div className="card sets-card">
        <div className="sets-title">How the practice questions work</div>
        <p className="sets-para">
          Every subject&rsquo;s questions are grouped into three fixed sets by
          difficulty. You don&rsquo;t face them all at once &mdash; each run is
          a <b>{QUIZ_SESSION}-question session</b>, and every session feeds you
          questions you haven&rsquo;t solved yet until the whole set is done.
        </p>
        <p className="sets-para muted">
          Finish a question and it stays solved. Solve all a set&rsquo;s
          questions, and the set is complete.
        </p>
      </div>

      <div className="card how-card">
        <div className="section-title">How to study</div>
        <ol className="how-list">
          <li>
            <b>Stairs first.</b> Learn each lesson then answer its questions.
            One unlocked step at a time.
          </li>
          <li>
            <b>Glossary next.</b> Tap a term to learn it &mdash; 5 new words a
            day beats 50 you forget.
          </li>
          <li>
            <b>Quiz after.</b> One run = one full set. Each subject has Easy,
            Medium and Hard sets of questions &mdash; pick a level and answer
            every question of that set.
          </li>
          <li>
            <b>Fix mistakes.</b> Review brings wrong answers back until you get
            them right.
          </li>
        </ol>
      </div>
    </div>
  );
}
