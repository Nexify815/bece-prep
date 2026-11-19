// Chunky multi-color glyphs — the app's shared icon language.
//
// Drawn like the reference icons: every hue carries its own vertical
// gradient (top catches the light, base falls off) and a glossy inner
// rim, so each glyph reads like sun-lit candy glass. Multiple hues per
// icon, warm saturated palette, rounded friendly corners.
//
// STEP_GLYPHS maps the plan steps to their glyph.

import { useId } from "react";

const P = {
  cream: "#FFE8B3",
  red: "#E8503A",
  redDeep: "#C93A28",
  orange: "#F97316",
  yellow: "#FFC83D",
  yellowDeep: "#E8A33D",
  green: "#58CC02",
  greenDeep: "#3DA01F",
  greenDark: "#1E7A26",
  lime: "#7BE32A",
  blue: "#1E9BF0",
  blueDeep: "#1486D6",
  teal: "#14B8A6",
  pink: "#FF8A9E",
  navy: "#173A2F",
  gold: "#FFB52E",
  ferrule: "#D8D3C8",
  snow: "#FFF6DC",
};

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return { r: parseInt(n.slice(0, 2), 16), g: parseInt(n.slice(2, 4), 16), b: parseInt(n.slice(4, 6), 16) };
}
function mix(hex, target, t) {
  const a = hexToRgb(hex);
  const b = target === "#ffffff" ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 };
  const c = ["r", "g", "b"].map((k) => Math.round(a[k] + (b[k] - a[k]) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
const lighten = (hex, t) => mix(hex, "#ffffff", t);
const darken = (hex, t) => mix(hex, "#000000", t);

// One vertical gradient per named hue used by the icon.
function candy({ colors, uid }) {
  return Object.entries(colors).map(([key, hex]) => (
    <linearGradient key={key} id={`${uid}_${key}`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={lighten(hex, 0.34)} />
      <stop offset="0.52" stopColor={hex} />
      <stop offset="1" stopColor={darken(hex, 0.18)} />
    </linearGradient>
  ));
}

// Shared wrapper: per-glyph <defs> + glossy inner rim via stroke
function Candy({ colors, size, viewBox = "0 0 24 24", children, className = "ob-stairs-glyph" }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox={viewBox} aria-hidden="true" focusable="false" className={className}>
      <defs>{candy({ colors, uid })}</defs>
      <g stroke="rgba(255, 255, 255, 0.38)" strokeWidth="0.5" strokeLinejoin="round" strokeLinecap="round">
        {typeof children === "function" ? children((k) => `url(#${uid}_${k})`) : children}
      </g>
    </svg>
  );
}

export function BookIcon({ size = 30 }) {
  return (
    <Candy colors={{ red: P.red, cream: P.cream }} size={size}>
      {(g) => (
        <>
          <path fill={g("red")} d="M4 6.4C6.4 4.9 9.3 4.8 12 6.9c2.7-2.1 5.6-2.2 8-.5v12.2c-2.4-1.7-5.3-1.6-8 .5-2.7-2.1-5.6-2.2-8-.5V6.4Z" />
          <path fill={g("cream")} d="M6.1 8.3c2-1 4.6-.8 4.6.9v10.8c-2-1.7-4.6-1.8-4.6-.9V8.3Z" stroke="rgba(0,0,0,0.06)" strokeWidth="0.4" />
          <path fill={g("cream")} d="M13.3 9.2c2.3-1.7 5-1.9 5.6-.8v11.9c-2-1-4.5-.8-5.6.8V9.2Z" stroke="rgba(0,0,0,0.06)" strokeWidth="0.4" />
        </>
      )}
    </Candy>
  );
}

export function StairsIcon({ size = 26 }) {
  return (
    <Candy colors={{ deep: P.greenDeep, green: P.green, lime: P.lime }} size={size}>
      {(g) => (
        <>
          <rect x="2" y="17.1" width="8.6" height="4.5" rx="2.25" fill={g("deep")} />
          <rect x="7.7" y="10.9" width="8.6" height="4.5" rx="2.25" fill={g("green")} />
          <rect x="13.4" y="4.7" width="8.6" height="4.5" rx="2.25" fill={g("lime")} />
          <rect x="19" y="0.8" width="1.4" height="4.4" rx="0.7" fill={P.navy} stroke="none" />
          <path fill={P.red} d="M20.4 1 15 2.7l5.4 1.8V1Z" stroke="none" />
        </>
      )}
    </Candy>
  );
}

export function CardIcon({ size = 30 }) {
  return (
    <Candy colors={{ cream: P.cream, red: P.red }} size={size}>
      {(g) => (
        <>
          <path fill={g("cream")} d="M2 7.6v11.2a2.2 2.2 0 0 0 2.2 2.2h15.6a2.2 2.2 0 0 0 2.2-2.2V7.6H2Z" />
          <path fill={g("red")} d="M2 5a2.2 2.2 0 0 1 2.2-2.2h15.6A2.2 2.2 0 0 1 22 5v2.6H2V5Z" />
          <rect x="5.6" y="12.4" width="12.8" height="2" rx="1" fill={P.navy} stroke="none" />
          <rect x="5.6" y="16.5" width="8.4" height="2" rx="1" fill={P.navy} opacity="0.85" stroke="none" />
        </>
      )}
    </Candy>
  );
}

export function ChecklistIcon({ size = 30 }) {
  return (
    <Candy colors={{ yellow: P.yellow, red: P.red }} size={size}>
      {(g) => (
        <>
          <rect x="4.5" y="3.4" width="15" height="17.2" rx="2.6" fill={g("yellow")} />
          <rect x="9.3" y="1.6" width="5.4" height="3.6" rx="1.35" fill={g("red")} />
          <path fill={P.navy} stroke="none" d="M6.6 12 L8.8 14.2 L12.6 10.4 L11.2 9 L8.8 11.4 L7.9 10.5 Z" />
          <path fill={P.navy} stroke="none" d="M6.6 16.9 L8.8 19.1 L12.6 15.3 L11.2 13.9 L8.8 16.3 L7.9 15.4 Z" />
        </>
      )}
    </Candy>
  );
}

export function PencilIcon({ size = 30 }) {
  return (
    <Candy colors={{ yellow: P.yellow, cream: P.cream }} size={size}>
      {(g) => (
        <g transform="rotate(-45 12 12)">
          <rect x="4.9" y="9.1" width="9" height="5.8" fill={g("yellow")} />
          <rect x="1.7" y="9.1" width="3" height="5.8" rx="1.8" fill={P.pink} />
          <rect x="4.4" y="9.1" width="1.1" height="5.8" fill={P.ferrule} stroke="none" />
          <path d="M13.9 8.6 21.6 12l-7.7 3.4Z" fill={g("cream")} />
          <path d="M13.9 10.8 17.6 12l-3.7 1.2Z" fill={P.navy} stroke="none" />
        </g>
      )}
    </Candy>
  );
}

export function ClockIcon({ size = 30 }) {
  return (
    <Candy colors={{ teal: P.teal, cream: P.cream }} size={size}>
      {(g) => (
        <>
          <rect x="9.2" y="1.6" width="5.6" height="3" rx="1.5" fill={P.red} />
          <circle cx="12" cy="14.4" r="8.2" fill={g("teal")} />
          <circle cx="12" cy="14.4" r="5.4" fill={g("cream")} stroke="rgba(0,0,0,0.08)" strokeWidth="0.4" />
          <rect x="10.9" y="10.4" width="2.1" height="4.6" rx="1.05" fill={P.navy} stroke="none" />
          <rect x="10.9" y="13.4" width="4.2" height="2.1" rx="1.05" fill={P.navy} stroke="none" />
        </>
      )}
    </Candy>
  );
}

export function PageIcon({ size = 30 }) {
  return (
    <Candy colors={{ cream: P.cream, blue: P.blue }} size={size}>
      {(g) => (
        <>
          <path fill={g("cream")} d="M6 2.4h8.1l4.6 5.6v12.6a2.4 2.4 0 0 1-2.4 2.4H6a2.4 2.4 0 0 1-2.4-2.4V4.8A2.4 2.4 0 0 1 6 2.4Z" />
          <path fill={g("blue")} stroke="none" d="M12.4 2.5v6.4h6.4l-6.4-6.4Z" />
          <rect x="6.6" y="12.2" width="9" height="2" rx="1" fill={P.blueDeep} stroke="none" />
          <rect x="6.6" y="16.3" width="6.2" height="2" rx="1" fill={P.blueDeep} stroke="none" />
        </>
      )}
    </Candy>
  );
}

export function CapIcon({ size = 30 }) {
  return (
    <Candy colors={{ yellow: P.yellow, deep: P.yellowDeep }} size={size}>
      {(g) => (
        <>
          <path fill={g("yellow")} d="M12 3.4 2.2 9.3 12 15.2l9.8-5.9Z" />
          <path fill={g("deep")} d="M6.9 12.2v4.2c0 1.35 2.3 2.9 5.1 2.9s5.1-1.55 5.1-2.9v-4.2L12 15.1Z" />
          <circle cx="19.4" cy="12.4" r="1.3" fill={P.red} stroke="none" />
        </>
      )}
    </Candy>
  );
}

export function PieIcon({ size = 30 }) {
  return (
    <Candy colors={{ green: P.green, yellow: P.yellow }} size={size}>
      {(g) => (
        <>
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z M12 3h9v9h-9Z"
            fill={g("green")}
          />
          <rect x="13.7" y="2.3" width="7.6" height="7.6" rx="1.9" fill={g("yellow")} />
        </>
      )}
    </Candy>
  );
}

export function TargetIcon({ size = 30 }) {
  return (
    <Candy colors={{ red: P.red }} size={size}>
      {(g) => (
        <>
          <circle cx="12" cy="12" r="9.6" fill={g("red")} />
          <circle cx="12" cy="12" r="6.4" fill={P.snow} stroke="rgba(0,0,0,0.08)" strokeWidth="0.4" />
          <circle cx="12" cy="12" r="3.3" fill={g("red")} />
          <circle cx="12" cy="12" r="1.3" fill={P.navy} stroke="none" />
        </>
      )}
    </Candy>
  );
}

export function MagnifierIcon({ size = 30 }) {
  return (
    <Candy colors={{ blue: P.blue }} size={size}>
      {(g) => (
        <>
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.3 2.8a7.6 7.6 0 1 0 0 15.2 7.6 7.6 0 0 0 0-15.2Zm0 4.3a3.3 3.3 0 1 1 0 6.6 3.3 3.3 0 0 1 0-6.6Z"
            fill={g("blue")}
          />
          <rect x="15.3" y="15.3" width="7.9" height="3.5" rx="1.75" transform="rotate(45 15.3 15.3)" fill={P.navy} stroke="none" />
          <circle cx="8" cy="8" r="1.35" fill="#FFFFFF" opacity="0.9" stroke="none" />
        </>
      )}
    </Candy>
  );
}

// Registry of plan-step icons
export const STEP_GLYPHS = {
  learn: BookIcon,
  stairs: StairsIcon,
  glossary: CardIcon,
  quiz: ChecklistIcon,
  mistakes: PencilIcon,
  review: PencilIcon,
  paper: PageIcon,
  clock: ClockIcon,
  mock: CapIcon,
  reflect: PieIcon,
};
