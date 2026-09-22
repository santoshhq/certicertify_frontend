import { Logo } from "./Logo";

function isPdf(url: string) {
  return url.toLowerCase().split("?")[0].endsWith(".pdf");
}

/** Chrome/Edge honour these fragment params to hide the PDF toolbar (open in Drive, print, download). */
function viewerUrl(url: string) {
  return `${url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`;
}

const WATERMARK_CELLS = Array.from({ length: 6 });

/**
 * Read-only certificate preview: no viewer toolbar, right-click disabled,
 * and a tiled CertiCertify watermark laid over the document.
 */
export function CertificateViewer({ url, rollNo }: { url: string; rollNo: string }) {
  return (
    <div
      className="relative h-full min-h-[360px] w-full flex-1 select-none overflow-hidden lg:min-h-[420px]"
      onContextMenu={(e) => e.preventDefault()}
    >
      {isPdf(url) ? (
        <iframe
          src={viewerUrl(url)}
          title={`Certificate for ${rollNo}`}
          className="h-full min-h-[360px] w-full lg:min-h-[420px]"
        />
      ) : (
        <img
          src={url}
          alt={`Certificate for ${rollNo}`}
          draggable={false}
          className="h-full w-full object-contain"
        />
      )}

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 grid grid-cols-2 content-around justify-items-center gap-y-16 overflow-hidden"
      >
        {WATERMARK_CELLS.map((_, i) => (
          <span
            key={i}
            className="flex -rotate-[28deg] items-center gap-2 whitespace-nowrap opacity-[0.09]"
          >
            <Logo size={22} className="grayscale" />
            <span className="font-display text-sm font-bold uppercase tracking-[0.2em] text-pine-950">
              CertiCertify
            </span>
          </span>
        ))}
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-pine-950/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white"
      >
        <Logo size={16} />
        Verified by CertiCertify
      </div>
    </div>
  );
}
