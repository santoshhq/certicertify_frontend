import { Link } from "react-router-dom";
import { Logo } from "../components/Logo";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-paper px-6 text-center">
      <Logo size={56} />
      <h1 className="font-display text-3xl font-bold text-pine-950">Page not found</h1>
      <p className="max-w-sm text-sm text-ink-400">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <Link to="/" className="font-medium text-pine-800 hover:underline">
        Back to home
      </Link>
    </div>
  );
}
