import { useId, useState } from "react";
import type { FileMetadata } from "./draftSchema";
import { ThumbnailPreview } from "./ThumbnailPreview";

type Props = {
  kind: "thumbnail" | "video";
  file?: File;
  saved?: FileMetadata;
  onChange: (file: File) => void;
  onValidityChange: (valid: boolean) => void;
};

export function MediaField({
  kind,
  file,
  saved,
  onChange,
  onValidityChange,
}: Props) {
  const id = useId();
  const [error, setError] = useState("");
  const isThumbnail = kind === "thumbnail";
  const label = isThumbnail ? "Thumbnail" : "Video";
  const types = isThumbnail
    ? ["image/jpeg", "image/png", "image/webp"]
    : ["video/mp4", "video/webm", "video/quicktime"];
  const limit = isThumbnail ? 5 * 1024 ** 2 : 2 * 1024 ** 3;

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <label htmlFor={id} className="block text-sm font-semibold">
        {label}
      </label>
      <p id={`${id}-hint`} className="mt-1 text-xs leading-5 text-slate-500">
        {isThumbnail
          ? "JPG, PNG, or WebP. Up to 5 MB."
          : "MP4, WebM, or MOV. Up to 2 GB."}{" "}
        Optional for a draft.
      </p>
      <input
        id={id}
        type="file"
        accept={types.join(",")}
        aria-invalid={!!error}
        aria-describedby={`${id}-hint ${id}-error`}
        className="mt-3 block min-h-11 w-full min-w-0 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-violet-50 file:px-3 file:py-2.5 file:font-medium file:text-violet-700"
        onChange={(event) => {
          const selected = event.target.files?.[0];
          if (!selected) return;
          const message = !types.includes(selected.type)
            ? `Choose a supported ${kind} format.`
            : selected.size === 0
              ? "This file is empty. Choose another file."
              : selected.size > limit
                ? `File is too large. Maximum ${isThumbnail ? "5 MB" : "2 GB"}.`
                : "";
          setError(message);
          onValidityChange(!message);
          if (!message) onChange(selected);
          else event.target.value = "";
        }}
      />
      <p
        id={`${id}-error`}
        role={error ? "alert" : undefined}
        className="mt-2 text-sm text-red-700"
      >
        {error}
      </p>
      {error && (
        <button
          type="button"
          className="mt-2 min-h-11 text-sm font-semibold text-violet-700"
          onClick={() => {
            setError("");
            onValidityChange(true);
          }}
        >
          {file || saved
            ? "Keep previous selection"
            : "Continue without this file"}
        </button>
      )}
      {file && (
        <p className="mt-2 break-all text-xs text-slate-600">
          Selected: {file.name} ({(file.size / 1024 ** 2).toFixed(2)} MB)
        </p>
      )}
      {!file && saved && (
        <p className="mt-2 break-all text-xs text-amber-800">
          Previously selected: {saved.name}. Reselect this file to restore its
          preview; only its details were saved.
        </p>
      )}
      {file && isThumbnail && (
        <ThumbnailPreview
          file={file}
          className="mt-3 aspect-video w-full rounded-lg object-cover"
        />
      )}
    </div>
  );
}
