export function PageSpinner() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <span
        className="h-8 w-8 animate-spin rounded-full border-2 border-pine-700 border-t-transparent"
        aria-label="Loading"
        role="status"
      />
    </div>
  );
}
