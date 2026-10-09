import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { Button } from "../../components/atoms/Button";
import { verificationRepository } from "./verificationRepository";
import type { DocumentType, VerificationProgress } from "./verificationSchema";
import { PersonalInformationForm } from "./PersonalInformationForm";
import { EvidenceInput } from "./EvidenceInput";
import { VerificationSteps } from "./VerificationSteps";

export function VerificationWizard() {
  const [params] = useSearchParams();
  const requestedReturn = params.get("returnTo") ?? "";
  const returnTo = /^\/content\/[a-zA-Z0-9-]+$/.test(requestedReturn)
    ? requestedReturn
    : "/content";
  const [progress, setProgress] = useState<VerificationProgress>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const [document, setDocument] = useState<File>();
  const [selfie, setSelfie] = useState<File>();
  const [documentType, setDocumentType] = useState<DocumentType>("");
  const [validation, setValidation] = useState("");
  const [resumed, setResumed] = useState(false);
  const section = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    verificationRepository
      .load()
      .then((saved) => {
        if (!active) return;
        // File bytes are never persisted. Return to document selection after reload.
        setProgress(
          saved.status === "IN_PROGRESS" && saved.step === 3
            ? { ...saved, step: 2 }
            : saved,
        );
        setDocumentType(saved.documentType);
        setResumed(saved.status === "IN_PROGRESS" && saved.step >= 2);
        setError("");
      })
      .catch((reason) => {
        if (active) setError(reason.message);
      });
    return () => {
      active = false;
    };
  }, [retry]);

  useEffect(() => {
    section.current?.querySelector<HTMLElement>("h2")?.focus();
  }, [progress?.step, progress?.status]);

  async function persist(next: VerificationProgress) {
    setBusy(true);
    setError("");
    setValidation("");
    try {
      const saved = await verificationRepository.save(next);
      setProgress(saved);
      if (saved.status === "SUBMITTED") {
        setDocument(undefined);
        setSelfie(undefined);
      }
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Progress could not be saved. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function approveDemo() {
    setBusy(true);
    setError("");
    try {
      setProgress(await verificationRepository.simulateApproval());
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Demo approval failed. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!progress && !error)
    return (
      <p role="status" className="mt-8 text-sm text-slate-500">
        Loading verification progress...
      </p>
    );
  if (!progress)
    return (
      <div
        role="alert"
        className="mt-8 rounded-xl bg-red-50 p-5 text-sm text-red-800"
      >
        <p>{error}</p>
        <Button
          className="mt-3"
          onClick={() => {
            setError("");
            setRetry((value) => value + 1);
          }}
        >
          Try again
        </Button>
      </div>
    );

  return (
    <>
      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        Demo only: use fictional personal details and sample files. Nothing is
        uploaded or checked by an identity service. Progress is saved in this
        browser when you continue or go back.
      </div>
      <p className="mt-4 text-sm text-slate-600">
        Status:{" "}
        <span className="font-semibold">
          {progress.status === "NOT_STARTED"
            ? "Not started"
            : progress.status === "IN_PROGRESS"
              ? "In progress"
              : progress.status === "VERIFIED"
                ? "Verified (demo)"
                : "Submitted"}
        </span>
      </p>
      <VerificationSteps
        current={progress.status === "NOT_STARTED" ? 0 : progress.step}
      />
      {resumed && progress.status === "IN_PROGRESS" && (
        <p role="status" className="mt-4 text-sm leading-6 text-violet-800">
          Your saved progress is ready. Reselect sample files after a page
          reload; only personal details and the identification type are
          retained.
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </p>
      )}
      {validation && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-800"
        >
          {validation}
        </p>
      )}
      <div
        ref={section}
        className="mt-6 max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 sm:p-8"
      >
        {progress.status === "NOT_STARTED" ? (
          <>
            <ShieldCheck
              size={32}
              className="text-violet-600"
              aria-hidden="true"
            />
            <h2 tabIndex={-1} className="mt-4 text-xl font-semibold">
              Get ready to publish
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Complete three simple steps to simulate submitting your identity
              verification. You can create drafts before verification.
            </p>
            <Button
              variant="primary"
              className="mt-6"
              disabled={busy}
              onClick={() =>
                void persist({ ...progress, status: "IN_PROGRESS" })
              }
            >
              {busy ? "Saving..." : "Start verification"}
            </Button>
          </>
        ) : progress.status === "SUBMITTED" ||
          progress.status === "VERIFIED" ? (
          <>
            <ShieldCheck
              size={40}
              className="text-emerald-600"
              aria-hidden="true"
            />
            <h2 tabIndex={-1} className="mt-4 text-2xl font-semibold">
              {progress.status === "VERIFIED"
                ? "Verified for demo publishing"
                : "Verification submitted"}
            </h2>
            <p
              role="status"
              className="mt-3 text-sm leading-6 text-emerald-800"
            >
              {progress.status === "VERIFIED"
                ? "Demo approval is complete. You can now simulate publishing and scheduling."
                : "Your simulated verification has been successfully submitted."}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {progress.status === "VERIFIED"
                ? "This approval is a local demonstration, not a real identity check."
                : "Submission is awaiting review and does not mean your account is verified. Publishing remains locked until you explicitly simulate approval below."}
            </p>
            <Link
              to={returnTo}
              className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700"
            >
              Back to content
            </Link>
            {progress.status === "SUBMITTED" && (
              <div className="mt-5 border-t border-slate-200 pt-5">
                <p className="mb-3 text-xs leading-5 text-slate-500">
                  Assessment demo control: simulate a successful review without
                  an external identity service.
                </p>
                <Button disabled={busy} onClick={() => void approveDemo()}>
                  {busy ? "Approving..." : "Simulate approval (demo)"}
                </Button>
              </div>
            )}
          </>
        ) : progress.step === 1 ? (
          <PersonalInformationForm
            personal={progress.personal}
            busy={busy}
            onContinue={(personal) =>
              persist({ ...progress, personal, step: 2 })
            }
          />
        ) : progress.step === 2 ? (
          <>
            <h2 tabIndex={-1} className="text-xl font-semibold">
              Identity document
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Choose a document type and select a sample file to simulate
              uploading it.
            </p>
            <fieldset disabled={busy} className="mt-6 min-w-0">
              <legend className="sr-only">Identity document details</legend>
              <label htmlFor="document-type" className="text-sm font-semibold">
                Identification type
              </label>
              <select
                id="document-type"
                value={documentType}
                onChange={(event) => {
                  setDocumentType(event.target.value as DocumentType);
                  setDocument(undefined);
                  setValidation("");
                }}
                className="mt-2 block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">Select identification type</option>
                <option value="PASSPORT">Passport</option>
                <option value="NATIONAL_ID">National identity card</option>
                <option value="DRIVING_LICENSE">Driving licence</option>
              </select>
              <EvidenceInput
                kind="document"
                file={document}
                onSelect={(file) => {
                  setDocument(file);
                  setValidation("");
                }}
              />
            </fieldset>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                disabled={busy}
                onClick={() =>
                  void persist({ ...progress, documentType, step: 1 })
                }
              >
                Back
              </Button>
              <Button
                variant="primary"
                disabled={busy}
                onClick={() => {
                  if (!documentType) {
                    setValidation("Select an identification type.");
                    return;
                  }
                  if (!document) {
                    setValidation(
                      "Choose a sample identity document to continue.",
                    );
                    return;
                  }
                  void persist({ ...progress, documentType, step: 3 });
                }}
              >
                {busy ? "Saving..." : "Continue"}
              </Button>
            </div>
          </>
        ) : (
          <>
            <h2 tabIndex={-1} className="text-xl font-semibold">
              Identity check
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Select a sample selfie to simulate the final identity check.
              Camera access and facial recognition are not used.
            </p>
            <fieldset disabled={busy} className="min-w-0">
              <legend className="sr-only">Simulated identity check</legend>
              <EvidenceInput
                kind="selfie"
                file={selfie}
                onSelect={(file) => {
                  setSelfie(file);
                  setValidation("");
                }}
              />
            </fieldset>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                disabled={busy}
                onClick={() => void persist({ ...progress, step: 2 })}
              >
                Back
              </Button>
              <Button
                variant="primary"
                disabled={busy}
                onClick={() => {
                  if (!document) {
                    setValidation(
                      "Reselect your sample identity document before submitting.",
                    );
                    return;
                  }
                  if (!selfie) {
                    setValidation("Choose a sample selfie to continue.");
                    return;
                  }
                  void persist({
                    ...progress,
                    status: "SUBMITTED",
                    step: 4,
                    submittedAt: new Date().toISOString(),
                  });
                }}
              >
                {busy ? "Submitting..." : "Submit verification"}
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
