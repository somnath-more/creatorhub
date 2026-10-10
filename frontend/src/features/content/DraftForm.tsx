import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/atoms/Button";
import { draftFormSchema, type Draft, type DraftInput } from "./draftSchema";
import { draftRepository } from "./draftRepository";
import { getSessionMedia, setSessionMedia } from "./sessionMedia";
import { MediaField } from "./MediaField";
import { uploadService } from "./uploadService";

export function DraftForm({ draft }: { draft?: Draft }) {
  const navigate = useNavigate();
  const [media, setMedia] = useState(() =>
    draft ? getSessionMedia(draft.id) : {},
  );
  const [invalidMedia, setInvalidMedia] = useState({
    thumbnail: false,
    video: false,
  });
  const [saveError, setSaveError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DraftInput>({
    resolver: zodResolver(draftFormSchema),
    defaultValues: {
      title: draft?.title ?? "",
      description: draft?.description ?? "",
      price: draft ? (draft.priceCents / 100).toFixed(2) : "0.00",
    },
  });

  async function save(values: DraftInput) {
    setSaveError("");
    if (invalidMedia.thumbnail || invalidMedia.video) return;
    try {
      const metadata = Object.fromEntries(
        Object.entries(media)
          .filter(([, file]) => file)
          .map(([kind, file]) => [
            kind,
            { name: file!.name, size: file!.size, type: file!.type },
          ]),
      );
      const saved = await draftRepository.save(values, draft?.id, metadata);
      setSessionMedia(saved.id, media);
      navigate("/content", {
        state: { message: draft ? "Draft updated." : "Draft saved." },
      });
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Your draft could not be saved. Try again.",
      );
    }
  }

  const fieldClass =
    "mt-2 block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm aria-invalid:border-red-600";

  return (
    <form onSubmit={handleSubmit(save)} noValidate className="mt-8 space-y-6">
      <div className="rounded-xl border border-violet-100 bg-violet-50 p-4 text-sm leading-6 text-violet-900">
        Saved in this browser only. Upload progress is simulated; no files leave
        your device. Reselect and upload again after a page reload. Drafts can be
        saved without media, completed uploads, or verification.
      </div>
      {draft && draft.status !== "DRAFT" && (
        <p className="rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          Saving these edits returns this content to Draft and cancels any
          scheduled publication. You will need to publish or schedule it again.
        </p>
      )}
      {saveError && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-4 text-sm text-red-800"
        >
          {saveError}
        </p>
      )}
      <fieldset
        disabled={isSubmitting}
        className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]"
      >
        <legend className="sr-only">Draft details</legend>
        <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div>
            <label htmlFor="title" className="text-sm font-semibold">
              Title
            </label>
            <input
              id="title"
              {...register("title")}
              aria-invalid={!!errors.title}
              aria-describedby="title-error"
              className={fieldClass}
              placeholder="Give your video a clear title"
            />
            <p id="title-error" className="mt-1 text-sm text-red-700">
              {errors.title?.message}
            </p>
          </div>
          <div>
            <label htmlFor="description" className="text-sm font-semibold">
              Description
            </label>
            <textarea
              id="description"
              {...register("description")}
              aria-invalid={!!errors.description}
              aria-describedby="description-error"
              rows={6}
              className={fieldClass}
              placeholder="What will your audience learn or experience?"
            />
            <p id="description-error" className="mt-1 text-sm text-red-700">
              {errors.description?.message}
            </p>
          </div>
          <div>
            <label htmlFor="price" className="text-sm font-semibold">
              Price (USD)
            </label>
            <input
              id="price"
              {...register("price")}
              inputMode="decimal"
              aria-invalid={!!errors.price}
              aria-describedby="price-hint price-error"
              className={fieldClass}
            />
            <p id="price-hint" className="mt-2 text-xs text-slate-500">
              Enter 0 for free content. Up to two decimal places.
            </p>
            <p id="price-error" className="mt-1 text-sm text-red-700">
              {errors.price?.message}
            </p>
          </div>
          <p className="text-sm text-slate-500">
            Publication status:{" "}
            <span className="font-semibold text-slate-700">Draft</span>
          </p>
        </div>
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Media</h2>
          {(["thumbnail", "video"] as const).map((kind) => (
            <MediaField
              key={kind}
              kind={kind}
              file={media[kind]}
              saved={draft?.[kind]}
              onChange={(file) => {
                if (media[kind]) uploadService.cancel(media[kind]);
                uploadService.start(file);
                setMedia((previous) => ({ ...previous, [kind]: file }));
              }}
              onValidityChange={(valid) =>
                setInvalidMedia((previous) => ({ ...previous, [kind]: !valid }))
              }
            />
          ))}
        </div>
      </fieldset>
      <div className="flex flex-wrap items-center gap-4">
        <Button
          type="submit"
          disabled={
            isSubmitting || invalidMedia.thumbnail || invalidMedia.video
          }
          variant="primary"
        >
          {isSubmitting
            ? "Saving…"
            : draft && draft.status !== "DRAFT"
              ? "Save as draft"
              : "Save draft"}
        </Button>
        <Link
          to="/content"
          className="inline-flex min-h-11 items-center px-3 text-sm font-semibold text-slate-600"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
