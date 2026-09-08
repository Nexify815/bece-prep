import { useMemo } from "react";
import { SUBJECTS } from "../data/index.js";
import { lastNDays } from "../lib/dates.js";

function today() {
  const d = new Date();
  return `${d.getDate()} ${d.toLocaleString("en", { month: "long" })} ${d.getFullYear()}`;
}

function levelFromXp(xp) {
  return Math.floor(xp / 100) + 1;
}

// Total XP credited for a given date key from the xp log (map of dayKey -> XP).
function xpOnDay(xpLog, day) {
  return (xpLog || {})[day] || 0;
}

// Integer XP level buckets used by the heatmap.
function heatLevel(xp) {
  if (xp <= 0) return 0;
  if (xp < 10) return 1;
  if (xp < 20) return 2;
  if (xp < 40) return 3;
  return 4;
}

export default function ProgressReport({ state }) {
  const report = useMemo(() => {
    const xp = state.xp || 0;
    const level = levelFromXp(xp);

    // stairs progress per subject
    const subjects = SUBJECTS.map((s) => {
      const totalTerms = (s.data?.glossary || []).length;
      const learned = Object.keys(state.learnedTerms || {}).filter((k) => k.startsWith(`${s.key}:`)).length;

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

    // ---- heatmap (last 30 days) ----
    const days = lastNDays(30);
    const heat = days.map((d) => ({ day: d, level: heatLevel(xpOnDay(state.xpLog || [], d)) }));
    const activeDays = days.filter((d) => xpOnDay(state.xpLog || [], d) > 0).length;
    const thisWeekXp = lastNDays(7).reduce((a, d) => a + xpOnDay(state.xpLog || [], d), 0);
    const prevWeekXp = lastNDays(14).filter((d) => !lastNDays(7).includes(d)).reduce((a, d) => a + xpOnDay(state.xpLog || [], d), 0);
    const xpDelta = thisWeekXp - prevWeekXp;
    const deltaWord = xpDelta > 20 ? "up" : xpDelta < -20 ? "down" : "steady";

    // ---- mock exam history ----
    const mocks = state.mockHistory || [];
    const bestMock = mocks.length ? Math.max(...mocks.map((m) => m.pct || 0)) : null;
    const mocksCount = mocks.length;

    const streaks = state.streak || 0;

    return {
      xp,
      level,
      streak: streaks,
      subjects,
      totalTerms,
      totalLearned,
      totalWrong,
      overallScore,
      heat,
      activeDays,
      thisWeekXp,
      prevWeekXp,
      xpDelta,
      deltaWord,
      bestMock,
      mocksCount,
    };
  }, [state]);

  const handlePrint = () => window.print();

  const handleShare = () => {
    const msg = [
      `StudyBuddy weekly report for ${today()}`,
      `\u2022 XP: ${report.xp} (level ${report.level})`,
      `\u2022 This week: +${report.thisWeekXp} XP \u2014 ${report.deltaWord} vs last week`,
      `\u2022 Active ${report.activeDays}/30 days`,
      `\u2022 Terms learned: ${report.totalLearned}/${report.totalTerms}`,
      `\u2022 Avg quiz score: ${report.overallScore != null ? report.overallScore + "%" : "--"}`,
      report.bestMock != null ? `\u2022 Best mock exam: ${report.bestMock}% (${report.mocksCount} taken)` : "",
      `\u2022 ${report.totalWrong} question${report.totalWrong === 1 ? "" : "s"} still to revise`,
    ].filter(Boolean).join("\n");
    if (navigator.share) {
      navigator.share({ title: "StudyBuddy weekly report", text: msg }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(msg).then(() => alert("Report copied to clipboard.")).catch(() => {});
    }
  };

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

      <div className="section-title" style={{ fontSize: 18, marginTop: 20 }}>Activity — last 30 days</div>
      <div className="heatmap">
        {report.heat.map((d) => (
          <span
            key={d.day}
            className={"heat-cell heat-" + d.level}
            title={d.day + ": " + xpOnDay(state.xpLog || [], d.day) + " XP"}
          />
        ))}
      </div>
      <p className="muted hint">Active {report.activeDays} of last 30 days &middot; This week +{report.thisWeekXp} XP ({report.deltaWord} vs last week)</p>

      <div className="section-title" style={{ fontSize: 18, marginTop: 20 }}>Weekly report card</div>
      <div className="card report-weekly">
        <div className="report-weekly-row"><span>Total XP</span><strong>{report.xp}</strong></div>
        <div className="report-weekly-row"><span>Level</span><strong>{report.level}</strong></div>
        <div className="report-weekly-row"><span>Day streak</span><strong>&#128293;&times;{report.streak}</strong></div>
        <div className="report-weekly-row"><span>Terms learned</span><strong>{report.totalLearned}/{report.totalTerms}</strong></div>
        <div className="report-weekly-row"><span>Avg. quiz score</span><strong>{report.overallScore != null ? report.overallScore + "%" : "--"}</strong></div>
        {report.bestMock != null && (
          <div className="report-weekly-row"><span>Best mock exam</span><strong>{report.bestMock}%</strong></div>
        )}
        <div className="report-weekly-row"><span>Active days (30d)</span><strong>{report.activeDays}</strong></div>
        <div className="report-weekly-row"><span>Still to revise</span><strong>{report.totalWrong}</strong></div>
      </div>
      <p className="muted hint">
        {report.deltaWord === "up" && "Nice push this week \u2014 keep the momentum."}
        {report.deltaWord === "down" && "A lighter week. Even 10 minutes a day protects your streak."}
        {report.deltaWord === "steady" && "Solid, consistent practice. Consistency wins BECE."}
      </p>

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
        <button className="btn btn-primary" onClick={handleShare}>
          &#128231; Share weekly report
        </button>
        <button className="btn btn-secondary" onClick={handleSaveText}>
          &#11015; Save as text file
        </button>
        <button className="btn btn-secondary" onClick={handlePrint}>
          &#128424; Print / Share
        </button>
      </div>
    </div>
  );
}