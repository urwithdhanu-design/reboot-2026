import type { AuthUser } from "./api";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export { sleep };

export function splitFullName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "Demo", last: "Customer" };
  if (parts.length === 1) return { first: parts[0], last: "Customer" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

/** Demo answers for the 5-step health quote wizard (18–79 DOB). */
export function buildHealthDemoAnswers(user: AuthUser): Record<string, string> {
  const { first, last } = splitFullName(user.full_name);
  const start = new Date();
  start.setDate(start.getDate() + 3);
  return {
    title: "Mr",
    first_name: first,
    last_name: last,
    dob_day: "15",
    dob_month: "06",
    dob_year: "1990",
    postcode: "SW1A 1AA",
    cover_who: "Myself",
    cover_start_date: start.toISOString().slice(0, 10),
    email: user.email,
    phone: user.mobile_number?.trim() || "07123456789",
  };
}

/** Progressive merge so each wizard step visibly receives its fields. */
export function healthDemoAnswersThroughStep(
  step: number,
  full: Record<string, string>,
): Record<string, string> {
  if (step <= 1) {
    return {
      title: full.title,
      first_name: full.first_name,
      last_name: full.last_name,
      dob_day: full.dob_day,
      dob_month: full.dob_month,
      dob_year: full.dob_year,
    };
  }
  if (step === 2) {
    return { ...healthDemoAnswersThroughStep(1, full), postcode: full.postcode };
  }
  if (step === 3) {
    return { ...healthDemoAnswersThroughStep(2, full), cover_who: full.cover_who };
  }
  if (step === 4) {
    return {
      ...healthDemoAnswersThroughStep(3, full),
      cover_start_date: full.cover_start_date,
    };
  }
  return { ...full };
}
