// The study mascot — a Lucide cat (no emoji). `happy` tilts it cheerful with
// the green accent used for celebration states.
import { LuCat } from "./icons.jsx";

export default function Mascot({ happy = false, ...rest }) {
  return (
    <LuCat
      role="img"
      aria-label={happy ? "Happy cat" : "Cat"}
      color={happy ? "#46A302" : "currentColor"}
      strokeWidth={2.4}
      {...rest}
    />
  );
}