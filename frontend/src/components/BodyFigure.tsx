// Realistic anatomy figures (front / back).
// Source: Wikimedia Commons "Human body diagrams" by Mikael Häggström,
// released under CC0 1.0 (public domain). Images were trimmed to the body
// bounds and downscaled; the original white background is dropped onto the
// parchment via mix-blend-mode: multiply.
//
// The atlas SVG uses viewBox "0 0 400 600"; the image is fit inside it with
// preserveAspectRatio="xMidYMid meet" so the whole body (incl. hands/feet)
// stays visible and undistorted. Acupoint coordinates are calibrated to this
// space.

export default function BodyFigure({ side }: { side: "front" | "back" }) {
  const href = side === "front" ? "/anatomy/body-front.png" : "/anatomy/body-back.png";
  return (
    <image
      href={href}
      x={0}
      y={0}
      width={400}
      height={600}
      preserveAspectRatio="xMidYMid meet"
      style={{ mixBlendMode: "multiply" }}
    />
  );
}
