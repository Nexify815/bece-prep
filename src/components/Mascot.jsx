// The study mascot — a Lucide rabbit (no emoji). `happy` switches it to the
// green accent used for celebration states.
import { LuRabbit } from "react-icons/lu";

export default function Mascot({ happy = false, ...rest }) {
  return (
    <LuRabbit
      role="img"
      aria-label={happy ? "Happy rabbit" : "Rabbit"}
      color={happy ? "#46A302" : "currentColor"}
      strokeWidth={2.4}
      {...rest}
    />
  );
}