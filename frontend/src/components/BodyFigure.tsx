// Hand-drawn, flesh-toned line-art figures (front / back) in the style of the
// classic meridian charts (cf. zenheart.com.tw/Meridian.php).
// Source: Wikimedia Commons "Silhouette femme homme antérieur postérieur.svg"
// by cdang (Christophe Dang Ngoc Chan), released under CC0 1.0 (public domain).
// The male anterior/posterior outlines were extracted and the body interior
// flood-filled with a warm flesh tone so our coloured meridian lines and
// acupoints read clearly on top.
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
