// The study mascot. Always the cat — mascots are no longer buyable in the
// shop, so this needs no store context. `happy` picks the celebratory emoji.
export default function Mascot({ happy = false, ...rest }) {
  return (
    <span role="img" aria-label="Cat" {...rest}>
      {happy ? "\u{1F638}" : "\u{1F431}"}
    </span>
  );
}