import clsx from "clsx";
import logoImg from "../assets/certicertify_logo.jpeg";

// The source JPEG has a wide white margin: the mark only spans ~72% of the
// canvas (x 85–536 of 622) and sits ~1% above centre. Scale the image inside a
// clipped circle so the mark fills the badge instead of floating in it.
const MARK_ZOOM = 1.25;
const MARK_SHIFT_Y = "1.2%";

export function Logo({ size = 40, className }: { size?: number; className?: string }) {
  const inner = Math.round(size * MARK_ZOOM);
  return (
    <span
      className={clsx(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white",
        className
      )}
      style={{ width: size, height: size }}
    >
      <img
        src={logoImg}
        alt="CertiCertify"
        width={inner}
        height={inner}
        decoding="async"
        draggable={false}
        style={{
          width: inner,
          height: inner,
          maxWidth: "none",
          objectFit: "contain",
          transform: `translateY(${MARK_SHIFT_Y})`,
        }}
      />
    </span>
  );
}
