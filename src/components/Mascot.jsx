import { getSkin } from "../lib/store.js";
import { useStore } from "./StoreContext.jsx";

// Renders the currently equipped mascot emoji everywhere phones use one.
// `happy` picks the celebratory variant when one exists.
export default function Mascot({ happy = false, ...rest }) {
  const ctx = useStore();
  const skinKey = (ctx && ctx.skin) || "cat";
  const skin = getSkin(skinKey);
  const emoji = happy ? skin.happy : skin.emoji;
  return (
    <span role="img" aria-label={skin.name} {...rest}>
      {emoji}
    </span>
  );
}
