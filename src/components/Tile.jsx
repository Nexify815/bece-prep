// Shared gradient "app icon" tile — white glyph on a colourful, glossy tile.
// Used by the desktop rail and the plan page so both read as one design system.
const TILE_TONE = {
  orange: { c1: "#FFB84D", c2: "#FF9600", c3: "#C77300" },
  green: { c1: "#7ADB2B", c2: "#58CC02", c3: "#3FA000" },
  red: { c1: "#FF8A8A", c2: "#FF4B4B", c3: "#C42A2A" },
  blue: { c1: "#55C9FF", c2: "#1CB0F6", c3: "#1488C4" },
  purple: { c1: "#DDA6FF", c2: "#CE82FF", c3: "#9B4FD1" },
  gold: { c1: "#FFE199", c2: "#F7B731", c3: "#B45309" },
  lime: { c1: "#FFE066", c2: "#FFC800", c3: "#D9A600" },
  indigo: { c1: "#9AA7FF", c2: "#6F7DF7", c3: "#4A55C4" },
  sky: { c1: "#9BE0FF", c2: "#6CCBF5", c3: "#3FA0CC" },
  ice: { c1: "#9BE0FF", c2: "#1CB0F6", c3: "#1488C4" },
  sage: { c1: "#D8D3C8", c2: "#9AA9A4", c3: "#5B7066" },
  slate: { c1: "#C9D1D9", c2: "#AAB4BE", c3: "#818B95" },
};

export function TileIcon({ tone = "green", size = "sm", className = "", children }) {
  const s = TILE_TONE[tone] || TILE_TONE.green;
  const sz = size === "lg" ? "lg" : size === "md" ? "md" : "sm";
  return (
    <span
      className={"tile-icon tile-icon-" + sz + (className ? " " + className : "")}
      style={{ "--c1": s.c1, "--c2": s.c2, "--c3": s.c3 }}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

export { TILE_TONE };
