import logoImg from "../assets/certicertify_logo.jpeg";

export function Logo({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <img
      src={logoImg}
      alt="CertiCertify"
      width={size}
      height={size}
      decoding="async"
      draggable={false}
      className={className}
      style={{
        width: size,
        height: size,
        aspectRatio: "1 / 1",
        objectFit: "contain",
        borderRadius: "9999px",
        flexShrink: 0,
      }}
    />
  );
}
