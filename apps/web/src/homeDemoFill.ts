import type { AuthUser } from "./api";
import { splitFullName } from "./healthDemoFill";

const HOME_DEMO_ADDRESS = "BUCKINGHAM PALACE\nTHE MALL\nLONDON\nSW1A 1AA";

/** Demo answers for the 13-step home insurance quote wizard. */
export function buildHomeDemoAnswers(user: AuthUser): Record<string, string> {
  const { first, last } = splitFullName(user.full_name);
  const start = new Date();
  start.setDate(start.getDate() + 3);
  return {
    title: "Mr",
    first_name: first,
    last_name: last,
    email: user.email,
    dob_day: "15",
    dob_month: "06",
    dob_year: "1985",
    address_line: HOME_DEMO_ADDRESS,
    address_confirmed: "Yes",
    assumptions_home: "Yes",
    assumptions_more: "Yes",
    cover_type: "Buildings and Contents",
    second_policyholder: "No",
    cover_start_date: start.toISOString().slice(0, 10),
    claims_count: "0 claims",
    insurance_years: "5+ years",
    away_cover: "Yes",
    high_value_items: "No",
  };
}

/** Wizard steps to visit during demo fill (skips claim details when no claims). */
export function homeDemoStepSequence(claimsCount: string): number[] {
  const steps = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  if (!claimsCount.startsWith("0")) {
    steps.push(10);
  }
  steps.push(11, 12, 13);
  return steps;
}

/** Progressive merge so each wizard step visibly receives its fields. */
export function homeDemoAnswersThroughStep(
  step: number,
  full: Record<string, string>,
): Record<string, string> {
  if (step <= 1) return {};
  if (step === 2) {
    return {
      title: full.title,
      first_name: full.first_name,
      last_name: full.last_name,
      email: full.email,
      dob_day: full.dob_day,
      dob_month: full.dob_month,
      dob_year: full.dob_year,
    };
  }
  if (step === 3) {
    return {
      ...homeDemoAnswersThroughStep(2, full),
      address_line: full.address_line,
      address_confirmed: full.address_confirmed,
    };
  }
  if (step === 4) {
    return { ...homeDemoAnswersThroughStep(3, full), assumptions_home: full.assumptions_home };
  }
  if (step === 5) {
    return { ...homeDemoAnswersThroughStep(4, full), assumptions_more: full.assumptions_more };
  }
  if (step === 6) {
    return { ...homeDemoAnswersThroughStep(5, full), cover_type: full.cover_type };
  }
  if (step === 7) {
    return {
      ...homeDemoAnswersThroughStep(6, full),
      second_policyholder: full.second_policyholder,
    };
  }
  if (step === 8) {
    return { ...homeDemoAnswersThroughStep(7, full), cover_start_date: full.cover_start_date };
  }
  if (step === 9) {
    return { ...homeDemoAnswersThroughStep(8, full), claims_count: full.claims_count };
  }
  if (step === 10) {
    return {
      ...homeDemoAnswersThroughStep(9, full),
      claim1_month: full.claim1_month ?? "",
      claim1_year: full.claim1_year ?? "",
      claim2_month: full.claim2_month ?? "",
      claim2_year: full.claim2_year ?? "",
    };
  }
  if (step === 11) {
    return { ...homeDemoAnswersThroughStep(9, full), insurance_years: full.insurance_years };
  }
  if (step === 12) {
    return { ...homeDemoAnswersThroughStep(11, full), away_cover: full.away_cover };
  }
  return { ...full };
}
