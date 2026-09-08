// Unified answer matching for every quiz runner in the app.
// Deals with two data styles:
//  - subject quizzes: options are plain ("8 hundreds") and correctAnswer is the option text
//  - past papers:     options are lettered ("B. 12") and correctAnswer is the letter ("B")

export function normalizeAnswer(v) {
  return String(v ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

// First letter if the option is a lettered one ("B. ...", "B ...").
function optionLetter(v) {
  const t = String(v ?? "").trim().toLowerCase();
  const m = t.match(/^([a-d])(?:\s*[.)]\s*)/);
  return m ? m[1] : null;
}

function usesLetterOptions(question) {
  const o = question && Array.isArray(question.options) ? question.options : [];
  return o.length > 0 && o.every((opt) => /^[a-d]\s*[.)]/i.test(String(opt).trim()));
}

export function isCorrectAnswer(question, given) {
  if (!question) return false;
  const g = normalizeAnswer(given);
  if (!g) return false;
  const c = normalizeAnswer(question.correctAnswer);
  if (g === c) return true;
  // typed answers: accept a matching prefix of any answer word (kid-tolerant)
  if (question.type === "fill-blank") {
    return c.split(" ").filter(Boolean).some((w) => g.startsWith(w));
  }
  // past papers compare by option letter
  if (usesLetterOptions(question) && /^[a-d]$/.test(c)) {
    return optionLetter(given) === c;
  }
  return false;
}