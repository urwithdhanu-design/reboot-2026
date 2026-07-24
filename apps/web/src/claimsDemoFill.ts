import type { AuthUser } from "./api";
import type { CustomerPolicy } from "./customerPolicies";

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type ClaimDemoFields = {
  policy_ref: string;
  category: string;
  amount: string;
  description: string;
};

type DemoTemplate = {
  amount: number;
  description: string;
  categoryOverride?: string;
};

const DEMO_BY_CATEGORY: Record<string, DemoTemplate> = {
  Health: {
    amount: 285,
    description:
      "Outpatient specialist consultation and blood tests — GP referral on file.",
  },
  Property: {
    amount: 1450,
    description:
      "Escape of water from kitchen pipe — damage to flooring and kitchen units.",
  },
  Home: {
    amount: 1450,
    description:
      "Storm damage to rear fence and shed roof following high winds last weekend.",
  },
  Vehicle: {
    amount: 820,
    description:
      "Minor rear-end collision at traffic lights — bumper and parking sensor repair.",
  },
  Pet: {
    amount: 340,
    description: "Emergency vet visit — swallowed foreign object, X-ray and extraction.",
  },
  Travel: {
    amount: 415,
    description: "Trip cancellation — airline strike; unused flights and hotel deposit.",
  },
  Life: {
    amount: 0,
    description: "Policy query — please contact me to discuss a critical illness claim.",
  },
  Parametric: {
    amount: 500,
    description: "Flight delay trigger — arrival more than 4 hours late (parametric payout).",
  },
};

const DEFAULT_DEMO: DemoTemplate = {
  amount: 250,
  description: "Demo claim for policy cover — incident reported via the app.",
};

function templateForCategory(category: string): DemoTemplate {
  return DEMO_BY_CATEGORY[category] ?? DEFAULT_DEMO;
}

export function buildClaimDemoForPolicy(
  policy: CustomerPolicy,
  user: AuthUser,
): ClaimDemoFields {
  const template = templateForCategory(policy.category);
  const category = template.categoryOverride ?? policy.category;
  const name = user.full_name.split(/\s+/)[0] || "Customer";
  return {
    policy_ref: policy.policy_ref,
    category,
    amount: String(template.amount > 0 ? template.amount : Math.round(policy.premium * 2)),
    description: `${template.description} (Policy: ${policy.product_title}, ${name}).`,
  };
}
