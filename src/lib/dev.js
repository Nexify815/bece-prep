// TEMPORARY review helper.
//
// Added because the redesign could only be checked on a Saturday/Sunday: Mock
// Exam, Past Papers, Study Sprint and Review Mistakes are day-gated, and the
// subject Flashcards deck is gated behind passing a Summit. This unlocks that
// ACCESS on any day so every screen can be reviewed.
//
// It deliberately does NOT touch the study plan, the streak, XP or any score --
// it only stops those screens from being locked. Today's Plan still builds
// itself from the real weekday.
//
// Enable either way:
//   - Settings -> "Preview locked screens" (easy to flip back off)
//   - append ?preview=1 to the site URL (persists); ?preview=0 clears it
//
// Delete this file and its four call sites when the review is finished.
const KEY = "sb.previewAll";

export function previewAll() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch (e) {
    return false;
  }
}

export function setPreviewAll(on) {
  if (typeof window === "undefined") return;
  try {
    if (on) window.localStorage.setItem(KEY, "1");
    else window.localStorage.removeItem(KEY);
  } catch (e) {
    /* private mode: the toggle just won't persist */
  }
}

// Lets you jump straight in: /?preview=1#/more
export function previewFromUrl() {
  if (typeof window === "undefined") return;
  const q = new URLSearchParams(window.location.search).get("preview");
  if (q === "1") setPreviewAll(true);
  else if (q === "0") setPreviewAll(false);
}