// White single-color glyphs for the plan's artwork tiles — line shapes with
// fill #FFFFFF (matching the mock's white-glyph-on-gradient look).
export const WHITE_STEP_GLYPHS = {
  learn: BookGlyph,
  stairs: StairsGlyph,
  glossary: AaGlyph,
  quiz: ChecklistGlyph,
  mistakes: PencilGlyph,
  review: PencilGlyph,
  paper: ClockGlyph,
  clock: ClockGlyph,
  mock: CapGlyph,
  reflect: PieGlyph,
};

export function AaGlyph({ size = 26 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <text x="12" y="17.2" textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="900" fontSize="14" fill="#FFFFFF">Aa</text>
    </svg>
  );
}

export function BookGlyph({ size = 26 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#FFFFFF" d="M4 6.4C6.4 4.9 9.3 4.8 12 6.9c2.7-2.1 5.6-2.2 8-.5v12.2c-2.4-1.7-5.3-1.6-8 .5-2.7-2.1-5.6-2.2-8-.5V6.4Z" />
    </svg>
  );
}

export function StairsGlyph({ size = 26 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2" y="17.1" width="8.6" height="4.5" rx="2.25" fill="#FFFFFF" />
      <rect x="7.7" y="10.9" width="8.6" height="4.5" rx="2.25" fill="#FFFFFF" />
      <rect x="13.4" y="4.7" width="8.6" height="4.5" rx="2.25" fill="#FFFFFF" />
    </svg>
  );
}

export function ChecklistGlyph({ size = 26 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#FFFFFF" d="M2.3 8.4 L4.6 10.7 L9.6 5.7 L8.3 4.4 L4.6 8.1 L3.6 7.1 Z" />
      <path fill="#FFFFFF" d="M2.3 15.9 L4.6 18.2 L9.6 13.2 L8.3 11.9 L4.6 15.6 L3.6 14.6 Z" />
      <rect x="12.1" y="6.2" width="9.4" height="2.9" rx="1.45" fill="#FFFFFF" />
      <rect x="12.1" y="13.7" width="6.5" height="2.9" rx="1.45" fill="#FFFFFF" />
    </svg>
  );
}

export function PencilGlyph({ size = 26 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <g transform="rotate(-45 12 12)" fill="#FFFFFF">
        <rect x="4.9" y="9.1" width="9" height="5.8" />
        <rect x="1.7" y="9.1" width="3" height="5.8" rx="1.9" />
        <path d="M13.9 8.6 21.6 12l-7.7 3.4Z" />
      </g>
    </svg>
  );
}

export function ClockGlyph({ size = 26 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="9.2" y="1.6" width="5.6" height="3" rx="1.5" fill="#FFFFFF" />
      <circle cx="12" cy="14.4" r="8.2" fill="#FFFFFF" />
      <rect x="10.9" y="10.4" width="2.1" height="4.6" rx="1.05" fill="rgba(20,64,8,0.55)" />
      <rect x="10.9" y="13.4" width="4.2" height="2.1" rx="1.05" fill="rgba(20,64,8,0.55)" />
    </svg>
  );
}

export function CapGlyph({ size = 26 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#FFFFFF" d="M12 3.4 2.2 9.3 12 15.2l9.8-5.9Z" />
      <path fill="#FFFFFF" opacity="0.82" d="M6.9 12.2v4.2c0 1.35 2.3 2.9 5.1 2.9s5.1-1.55 5.1-2.9v-4.2L12 15.1Z" />
    </svg>
  );
}

export function PieGlyph({ size = 26 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#FFFFFF" fillRule="evenodd" clipRule="evenodd" d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z M12 3h9v9h-9Z" />
      <rect x="13.7" y="2.3" width="7.6" height="7.6" rx="1.9" fill="#FFFFFF" />
    </svg>
  );
}
