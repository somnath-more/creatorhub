export type UploadState = {
  status: "WAITING" | "UPLOADING" | "COMPLETED" | "FAILED" | "CANCELLED";
  progress: number;
};

export interface UploadService {
  get(file: File): UploadState;
  subscribe(listener: () => void): () => void;
  start(file: File): void;
  cancel(file: File): void;
  simulateFailure(file: File): void;
}

const waiting: UploadState = { status: "WAITING", progress: 0 };
const states = new WeakMap<File, UploadState>();
const timers = new WeakMap<File, ReturnType<typeof setInterval>>();
const listeners = new Set<() => void>();

function update(file: File, state: UploadState) {
  states.set(file, state);
  listeners.forEach((listener) => listener());
}

function stop(file: File) {
  clearInterval(timers.get(file));
  timers.delete(file);
}

// Demo adapter: advances a timer without reading, buffering, or transmitting files.
// Replace this adapter with a server-backed upload service for production.
export const uploadService: UploadService = {
  get: (file) => states.get(file) ?? waiting,
  subscribe(listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  start(file) {
    if (["UPLOADING", "COMPLETED"].includes(this.get(file).status)) return;
    stop(file);
    update(file, { status: "UPLOADING", progress: 0 });
    timers.set(
      file,
      setInterval(() => {
        if (!navigator.onLine) {
          this.simulateFailure(file);
          return;
        }
        const progress = Math.min(100, this.get(file).progress + 5);
        if (progress === 100) stop(file);
        update(file, {
          status: progress === 100 ? "COMPLETED" : "UPLOADING",
          progress,
        });
      }, 250),
    );
  },
  cancel(file) {
    if (this.get(file).status !== "UPLOADING") return;
    stop(file);
    update(file, { status: "CANCELLED", progress: this.get(file).progress });
  },
  simulateFailure(file) {
    if (this.get(file).status !== "UPLOADING") return;
    stop(file);
    update(file, { status: "FAILED", progress: this.get(file).progress });
  },
};
