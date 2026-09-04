import { useMemo } from "react";
import { SUBJECTS } from "../data/index.js";

function today() {
  const d = new Date();
  return `${d.getDate()} ${d.toLocaleString("en", { month: "long" })} ${d.getFullYear()}`;
}

function levelFromXp(xp) {
  return Math.floor(xp / 100) + 1;
}

export default function ProgressReport({ state }) {
  const report = useMemo(() => {
    const xp = state.xp || 0;
    const level = levelFromXp(xp);

    // stairs progress per subject
    const subjects = SUBJECTS.map((s) => {
      const totalTerms = (s.data?.glossary || []).length;
      const learned = Object.keys(state.learnedTerms || {}).filter((k) => k.startsWith(`${s.key}:`)).length;

      // quiz scores for this subject
      const diffs = ["easy", "medium", "hard"];
      const quizInfo = diffs.map((d) => {
        const k = `${s.key}.${d}`;
        const v = state.quizScores?.[k] || { best: 0, attempts: 0 };
        return { d, ...v };
      });

      const wrongCount = (state.wrongAnswers || []).filter((w) => w.subject === s.key).length;
      const summitDone = !!state.passedSummit?.[s.key];

      return {
        key: s.key,
        name: s.name,
        icon: s.icon,
        colorClass: s.colorClass,
        totalTerms,
        learned,
        quizInfo,
        wrongCount,
        summitDone,
      };
    });

    const totalTerms = subjects.reduce((a, s) => a + s.totalTerms, 0);
    const totalLearned = subjects.reduce((a, s) => a + s.learned, 0);
    const totalWrong = (state.wrongAnswers || []).length;

    // overall score = average of the best quiz score across every
    // subject/difficulty the player has actually attempted
    const bests = [];
    subjects.forEach((s) =>
      s.quizInfo.forEach((q) => {
        if (q.attempts > 0) bests.push(q.best);
      })
    );
    const overallScore =
      bests.length > 0
        ? Math.round(bests.reduce((a, b) => a + b, 0) / bests.length)
        : null;

    return {
      xp,
      level,
      streak: state.streak || 0,
      subjects,
      totalTerms,
      totalLearned,
      totalWrong,
      overallScore,
    };
  }, [state]);

  const handlePrint = () => window.print();

  const handleSaveText = () => {
    let txt = `StudyBuddy Progress Report\nGenerated: ${today()}\n\n`;
    txt += `Total XP: ${report.xp}  |  Level: ${report.level}\n`;
    txt += `Day streak: ${report.streak}\n\n`;
    report.subjects.forEach((s) => {
      txt += `${s.name} (${s.icon})\n`;
      txt += `  Terms learned: ${s.learned}/${s.totalTerms}\n`;
      s.quizInfo.forEach((q) => {
        txt += `  ${q.d}: best ${q.best}% (${q.attempts} attempt${q.attempts === 1 ? "" : "s"})\n`;
      });
      if (s.summitDone) txt += `  Summit: PASSED\n`;
      if (s.wrongCount > 0) txt += `  Questions to revise: ${s.wrongCount}\n`;
      txt += "\n";
    });
    txt += `Total questions to revise: ${report.totalWrong}\n`;

    // download as .txt
    const blob = new Blob([txt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "studybuddy-progress.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="progress-report">
      <div className="section-title">Progress Report</div>
      <p className="muted">Generated {today()}</p>

      <div className="report-stats">
        <div className="report-stat card">
          <span className="report-stat-value">{report.overallScore != null ? report.overallScore + "%" : "--"}</span>
          <span className="report-stat-label">Avg. quiz score</span>
        </div>
        <div className="report-stat card">
          <span className="report-stat-value">{report.totalLearned}/{report.totalTerms}</span>
          <span className="report-stat-label">Terms learned</span>
        </div>
        <div className="report-stat card">
          <span className="report-stat-value">{report.xp}</span>
          <span className="report-stat-label">Total XP</span>
        </div>
        <div className="report-stat card">
          <span className="report-stat-value">Lv {report.level}</span>
          <span className="report-stat-label">Level</span>
        </div>
        <div className="report-stat card">
          <span className="report-stat-value">&#128293;{report.streak}</span>
          <span className="report-stat-label">Day streak</span>
        </div>
      </div>

      <div className="section-title" style={{ fontSize: 18, marginTop: 20 }}>By Subject</div>
      {report.subjects
        .filter((s) => s.totalTerms > 0)
        .map((s) => {
          const pct = s.totalTerms ? Math.round((s.learned / s.totalTerms) * 100) : 0;
          return (
            <div key={s.key} className="card report-subject mt">
              <div className="report-subject-head">
                <span className={"row-title " + s.colorClass}>{s.icon} {s.name}</span>
                <span className="report-subject-pct">{pct}% learned</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
              <div className="report-subject-detail">
                <span>{s.learned}/{s.totalTerms} terms</span>
                <span>{s.wrongCount} to revise</span>
                {s.summitDone && <span className="report-summit">Summit passed &#10003;</span>}
              </div>
              <div className="report-quiz-scores">
                {s.quizInfo.map((q) => (
                  <span key={q.d} className="report-diff">
                    {q.d}: {q.best}% ({q.attempts})
                  </span>
                ))}
              </div>
            </div>
          );
        })}

      {report.totalWrong > 0 && (
        <div className="card report-revise mt">
          <div className="report-section-title">Need a little extra work</div>
          <p className="muted">{report.totalWrong} question{report.totalWrong === 1 ? "" : "s"} answered wrong before — good to revisit.</p>
        </div>
      )}

      <div className="spacer" />
      <div className="report-actions">
        <button className="btn btn-primary" onClick={handleSaveText}>
          &#11015; Save as text file
        </button>
        <button className="btn btn-secondary" onClick={handlePrint}>
          &#128424; Print / Share
        </button>
      </div>
    </div>
  );
}
