import logoImg from "../assets/certicertify_logo.jpeg";

export function Logo({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <img
      src={logoImg}
      alt="CertiCertify"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: "contain", borderRadius: "9999px" }}
    />
  );
}
