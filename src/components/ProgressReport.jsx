import { useEffect, useMemo } from "react";
import {
  LuCheck, LuStar, LuFlame, LuTarget, LuCalendarDays, LuTrophy, LuLock,
  LuSend, LuDownload, LuPrinter,
} from "react-icons/lu";
import { SubjectIcon } from "./icons.jsx";
import { SUBJECTS } from "../data/index.js";
import { lastNDays, todayKey } from "../lib/dates.js";
import { weekPlan, todayKey as todayWeekday } from "../lib/plan.js";
import { getMonthlyChallenge, computeChallengeProgress } from "../lib/challenges.js";
import { XP } from "../lib/XP.js";
import { playWin } from "../lib/sound.js";

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

// Same data and claim flow as ChallengeCard, laid out like the reference card.
function ProgressChallenge({ state, onClaim }) {
  const challenge = getMonthlyChallenge();
  const progress = computeChallengeProgress(state);
  const claimed = !!(state.challengesClaimed && state.challengesClaimed[challenge.month]);
  const pct = Math.min(100, (progress.raw != null ? progress.raw : progress.progress) / challenge.goal * 100);
  const show = progress.done ? progress.raw : progress.progress;
  const canClaim = progress.done && !claimed;

  return (
    <div className={"pg-card pg-challenge" + (progress.done ? " is-done" : "")}>
      <div className="pg-challenge-head">
        <span className="pg-challenge-tile" aria-hidden="true"><LuTrophy size={28} strokeWidth={2.6} /></span>
        <div>
          <span className="pg-eyebrow">Monthly challenge</span>
          <b>{challenge.title}</b>
          <small>{challenge.desc}</small>
        </div>
      </div>
      <div className="pg-bar"><span style={{ width: pct + "%" }} /></div>
      <div className="pg-challenge-xp">
        <span>{show}/{challenge.goal} {challenge.type === "days" ? "days" : "XP"}</span>
        <span>Reward: {XP.challengeReward} XP</span>
      </div>
      <button
        className={"pg-claim" + (canClaim ? " is-ready" : "")}
        disabled={!canClaim}
        onClick={() => {
          if (!canClaim) return;
          onClaim(challenge);
          playWin();
        }}
      >
        {!canClaim && <LuLock size={18} />}
        {claimed ? "Claimed" : progress.done ? `Claim ${XP.challengeReward} XP` : `Reward: ${XP.challengeReward} XP`}
      </button>
    </div>
  );
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

  // Match the reference page's light-green canvas (same shell treatment as
  // Home / Shop / Subject). UI only — no state or handlers are touched.
  useEffect(() => {
    document.documentElement.classList.add("progress-route");
    return () => document.documentElement.classList.remove("progress-route");
  }, []);

  const handlePrint = () => window.print();

  const handleShare = () => {
    const msg = [
      `StudyBuddy weekly report for ${today()}`,
      `• XP: ${report.xp} (level ${report.level})`,
      `• This week: +${report.thisWeekXp} XP — ${report.deltaWord} vs last week`,
      `• Active ${report.activeDays}/30 days`,
      `• Terms learned: ${report.totalLearned}/${report.totalTerms}`,
      `• Avg quiz score: ${report.overallScore != null ? report.overallScore + "%" : "--"}`,
      report.bestMock != null ? `• Best mock exam: ${report.bestMock}% (${report.mocksCount} taken)` : "",
      `• ${report.totalWrong} question${report.totalWrong === 1 ? "" : "s"} still to revise`,
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
    <div className="pg-page">
      {/* purple summary card */}
      <section className="pg-hero">
        <span className="pg-bub pg-bub-a" aria-hidden="true" />
        <span className="pg-bub pg-bub-b" aria-hidden="true" />
        <span className="pg-bub pg-bub-c" aria-hidden="true" />
        <div className="pg-hero-main">
          <h2>Your progress</h2>
          <p>Everything you&rsquo;ve built so far, in one place.</p>
          <div className="pg-hero-row">
            <span>{report.totalLearned} of {report.totalTerms} terms learned</span>
          </div>
          <div className="pg-bar pg-hero-bar">
            <span style={{ width: `${report.totalTerms ? Math.round((report.totalLearned / report.totalTerms) * 100) : 0}%` }} />
          </div>
        </div>
        <div className="pg-level">
          <small>Level</small>
          <b>{report.level}</b>
        </div>
      </section>

      {/* four summary tiles */}
      <div className="pg-stats">
        <div className="pg-stat pg-stat-yellow">
          <span className="pg-stat-tile" aria-hidden="true"><LuStar size={24} /></span>
          <b>{report.xp}</b>
          <small>Total XP</small>
        </div>
        <div className="pg-stat pg-stat-orange">
          <span className="pg-stat-tile" aria-hidden="true"><LuFlame size={24} /></span>
          <b>{report.streak}</b>
          <small>Day streak</small>
        </div>
        <div className="pg-stat pg-stat-green">
          <span className="pg-stat-tile" aria-hidden="true"><LuTarget size={24} strokeWidth={3} /></span>
          <b>{report.overallScore != null ? report.overallScore + "%" : "--"}</b>
          <small>Avg. quiz score</small>
        </div>
        <div className="pg-stat pg-stat-blue">
          <span className="pg-stat-tile" aria-hidden="true"><LuCalendarDays size={24} /></span>
          <b>{report.activeDays}</b>
          <small>Active days (30d)</small>
        </div>
      </div>

      {/* this week */}
      <section className="pg-card pg-week-card">
        <div className="pg-card-head">
          <h3>This week</h3>
          <span className="pg-chip">{report.thisWeekXp} XP &middot; {report.deltaWord} vs last week</span>
        </div>
        <div className="pg-week-strip">
          {week.map((d) => (
            <div key={d.key} className="pg-week-day">
              <span
                className={"pg-day-dot" + (d.done ? " is-done" : d.mins > 0 ? " is-part" : "")}
                style={d.done ? undefined : { "--part": `${Math.min(100, (d.mins / goalMins) * 100)}%` }}
                title={`${d.mins} min`}
              >
                {d.done ? <LuCheck size={26} strokeWidth={3.5} /> : d.mins > 0 ? d.mins + "m" : ""}
              </span>
              <span>{dayLabel(d.key)}</span>
            </div>
          ))}
        </div>
        <p className="pg-week-msg">
          {report.deltaWord === "up" && "Nice push this week — keep the momentum."}
          {report.deltaWord === "down" && "A lighter week. Even 10 minutes a day protects your streak."}
          {report.deltaWord === "steady" && "Solid, consistent practice. Consistency wins BECE."}
        </p>
      </section>

      <div className="pg-columns">
        <section className="pg-col">
          <h3 className="pg-col-title">By subject</h3>
          {report.subjects
            .filter((s) => s.totalTerms > 0)
            .map((s) => {
              const pct = s.totalTerms ? Math.round((s.learned / s.totalTerms) * 100) : 0;
              return (
                <div key={s.key} className={"pg-subject pg-subject-" + s.key}>
                  <span className="pg-subject-tile" aria-hidden="true">
                    <SubjectIcon subjectKey={s.iconKey} size={24} color="#FFFFFF" />
                  </span>
                  <div className="pg-subject-body">
                    <div className="pg-subject-row">
                      <b>{s.name}</b>
                      <em>{pct}%</em>
                    </div>
                    <div className="pg-bar"><span style={{ width: pct + "%" }} /></div>
                    <small>
                      {s.learned} / {s.totalTerms} terms &middot; {s.wrongCount} to revise
                      {s.summitDone ? " · Summit passed" : ""}
                    </small>
                  </div>
                </div>
              );
            })}

          {report.totalWrong > 0 && (
            <div className="pg-card pg-revise">
              <h3>Need a little extra work</h3>
              <p>
                {report.totalWrong} question{report.totalWrong === 1 ? "" : "s"} answered
                wrong before — good to revisit.
              </p>
            </div>
          )}

          <div className="pg-card pg-totals">
            <h3>All-time totals</h3>
            <div className="pg-total-row"><span>Total XP</span><b>{report.xp}</b></div>
            <div className="pg-total-row"><span>Level</span><b>{report.level}</b></div>
            <div className="pg-total-row"><span>Terms learned</span><b>{report.totalLearned} / {report.totalTerms}</b></div>
            <div className="pg-total-row"><span>Avg. quiz score</span><b>{report.overallScore != null ? report.overallScore + "%" : "--"}</b></div>
            {report.bestMock != null && (
              <div className="pg-total-row"><span>Best mock exam</span><b>{report.bestMock}%</b></div>
            )}
            <div className="pg-total-row"><span>Still to revise</span><b>{report.totalWrong}</b></div>
            <p className="pg-generated">Generated {today()}</p>
          </div>
        </section>

        <section className="pg-col">
          <h3 className="pg-col-title">Monthly challenge</h3>
          <ProgressChallenge state={state} onClaim={onClaimChallenge} />

          <h3 className="pg-col-title pg-col-title-spaced">Your week</h3>
          <div className="pg-week-list">
            {weekPlan(state).map((day) => (
              <div key={day.key} className={"pg-week-row pg-week-" + day.key}>
                <span className="pg-week-badge">{day.key.toUpperCase()}</span>
                <div className="pg-week-info">
                  <b>{day.focus ? day.focus.name : "Light day"}</b>
                  <small>{day.note}</small>
                </div>
                {day.key === todayWeekday() && <span className="pg-today">Today</span>}
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="pg-actions">
        <button className="pg-share" onClick={handleShare}>
          <LuSend size={22} strokeWidth={3} /> Share weekly report
        </button>
        <div className="pg-secondary">
          <button onClick={handleSaveText}><LuDownload size={17} /> Save as text file</button>
          <button onClick={handlePrint}><LuPrinter size={17} /> Print</button>
        </div>
      </div>
    </div>
  );
}
