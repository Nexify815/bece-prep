// One place for every icon in the app. No emoji anywhere — Lucide only
// (via react-icons/lu, which ships the identical Lucide artwork), sized and
// tinted per page through these wrappers.
import {
  LuHouse, LuCalendarDays, LuShoppingCart, LuChartNoAxesColumn, LuSettings,
  LuEllipsis, LuGraduationCap, LuCloud, LuCircleHelp, LuChevronDown,
  LuChevronRight, LuPlay, LuRefreshCw, LuLock, LuTrash2, LuLightbulb,
  LuCircleCheck, LuInfo, LuX, LuTriangleAlert, LuFlame, LuSparkles, LuGem,
  LuClock, LuZap, LuBookOpen, LuBookMarked, LuNotebookPen, LuTarget,
  LuFileText, LuFlag, LuChartColumn, LuBookmark, LuClipboardList, LuEye,
  LuBicepsFlexed, LuRocket, LuCalculator, LuFlaskConical, LuGlobe,
  LuMessageSquareText, LuVolume2, LuCircleStop, LuPartyPopper, LuCrown,
  LuMedal, LuCoins, LuShieldCheck, LuStar, LuLayers, LuMountain, LuHeart,
  LuSearch, LuBell, LuSnowflake, LuRotateCw, LuPenLine, LuSquareCheckBig,
  LuLoaderCircle, LuPlus, LuMinus, LuArrowRight, LuChevronUp, LuMoon, LuSun,
  LuTrophy, LuTrendingUp, LuMic, LuMail, LuPrinter, LuClipboard,
  LuArrowUpRight, LuCircleAlert, LuWaves, LuTimer, LuCircle, LuChevronsUp,
  LuAward, LuArrowLeft, LuCopy, LuSmile, LuVibrate, LuDownload, LuUpload,
} from "react-icons/lu";

// Lucide has no matching glyph for a few of our meanings — these map to the
// closest equivalent so nothing falls back to an emoji.
const SUBJECT_ICON = {
  math: LuCalculator,
  science: LuFlaskConical,
  english: LuBookOpen,
  social: LuGlobe,
};

const STEP_ICON = {
  stairs: LuBicepsFlexed,
  glossary: LuBookMarked,
  quiz: LuTarget,
  mistakes: LuClipboardList,
  paper: LuFileText,
  mock: LuFlag,
  reflect: LuChartColumn,
};

const TAB_ICON = {
  home: LuHouse,
  plan: LuCalendarDays,
  shop: LuShoppingCart,
  progress: LuChartNoAxesColumn,
  settings: LuSettings,
  more: LuEllipsis,
};

// Shop item art — keyed by the `icon` field in lib/store.js.
const BOOST_ICON = {
  zap: LuZap,
  snowflake: LuSnowflake,
  heart: LuHeart,
};

const SESSION_ICON = {
  paper: LuFileText,
  blitz: LuZap,
  weak: LuTarget,
};

const THEME_ICON = {
  day: LuSun,
  night: LuMoon,
  berry: LuSparkles,
  ocean: LuWaves,
};

export {
  LuHouse, LuCalendarDays, LuShoppingCart, LuChartNoAxesColumn, LuSettings,
  LuEllipsis, LuGraduationCap, LuCloud, LuCircleHelp, LuChevronDown,
  LuChevronRight, LuPlay, LuRefreshCw, LuLock, LuTrash2, LuLightbulb,
  LuCircleCheck, LuInfo, LuX, LuTriangleAlert, LuFlame, LuSparkles, LuGem,
  LuClock, LuZap, LuBookOpen, LuBookMarked, LuNotebookPen, LuTarget,
  LuFileText, LuFlag, LuChartColumn, LuBookmark, LuClipboardList, LuEye,
  LuBicepsFlexed, LuRocket, LuCalculator, LuFlaskConical, LuGlobe,
  LuMessageSquareText, LuVolume2, LuCircleStop, LuPartyPopper, LuCrown,
  LuMedal, LuCoins, LuShieldCheck, LuStar, LuLayers, LuMountain, LuHeart,
  LuSearch, LuBell, LuSnowflake, LuRotateCw, LuPenLine, LuSquareCheckBig,
  LuLoaderCircle, LuPlus, LuMinus, LuArrowRight, LuChevronUp, LuMoon, LuSun,
  LuTrophy, LuTrendingUp, LuMic, LuMail, LuPrinter, LuClipboard,
  LuArrowUpRight, LuCircleAlert, LuWaves, LuTimer, LuCircle, LuChevronsUp,
  LuAward, LuArrowLeft, LuCopy, LuSmile, LuVibrate, LuDownload, LuUpload,
  SUBJECT_ICON, STEP_ICON, TAB_ICON, SESSION_ICON, THEME_ICON, BOOST_ICON,
};

// The "good news / bad news" glyphs that used to be inline check and cross
// characters. Kept here so success, warning and failure messages across the
// app all share one shape language.
export const GOOD = LuCircleCheck;
export const BAD = LuX;
export const WARN = LuTriangleAlert;

// Tinted circular icon badge — the chunky coloured "chip" used across cards,
// plan steps and subjects so every surface gets colour without emoji.
export function IconBadge({ icon: Icon, tint = "#E5E7EB", color = "#374151", size = 22, box = 44, radius = 14, className = "" }) {
  return (
    <span
      className={"icon-badge " + className}
      style={{ background: tint, width: box, height: box, borderRadius: radius }}
      aria-hidden="true"
    >
      <Icon size={size} color={color} />
    </span>
  );
}

export function SubjectIcon({ subjectKey, ...rest }) {
  const Icon = SUBJECT_ICON[subjectKey] || LuBookOpen;
  return <Icon {...rest} />;
}

export function StepIcon({ name, ...rest }) {
  const Icon = STEP_ICON[name] || LuTarget;
  return <Icon {...rest} />;
}