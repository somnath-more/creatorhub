import { describe, expect, it } from "vitest";
import { personalSchema, progressSchema } from "./verificationSchema";

const personal = {
  fullName: "Sample Creator",
  dateOfBirth: "2000-02-29",
  country: "India",
};
describe("verification validation", () => {
  it("accepts a valid leap day and trims names and countries", () => {
    expect(
      personalSchema.parse({
        ...personal,
        fullName: " Sample Creator ",
        country: " India ",
      }),
    ).toEqual(personal);
  });
  it.each(["", "2025-02-29", "2020-13-01", "2999-01-01", "not a date"])(
    "rejects invalid or future date %s",
    (dateOfBirth) => {
      expect(
        personalSchema.safeParse({ ...personal, dateOfBirth }).success,
      ).toBe(false);
    },
  );
  it("rejects blank names and countries", () => {
    expect(
      personalSchema.safeParse({ ...personal, fullName: "  ", country: "" })
        .success,
    ).toBe(false);
  });
  it("does not accept an in-progress confirmation or verified state without explicit approval", () => {
    expect(
      progressSchema.safeParse({
        status: "IN_PROGRESS",
        step: 4,
        personal,
        documentType: "PASSPORT",
      }).success,
    ).toBe(false);
    expect(
      progressSchema.safeParse({
        status: "VERIFIED",
        step: 4,
        personal,
        documentType: "PASSPORT",
        submittedAt: new Date().toISOString(),
      }).success,
    ).toBe(false);
  });
});
