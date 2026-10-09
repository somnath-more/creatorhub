import { useId, useState } from "react";

type Props = {
  kind: "document" | "selfie";
  file?: File;
  onSelect: (file?: File) => void;
};

export function EvidenceInput({ kind, file, onSelect }: Props) {
  const id = useId();
  const [error, setError] = useState("");
  const types =
    kind === "document"
      ? ["image/jpeg", "image/png", "application/pdf"]
      : ["image/jpeg", "image/png"];
  return (
    <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-5">
      <label htmlFor={id} className="block text-sm font-semibold">
        {kind === "document" ? "Sample identity document" : "Sample selfie"}
      </label>
      <p id={`${id}-hint`} className="mt-2 text-xs leading-5 text-slate-500">
        {kind === "document" ? "JPG, PNG, or PDF" : "JPG or PNG"}, up to 10 MB.
        Choose a sample file only.
      </p>
      <input
        id={id}
        type="file"
        accept={types.join(",")}
        aria-invalid={!!error}
        aria-describedby={`${id}-hint ${id}-error`}
        className="mt-4 block min-h-11 w-full min-w-0 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-violet-50 file:px-3 file:py-2.5 file:font-semibold file:text-violet-700"
        onChange={(event) => {
          const selected = event.target.files?.[0];
          if (!selected) return;
          const message = !types.includes(selected.type)
            ? "Choose a supported file format."
            : selected.size === 0
              ? "Choose a nonempty sample file."
              : selected.size > 10 * 1024 ** 2
                ? "Choose a sample file smaller than 10 MB."
                : "";
          setError(message);
          onSelect(message ? undefined : selected);
          if (message) event.target.value = "";
        }}
      />
      <p
        id={`${id}-error`}
        role={error ? "alert" : undefined}
        className="mt-2 text-sm text-red-700"
      >
        {error}
      </p>
      {file && (
        <p className="mt-2 break-all text-sm text-emerald-800">
          Selected for simulation: {file.name}
        </p>
      )}
    </div>
  );
}
