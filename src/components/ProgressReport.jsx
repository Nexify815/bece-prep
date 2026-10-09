import { useMemo } from "react";
import { LuCheck, LuMail, LuDownload, LuPrinter, LuFlame } from "react-icons/lu";
import { SubjectIcon } from "./icons.jsx";
import { SUBJECTS } from "../data/index.js";
import { lastNDays, todayKey } from "../lib/dates.js";
import { weekPlan } from "../lib/plan.js";
import ChallengeCard from "./ChallengeCard.jsx";

const DAY_LABELS = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" };

function today() {
  const d = new Date();
  return `${d.getDate()} ${d.toLocaleString("en", { month: "long" })} ${d.getFullYear()}`;
}

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function dayLabel(key) {
  const [y, m, d] = key.split("-").map(Number);
  return DAY_SHORT[new Date(y, m - 1, d).getDay()];
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

export default function ProgressReport({ state, onClaimChallenge }) {
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
        iconKey: s.iconKey,
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
      txt += `${s.name}\n`;
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

  // 7-day strip for the dashboard: minutes studied per day, goal = daily goal
  const goalMins = Math.round((state.goalSecs || 3600) / 60);
  const week = lastNDays(7).map((key) => {
    const mins = Math.round((state.usageSecs || {})[key] / 60 || 0);
    return { key, mins, done: mins >= goalMins, today: key === todayKey() };
  });

  return (
    <div className="progress-page">
      <div className="progress-banner">
        <div className="progress-banner-top">
          <div>
            <h1>Your progress</h1>
            <p>Everything you&rsquo;ve built so far, in one place.</p>
          </div>
          <span className="progress-banner-lv">Lv {report.level}</span>
        </div>
        <div className="progress-banner-bar">
          <span
            style={{
              width: `${report.totalTerms ? Math.round((report.totalLearned / report.totalTerms) * 100) : 0}%`,
            }}
          />
        </div>
        <p className="progress-banner-sub">
          {report.totalLearned} of {report.totalTerms} terms learned
        </p>
      </div>

      <div className="stat-tiles">
        <div className="stat-tile tile-yellow">
          <span className="stat-tile-value">{report.xp}</span>
          <span className="stat-tile-label">Total XP</span>
        </div>
        <div className="stat-tile tile-orange">
          <span className="stat-tile-value">
            <LuFlame size={20} /> {report.streak}
          </span>
          <span className="stat-tile-label">Day streak</span>
        </div>
        <div className="stat-tile tile-green">
          <span className="stat-tile-value">
            {report.overallScore != null ? report.overallScore + "%" : "--"}
          </span>
          <span className="stat-tile-label">Avg. quiz score</span>
        </div>
        <div className="stat-tile tile-blue">
          <span className="stat-tile-value">{report.activeDays}</span>
          <span className="stat-tile-label">Active days (30d)</span>
        </div>
      </div>

      <div className="card progress-week-card">
        <div className="progress-card-head">
          <span>This week</span>
          <strong>
            {report.thisWeekXp} XP &middot; {report.deltaWord} vs last week
          </strong>
        </div>
        <div className="progress-week-strip">
          {week.map((d) => (
            <div key={d.key} className={"progress-week-day" + (d.today ? " today" : "")}>
              <span
                className={"progress-week-dot" + (d.done ? " done" : d.mins > 0 ? " part" : "")}
                style={d.done ? undefined : { "--part": `${Math.min(100, (d.mins / goalMins) * 100)}%` }}
                title={`${d.mins} min`}
              >
                {d.done ? <LuCheck size={14} /> : d.mins > 0 ? d.mins + "m" : ""}
              </span>
              <span className="progress-week-label">{dayLabel(d.key)}</span>
            </div>
          ))}
        </div>
        <p className="progress-motd">
          {report.deltaWord === "up" && "Nice push this week — keep the momentum."}
          {report.deltaWord === "down" && "A lighter week. Even 10 minutes a day protects your streak."}
          {report.deltaWord === "steady" && "Solid, consistent practice. Consistency wins BECE."}
        </p>
      </div>

      <div className="progress-split">
        <section className="progress-col">
          <div className="section-title home-sub">By subject</div>
          {report.subjects
            .filter((s) => s.totalTerms > 0)
            .map((s) => {
              const pct = s.totalTerms ? Math.round((s.learned / s.totalTerms) * 100) : 0;
              return (
                <div key={s.key} className="subject-progress-card">
                  <div className="subject-progress-head">
                    <span className="subject-progress-name">
                      <SubjectIcon subjectKey={s.iconKey} size={18} /> {s.name}
                    </span>
                    <span className="subject-progress-pct">{pct}%</span>
                  </div>
                  <div className="focus-bar" style={{ height: 10 }}>
                    <span style={{ width: pct + "%" }} />
                  </div>
                  <div className="subject-progress-meta">
                    <span>
                      {s.learned}/{s.totalTerms} terms
                    </span>
                    <span>{s.wrongCount} to revise</span>
                    {s.summitDone && (
                      <span className="report-summit">
                        Summit passed <LuCheck size={13} />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

          {report.totalWrong > 0 && (
            <div className="card report-revise mt">
              <div className="report-section-title">Need a little extra work</div>
              <p className="muted">
                {report.totalWrong} question{report.totalWrong === 1 ? "" : "s"} answered
                wrong before — good to revisit.
              </p>
            </div>
          )}
        </section>

        <section className="progress-col">
          <div className="section-title home-sub">Monthly challenge</div>
          <ChallengeCard state={state} onClaim={onClaimChallenge} />

          <div className="section-title home-sub">Your week</div>
          <div className="week-list">
            {weekPlan(state).map((day) => (
              <div key={day.key} className="card week-row">
                <div className="week-day">
                  <span className="week-day-label">{DAY_LABELS[day.key]}</span>
                  <span className="week-day-full">{day.label}</span>
                </div>
                <div className="week-info">
                  {day.focus ? (
                    <span className="week-focus">{day.focus.name}</span>
                  ) : (
                    <span className="week-focus light">Light day</span>
                  )}
                  <span className="week-note">{day.note}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="card progress-detail-card">
        <div className="progress-card-head">
          <span>All-time totals</span>
        </div>
        <div className="report-weekly">
          <div className="report-weekly-row">
            <span>Total XP</span>
            <strong>{report.xp}</strong>
          </div>
          <div className="report-weekly-row">
            <span>Level</span>
            <strong>{report.level}</strong>
          </div>
          <div className="report-weekly-row">
            <span>Terms learned</span>
            <strong>
              {report.totalLearned}/{report.totalTerms}
            </strong>
          </div>
          <div className="report-weekly-row">
            <span>Avg. quiz score</span>
            <strong>
              {report.overallScore != null ? report.overallScore + "%" : "--"}
            </strong>
          </div>
          {report.bestMock != null && (
            <div className="report-weekly-row">
              <span>Best mock exam</span>
              <strong>{report.bestMock}%</strong>
            </div>
          )}
          <div className="report-weekly-row">
            <span>Still to revise</span>
            <strong>{report.totalWrong}</strong>
          </div>
        </div>
        <p className="muted hint">Generated {today()}</p>
      </div>

      <div className="report-actions">
        <button className="focus-btn" onClick={handleShare}>
          <LuMail size={16} /> Share weekly report
        </button>
        <button className="focus-link" onClick={handleSaveText}>
          <LuDownload size={15} /> Save as text file
        </button>
        <button className="focus-link" onClick={handlePrint}>
          <LuPrinter size={15} /> Print
        </button>
      </div>
    </div>
  );
}
