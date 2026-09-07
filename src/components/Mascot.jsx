import { getSkin } from "../lib/store.js";
import { useStore } from "./StoreContext.jsx";

export default function Mascot({ happy = false, ...rest }) {
  const ctx = useStore();
  const skinKey = (ctx && ctx.skin) || "cat";
  const skin = getSkin(skinKey);
  const file = happy && skin.pngHappy ? skin.pngHappy : skin.png;
  return <img src={"/icons/" + file + ".png"} alt={skin.name} {...rest} />;
}