import { useState, useEffect, useRef, useMemo } from "react";
import { FiTarget, FiFileText, FiZap, FiFlag, FiRefreshCw, FiArrowRight, FiCheck } from "react-icons/fi";
import { LuGraduationCap } from "react-icons/lu";
import { SUBJECTS, getQuestion } from "../data/index.js";
import { isCorrectAnswer } from "../lib/answer.js";
import { navigate } from "../lib/router.js";
import { dateKey, todayKey } from "../lib/dates.js";
import {
  activeSubject,
  subjectLabel,
  subjectTopics,
  coverageFor,
  highYieldTopics,
  weakTopics,
  recommendNext,
  daysUntil,
  blitzPool,
  questionTopic,
} from "../lib/exam.js";
import { playRight, playWrong, playTick, playWin } from "../lib/sound.js";
import Mascot from "./Mascot.jsx";
import PastPapers from "./PastPapers.jsx";

const CONFIDENCE = [
  { n: 1, label: "Lost" },
  { n: 2, label: "Shaky" },
  { n: 3, label: "Okay" },
  { n: 4, label: "Ready" },
  { n: 5, label: "Crushing" },
];

const SESSION_ICON = { paper: "\u{1F4C4}", blitz: "\u26A1", weak: "\u{1F3AF}" };

const chosenKeys = (examMode) => {
  const keys =
    examMode && Array.isArray(examMode.subjects) && examMode.subjects.length > 0
      ? examMode.subjects
      : SUBJECTS.map((s) => s.key);
  return keys.filter((k) => SUBJECTS.some((s) => s.key === k));
};

function CoverageBar({ pct }) {
  return (
    <div className="progress-bar">
      <div className="progress-fill" style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  );
}

function Countdown({ days }) {
  if (days === null) {
    return <p className="exam-countdown muted">Set an exam date to start the countdown.</p>;
  }
  if (days < 0) {
    return (
      <p className="exam-countdown exam-countdown-past">
        Exam passed — start cramming for the next one.
      </p>
    );
  }
  if (days === 0) {
    return (
      <p className="exam-countdown exam-countdown-urgent">
        <span className="exam-countdown-number">{`Today`}</span> is exam day. You've got this.
      </p>
    );
  }
  return (
    <p className="exam-countdown">
      <span className="exam-countdown-number">{days}</span>{" "}
      {days === 1 ? "day" : "days"} until your exam
    </p>
  );
}

function SetupScreen({ examMode, onSaveExam }) {
  const min = todayKey();
  const [draftDate, setDraftDate] = useState(examMode.date || dateKey(new Date(Date.now() + 7 * 86400000)));
  const [draftSubjects, setDraftSubjects] = useState((examMode.subjects || []).slice());

  const toggle = (key) => {
    setDraftSubjects((cur) =>
      cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]
    );
  };

  const save = () => {
    if (!draftDate) return;
    onSaveExam((m) => ({ ...m, date: draftDate, subjects: draftSubjects }));
  };

  return (
    <div className="center">
      <div className="exam-header">
        <LuGraduationCap size={30} color="var(--xp-gold)" />
        <h2 className="results-title">Exam Mode</h2>
        <p className="muted">No hearts. No XP. No locks. Just revision before the big day.</p>
      </div>
      <div className="card mt">
        <div className="section-title" style={{ marginTop: 0 }}>When is your exam?</div>
        <input
          className="txt-input mt"
          type="date"
          min={min}
          value={draftDate}
          onChange={(e) => setDraftDate(e.target.value)}
        />
        <div className="section-title mt">Which subjects are you cramming?</div>
        <div className="chip-row mt">
          {SUBJECTS.map((s) => {
            const on = draftSubjects.length === 0 || draftSubjects.includes(s.key);
            return (
              <button
                key={s.key}
                className={"subject-chip" + (on ? " on" : "")}
                onClick={() => toggle(s.key)}
              >
                {s.icon} {s.name}
              </button>
            );
          })}
        </div>
        {draftSubjects.length === 0 && (
          <p className="muted hint mt">None chosen? That means all four subjects.</p>
        )}
        <button className="btn btn-primary mt" disabled={!draftDate} onClick={save}>
          Start cramming <FiArrowRight />
        </button>
      </div>
    </div>
  );
}

