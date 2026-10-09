import { useSyncExternalStore } from "react";
import { uploadService } from "./uploadService";

export function MediaUploadProgress({
  file,
  label,
}: {
  file: File;
  label: string;
}) {
  const state = useSyncExternalStore(uploadService.subscribe, () =>
    uploadService.get(file),
  );
  const messages = {
    WAITING: "Waiting to start",
    UPLOADING: "Uploading (simulation)",
    COMPLETED: "Upload completed (simulation)",
    FAILED: "Upload failed. Check your connection and retry.",
    CANCELLED: "Upload cancelled. Retry when ready.",
  };
  const actionClass =
    "min-h-11 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-violet-700";
  return (
    <div className="mt-3 space-y-2">
      <p
        role={state.status === "FAILED" ? "alert" : "status"}
        className={`text-sm leading-6 ${state.status === "FAILED" ? "text-red-700" : "text-slate-700"}`}
      >
        {label}: {messages[state.status]}
      </p>
      <div className="flex items-center gap-3">
        <progress
          aria-label={`${label} upload progress`}
          value={state.progress}
          max={100}
          className="h-2 min-w-0 flex-1 accent-violet-600"
        />
        <span aria-hidden="true" className="text-xs tabular-nums text-slate-600">
          {state.progress}%
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {state.status === "UPLOADING" && (
          <>
            <button type="button" className={actionClass} onClick={() => uploadService.cancel(file)}>
              Cancel {label.toLowerCase()} upload
            </button>
            <button type="button" className={actionClass} onClick={() => uploadService.simulateFailure(file)}>
              Simulate {label.toLowerCase()} failure
            </button>
          </>
        )}
        {["WAITING", "FAILED", "CANCELLED"].includes(state.status) && (
          <button type="button" className={actionClass} onClick={() => uploadService.start(file)}>
            {state.status === "WAITING" ? "Start" : "Retry"} {label.toLowerCase()} upload
          </button>
        )}
      </div>
      {state.status !== "COMPLETED" && (
        <p className="text-xs leading-5 text-slate-500">
          Draft saving is available. Publishing requires both uploads to complete.
          Retry restarts from 0%.
        </p>
      )}
    </div>
  );
}
