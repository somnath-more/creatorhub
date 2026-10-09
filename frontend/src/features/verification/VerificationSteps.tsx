const steps = [
  "Personal information",
  "Identity document",
  "Identity check",
  "Confirmation",
];

export function VerificationSteps({ current }: { current: number }) {
  return (
    <ol
      aria-label="Verification steps"
      className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4"
    >
      {steps.map((label, index) => (
        <li
          key={label}
          aria-current={current === index + 1 ? "step" : undefined}
          className={`rounded-xl border p-3 text-sm ${current === index + 1 ? "border-violet-300 bg-violet-50 text-violet-800" : "border-slate-200 bg-white text-slate-500"}`}
        >
          <span className="mb-1 block text-xs font-semibold">
            Step {index + 1}
            {current > index + 1 ? " · Complete" : ""}
          </span>
          {label}
        </li>
      ))}
    </ol>
  );
}