export default function ExamMode({ examMode, wrongAnswers, onSaveExam }) {
  const keys = chosenKeys(examMode);
  const [activeKey, setActiveKey] = useState(() => keys[0] || SUBJECTS[0].key);
  const [editing, setEditing] = useState(false);
  const current = keys.includes(activeKey) ? activeKey : keys[0] || SUBJECTS[0].key;

  if (!examMode.date || editing) {
    return (
      <SetupScreen
        examMode={examMode}
        onSaveExam={(m) => {
          onSaveExam(m);
          setEditing(false);
        }}
      />
    );
  }

  const days = daysUntil(examMode.date);
  const topics = subjectTopics(current);
  const cov = coverageFor((examMode.syllabus || {})[current], topics);
  const weak = weakTopics(wrongAnswers, current).slice(0, 3);
  const yieldTopics = highYieldTopics(current);
  const rec = recommendNext(current, (examMode.syllabus || {})[current]);
  const conf = (examMode.confidence || {})[current] || 0;
  const sessions = (examMode.sessions || []).slice(-8).reverse();

  const setConf = (n) =>
    onSaveExam((m) => ({ ...m, confidence: { ...(m.confidence || {}), [current]: n } }));

  return (
    <div>
      <div className="exam-header">
        <LuGraduationCap size={26} color="var(--xp-gold)" />
        <span className="section-title" style={{ margin: 0 }}>Exam Mode</span>
        <button className="btn btn-sm btn-secondary" onClick={() => setEditing(true)}>
          Change setup
        </button>
      </div>

      {keys.length > 1 && (
        <div className="chip-row mt">
          {keys.map((k) => (
            <button
              key={k}
              className={"subject-chip" + (k === current ? " on" : "")}
              onClick={() => setActiveKey(k)}
            >
              {SUBJECTS.find((s) => s.key === k)?.icon} {subjectLabel(k)}
            </button>
          ))}
        </div>
      )}

      <div className="exam-countdown-card card mt">
        <Countdown days={days} />
        <p className="muted" style={{ marginTop: 4 }}>
          <b style={{ color: "var(--text-strong)" }}>{subjectLabel(current)}</b> &middot;{" "}
          {cov.pct}% of the syllabus covered
        </p>
        <CoverageBar pct={cov.pct} />
        {rec ? (
          <p className="exam-reco mt">
            <b>Next up:</b> {rec.name} — the most asked topic you haven't covered yet.
          </p>
        ) : (
          <p className="exam-reco mt exam-reco-done">
            Every high-yield topic is covered. Keep drilling past papers.
          </p>
        )}
      </div>

      <div className="row-title mt">Weakest topics</div>
      {weak.length === 0 ? (
        <p className="muted">No wrong answers logged yet — miss a few, then come back.</p>
      ) : (
        weak.map((t) => (
          <p key={t.name} className="exam-chip-list">
            <span className="exam-chip">{t.name}</span>
            <span className="muted">{t.count} wrong</span>
          </p>
        ))
      )}

      <div className="row-title mt">High-yield topics &middot; most asked in past papers</div>
      <div className="chip-row mt">
        {yieldTopics.map((t) => (
          <span key={t.name} className="subject-chip on static">
            {t.name} &times;{t.count}
          </span>
        ))}
      </div>

      <div className="card mt">
        <div className="section-title" style={{ marginTop: 0 }}>How confident do you feel?</div>
        <div className="chip-row mt">
          {CONFIDENCE.map((c) => (
            <button
              key={c.n}
              className={"subject-chip conf-chip" + (conf === c.n ? " on" : "")}
              onClick={() => setConf(c.n)}
            >
              {c.n} &middot; {c.label}
            </button>
          ))}
        </div>
        {conf > 0 && (
          <p className="muted mt">
            {conf >= 4
              ? "That's the spirit. One more past paper and you're set."
              : conf >= 2
              ? "Honest. The syllabus checklist + weak spots will fix that."
              : "Good to know — focus on the high-yield topics first."}
          </p>
        )}
      </div>

      <div className="exam-actions">
        <button className="btn btn-primary" onClick={() => navigate("/exam/paper?subject=" + current)}>
          <FiFileText /> Start past paper
        </button>
        <button className="btn btn-secondary" onClick={() => navigate("/exam/blitz?subject=" + current)}>
          <FiZap /> Quick recall blitz
        </button>
        <button
          className="btn btn-secondary"
          disabled={weakTopics(wrongAnswers, current).length === 0}
          onClick={() => navigate("/exam/weak?subject=" + current)}
        >
          <FiTarget /> Focus weak spots
        </button>
        <button className="btn btn-secondary" onClick={() => navigate("/exam/checklist?subject=" + current)}>
          <FiFlag /> Syllabus checklist
        </button>
        <button className="btn btn-secondary" onClick={() => navigate("/exam/cram?subject=" + current)}>
          <FiRefreshCw /> Cram sheet
        </button>
      </div>

      {sessions.length > 0 && (
        <div className="card mt">
          <div className="section-title" style={{ marginTop: 0 }}>Recent exam-mode sessions</div>
          {sessions.map((s, i) => (
            <p key={i} className="exam-session-row">
              <span>{SESSION_ICON[s.type] || "\u{1F4D6}"}</span>
              <span>{subjectLabel(s.subject)} &middot; {s.correct}/{s.total}</span>
              <span className="muted">{s.date}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export function ExamPaper({ subjectKey, onWrongAnswer, onResult }) {
  return (
    <PastPapers
      free
      scope={[subjectKey]}
      onWrongAnswer={onWrongAnswer}
      onResult={(correct, total, key) => {
        if (onResult) onResult("paper", key, correct, total);
      }}
    />
  );
}

function BlitzRun({ subjectKey, onWrongAnswer, onFinish, onRestart }) {
  const [questions] = useState(() => blitzPool(subjectKey).slice(0, 20));
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(5 * 60);
  const correctRef = useRef(0);
  const finishedRef = useRef(false);
  const startRef = useRef(Date.now());
  const [finished, setFinished] = useState(null);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const res = {
      correct: correctRef.current,
      total: questions.length,
      seconds: Math.round((Date.now() - startRef.current) / 1000),
    };
    setFinished(res);
    if (onFinish) onFinish(subjectKey, res.correct, res.total);
  };

  useEffect(() => {
    if (finished) return;
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [finished]);

  useEffect(() => {
    if (!finished) {
      if (secondsLeft === 0) finish();
      else if (secondsLeft <= 10) playTick();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, finished]);

  if (finished) {
    const pct = finished.total > 0 ? Math.round((finished.correct / finished.total) * 100) : 0;
    return (
      <div className="center">
        <Mascot className="mascot-big" happy={pct >= 70} />
        <h2 className="results-title">
          {finished.correct}/{finished.total} correct
        </h2>
        <p className="muted">{pct}% in {Math.ceil(finished.seconds / 60) || 1} minute{Math.ceil(finished.seconds / 60) === 1 ? "" : "s"}</p>
        <div className="spacer" />
        <button className="btn btn-primary" onClick={onRestart}>
          <FiRefreshCw /> Try again
        </button>
        <button className="btn btn-secondary mt" onClick={() => navigate("/exam")}>
          Back to Exam Mode
        </button>
      </div>
    );
  }

  const question = questions[idx];
  const mm = Math.floor(secondsLeft / 60);
  const ss = String(secondsLeft % 60).padStart(2, "0");

  const advance = () => {
    const n = idx + 1;
    if (n >= questions.length) {
      finish();
      return;
    }
    setIdx(n);
    setPicked(null);
    setRevealed(false);
  };

  const onPick = (opt) => {
    if (revealed) return;
    const correct = isCorrectAnswer(question, opt);
    setPicked(opt);
    setRevealed(true);
    if (correct) {
      correctRef.current += 1;
      playRight();
    } else {
      if (onWrongAnswer) onWrongAnswer({ subject: subjectKey, qid: question.id });
      playWrong();
    }
    setTimeout(advance, 600);
  };

  return (
    <div className="quiz">
      <div className="quiz-top">
        <span className="pill pill-medium">{questionTopic(subjectKey, question.id) || "Quick recall"}</span>
        <span className={"quiz-count" + (secondsLeft <= 60 ? " exam-timer-warn" : "")}>
          &#9202; {mm}:{ss}
        </span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
      </div>
      <span className="quiz-count">Q {idx + 1} / {questions.length}</span>
      <h3 className="quiz-question">{question.question}</h3>
      <div className="quiz-options">
        {question.options.map((opt) => (
          <button
            key={opt}
            className={
              "btn-option" +
              (revealed
                ? isCorrectAnswer(question, opt)
                  ? " correct"
                  : opt === picked
                  ? " wrong"
                  : ""
                : "")
            }
            onClick={() => onPick(opt)}
            disabled={revealed}
          >
            {opt}
          </button>
        ))}
      </div>
      {revealed && (
        <div className="feedback">
          <p className={"feedback " + (picked && isCorrectAnswer(question, picked) ? "correct" : "wrong")}>
            {picked && isCorrectAnswer(question, picked) ? "Correct!" : "Not quite."}
            <span className="muted"> &middot; {question.explanation}</span>
          </p>
        </div>
      )}
    </div>
  );
}

export function ExamBlitz({ subjectKey, onWrongAnswer, onResult }) {
  const [run, setRun] = useState(1);
  return (
    <BlitzRun
      key={run}
      subjectKey={subjectKey}
      onWrongAnswer={onWrongAnswer}
      onResult={onResult}
      onRestart={() => setRun((r) => r + 1)}
    />
  );
}

function buildWeakPool(wrongAnswers, subjectKey) {
  return (wrongAnswers || [])
    .filter((w) => w.subject === subjectKey)
    .map((w) => ({ subject: w.subject, qid: w.qid }));
}

function WeakRun({ subjectKey, pool, onClearWrong, onFinish, onRestart }) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const streakRef = useRef({});
  const masteredRef = useRef(0);
  const finishedRef = useRef(false);
  const [finished, setFinished] = useState(null);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const res = { mastered: masteredRef.current, total: pool.length };
    setFinished(res);
    if (onFinish) onFinish(subjectKey, res.mastered, res.total);
  };

  if (finished) {
    return (
      <div className="center">
        <Mascot className="mascot-big" happy={finished.mastered === finished.total} />
        <h2 className="results-title">
          {finished.mastered}/{finished.total} cleared
        </h2>
        <p className="muted">
          {finished.mastered === finished.total
            ? "Every weak-spot question is cleared. Nice."
            : "Stick with it — answers you get right 3x in a row leave the bank."}
        </p>
        <div className="spacer" />
        <button className="btn btn-primary" onClick={onRestart}>
          <FiRefreshCw /> Drill again
        </button>
        <button className="btn btn-secondary mt" onClick={() => navigate("/exam")}>
          Back to Exam Mode
        </button>
      </div>
    );
  }

  const entry = pool[idx];
  const question = getQuestion(entry.subject, entry.qid);
  if (!question) {
    const advanceNoQ = () => {
      if (idx + 1 >= pool.length) {
        finish();
        return;
      }
      setIdx(idx + 1);
    };
    setTimeout(advanceNoQ, 0);
    return <p className="muted center">Loading&hellip;</p>;
  }

  const streak = streakRef.current[entry.qid] || 0;

  const advance = () => {
    if (idx + 1 >= pool.length) {
      finish();
      return;
    }
    setIdx(idx + 1);
    setPicked(null);
    setRevealed(false);
  };

  const onPick = (opt) => {
    if (revealed) return;
    const correct = isCorrectAnswer(question, opt);
    setPicked(opt);
    setRevealed(true);
    if (correct) {
      streakRef.current[entry.qid] = streak + 1;
      if (streak + 1 >= 3) {
        masteredRef.current += 1;
        if (onClearWrong) onClearWrong(entry.subject, entry.qid);
        playWin();
      } else {
        playRight();
      }
    } else {
      streakRef.current[entry.qid] = 0;
      playWrong();
    }
    setTimeout(advance, 900);
  };

  return (
    <div className="quiz">
      <div className="quiz-top">
        <span className="pill pill-medium">{questionTopic(entry.subject, entry.qid) || "Weak spot"}</span>
        <span className="quiz-count">{streak} / 3 right in a row</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${((idx + 1) / pool.length) * 100}%` }} />
      </div>
      <span className="quiz-count">Q {idx + 1} / {pool.length} &middot; {masteredRef.current} cleared</span>
      <h3 className="quiz-question">{question.question}</h3>
      <div className="quiz-options">
        {question.options.map((opt) => (
          <button
            key={opt}
            className={
              "btn-option" +
              (revealed
                ? isCorrectAnswer(question, opt)
                  ? " correct"
                  : opt === picked
                  ? " wrong"
                  : ""
                : "")
            }
            onClick={() => onPick(opt)}
            disabled={revealed}
          >
            {opt}
          </button>
        ))}
      </div>
      {revealed && (
        <div className="feedback">
          <p className={"feedback " + (picked && isCorrectAnswer(question, picked) ? "correct" : "wrong")}>
            {picked && isCorrectAnswer(question, picked) ? "Correct!" : "Not quite."}
          </p>
          {question.explanation && (
            <div className="card mt">
              <p>{question.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ExamWeak({ subjectKey, wrongAnswers, onClearWrong, onResult }) {
  const [started, setStarted] = useState(false);
  const [run, setRun] = useState(1);
  const pool = useMemo(() => buildWeakPool(wrongAnswers, subjectKey), [wrongAnswers, subjectKey]);

  if (pool.length === 0) {
    return (
      <div className="center">
        <Mascot className="hero-mascot" />
        <p className="muted">
          No wrong answers logged for {subjectLabel(subjectKey)} yet. Miss a question in a
          past paper or blitz and it lands here automatically.
        </p>
        <button className="btn btn-primary mt" onClick={() => navigate("/exam/paper?subject=" + subjectKey)}>
          <FiFileText /> Start a past paper
        </button>
      </div>
    );
  }

  if (!started) {
    const groups = {};
    pool.forEach((w) => {
      const name = questionTopic(w.subject, w.qid) || "General";
      groups[name] = (groups[name] || 0) + 1;
    });
    return (
      <div className="center">
        <LuGraduationCap size={26} color="var(--xp-gold)" />
        <h2 className="results-title">Focus weak spots</h2>
        <p className="muted">
          Answer a question right <b>3 times in a row</b> and it leaves the bank. No penalties.
        </p>
        <div className="spacer" />
        {Object.entries(groups).map(([name, count]) => (
          <div key={name} className="exam-chip-list">
            <span className="exam-chip">{name}</span>
            <span className="muted">{count} to retest</span>
          </div>
        ))}
        <button className="btn btn-primary mt" onClick={() => setStarted(true)}>
          <FiTarget /> Start drill
        </button>
      </div>
    );
  }

  return (
    <WeakRun
      key={run}
      subjectKey={subjectKey}
      pool={pool}
      onClearWrong={onClearWrong}
      onFinish={(s, c, t) => {
        if (onResult) onResult("weak", s, c, t);
      }}
      onRestart={() => setRun((r) => r + 1)}
    />
  );
}

export function ExamChecklist({ subjectKey, examMode, onSaveExam }) {
  const topics = subjectTopics(subjectKey);
  const syllabus = ((examMode || {}).syllabus || {})[subjectKey] || {};
  const cov = coverageFor(syllabus, topics);
  const rec = recommendNext(subjectKey, syllabus);

  const setStatus = (name, st) =>
    onSaveExam((m) => ({
      ...m,
      syllabus: { ...(m.syllabus || {}), [subjectKey]: { ...((m.syllabus || {})[subjectKey] || {}), [name]: st } },
    }));

  return (
    <div>
      <div className="section-title">Syllabus checklist &middot; {subjectLabel(subjectKey)}</div>
      <p className="muted">Tap <b>Know it</b> / <b>Shaky</b> / <b>Not covered</b> for each topic. Be honest — it drives your recommendations.</p>
      <div className="card mt">
        <p className="exam-reco">
          <b>{cov.pct}% covered</b> &middot; {cov.covered} of {cov.total} topics
        </p>
        <CoverageBar pct={cov.pct} />
        {rec && (
          <p className="muted mt">
            Start with <b>{rec.name}</b> — asked {rec.count}&times; in past papers.
          </p>
        )}
      </div>
      <div className="spacer" />
      {topics.map((t) => {
        const st = syllabus[t.name] || null;
        return (
          <div key={t.name} className={"card mt exam-topic-card " + (st ? "exam-topic-" + st : "")}>
            <div className="row-title">{t.name}</div>
            <p className="muted" style={{ fontSize: 12 }}>
              {t.terms} term{t.terms === 1 ? "" : "s"}
              {t.questions > 0 && <> &middot; {t.questions} past-paper question{t.questions === 1 ? "" : "s"}</>}
            </p>
            <div className="chip-row">
              <button className={"subject-chip small" + (st === "known" ? " known" : "")} onClick={() => setStatus(t.name, st === "known" ? null : "known")}>
                <FiCheck /> Know it
              </button>
              <button className={"subject-chip small" + (st === "unsure" ? " unsure" : "")} onClick={() => setStatus(t.name, st === "unsure" ? null : "unsure")}>
                Shaky
              </button>
              <button className={"subject-chip small" + (st === "no" ? " no" : "")} onClick={() => setStatus(t.name, st === "no" ? null : "no")}>
                Not covered
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ExamCram({ subjectKey, examMode }) {
  const subj = SUBJECTS.find((s) => s.key === subjectKey);
  const terms = (subj && subj.data.glossary ? subj.data.glossary : []).slice();
  const syllabus = ((examMode || {}).syllabus || {})[subjectKey] || {};
  const [filter, setFilter] = useState("all");

  const shown = terms.filter((t) => {
    const st = syllabus[t.subStrand || "General"] || null;
    if (filter === "all") return true;
    if (filter === "needs") return st !== "known";
    if (filter === "shake") return st === "unsure";
    return true;
  });

  const groups = {};
  shown.forEach((t) => {
    const name = t.subStrand || "General";
    if (!groups[name]) groups[name] = [];
    groups[name].push(t);
  });

  return (
    <div>
      <div className="section-title">Cram sheet &middot; {subjectLabel(subjectKey)}</div>
      <p className="muted">Every key term, plain meaning, nothing else. Skim until each one feels familiar.</p>
      <div className="chip-row mt">
        <button className={"subject-chip small" + (filter === "all" ? " on" : "")} onClick={() => setFilter("all")}>All ({terms.length})</button>
        <button className={"subject-chip small" + (filter === "needs" ? " on" : "")} onClick={() => setFilter("needs")}>Needs work</button>
        <button className={"subject-chip small" + (filter === "shake" ? " on" : "")} onClick={() => setFilter("shake")}>Only shaky</button>
      </div>
      <div className="spacer" />
      {Object.entries(groups).map(([name, list]) => (
        <div key={name} className="card mt">
          <div className="row-title">{name}</div>
          {list.map((t) => (
            <div key={t.id} className="cram-term">
              <span className="cram-term-name">{t.term}</span>
              <span className="cram-term-def">{t.definition}</span>
            </div>
          ))}
        </div>
      ))}
      {shown.length === 0 && <p className="muted center">Nothing here for that filter.</p>}
    </div>
  );
}