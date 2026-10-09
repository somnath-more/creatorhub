import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../../components/atoms/Button";
import { personalSchema, type PersonalInformation } from "./verificationSchema";

type Props = {
  personal: PersonalInformation;
  busy: boolean;
  onContinue: (personal: PersonalInformation) => Promise<void>;
};

export function PersonalInformationForm({ personal, busy, onContinue }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PersonalInformation>({
    resolver: zodResolver(personalSchema),
    defaultValues: personal,
  });
  const inputClass =
    "mt-2 block min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm aria-invalid:border-red-600";
  return (
    <form onSubmit={handleSubmit(onContinue)} noValidate>
      <h2 tabIndex={-1} className="text-xl font-semibold">
        Personal information
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Use fictional details for this demonstration.
      </p>
      <fieldset disabled={busy} className="mt-6 min-w-0 space-y-5">
        <legend className="sr-only">Personal details</legend>
        <div>
          <label htmlFor="full-name" className="text-sm font-semibold">
            Full name
          </label>
          <input
            id="full-name"
            {...register("fullName")}
            aria-invalid={!!errors.fullName}
            aria-describedby="full-name-error"
            className={inputClass}
          />
          <p id="full-name-error" className="mt-1 text-sm text-red-700">
            {errors.fullName?.message}
          </p>
        </div>
        <div>
          <label htmlFor="date-of-birth" className="text-sm font-semibold">
            Date of birth
          </label>
          <input
            id="date-of-birth"
            type="date"
            {...register("dateOfBirth")}
            aria-invalid={!!errors.dateOfBirth}
            aria-describedby="date-of-birth-error"
            className={`${inputClass} min-w-0`}
          />
          <p id="date-of-birth-error" className="mt-1 text-sm text-red-700">
            {errors.dateOfBirth?.message}
          </p>
        </div>
        <div>
          <label htmlFor="country" className="text-sm font-semibold">
            Country
          </label>
          <input
            id="country"
            {...register("country")}
            placeholder="For example, India"
            aria-invalid={!!errors.country}
            aria-describedby="country-error"
            className={inputClass}
          />
          <p id="country-error" className="mt-1 text-sm text-red-700">
            {errors.country?.message}
          </p>
        </div>
      </fieldset>
      <Button type="submit" variant="primary" disabled={busy} className="mt-6">
        {busy ? "Saving..." : "Continue"}
      </Button>
    </form>
  );
}
