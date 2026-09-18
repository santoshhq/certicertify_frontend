import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import type { LucideIcon } from "lucide-react";

export const CERTIFICATE_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".zip"];

export function isCertificateFile(file: File) {
  const name = file.name.toLowerCase();
  return CERTIFICATE_EXTENSIONS.some((ext) => name.endsWith(ext));
}

export function isZipFile(file: File) {
  return file.name.toLowerCase().endsWith(".zip");
}

export function DropZone({
  label,
  hint,
  icon: Icon,
  accept,
  multiple,
  onFiles,
}: {
  label: string;
  hint: string;
  icon: LucideIcon;
  accept: string;
  multiple?: boolean;
  onFiles: (files: FileList) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors ${
        dragging ? "border-pine-600 bg-mint-100" : "border-sage-300 bg-mint-50 hover:bg-mint-100"
      }`}
    >
      <Icon size={22} className="text-pine-700" strokeWidth={1.5} />
      <p className="text-sm font-medium text-ink-900">{label}</p>
      <p className="text-xs text-ink-400">{hint}</p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          if (e.target.files?.length) onFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
