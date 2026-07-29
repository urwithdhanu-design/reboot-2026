export type RegistrationTermsSectionId = "terms" | "privacy" | "risk";

export type RegistrationTermsSection = {
  id: RegistrationTermsSectionId;
  title: string;
  eyebrow: string;
  points: readonly string[];
};

/** UK-aligned account terms, privacy, and risk governance shown at registration. */
export const REGISTRATION_TERMS_SECTIONS: readonly RegistrationTermsSection[] = [
  {
    id: "terms",
    title: "Terms & Conditions",
    eyebrow: "Digitised insurance contracts · UK consumer protection",
    points: [
      "By creating an account you agree to use Reboot 2026 Insurance in accordance with UK insurance distribution rules and applicable consumer contract regulations.",
      "Insurance policies, certificates, endorsements, schedules, and claim settlement records may be issued and held as digitised electronic contracts on secure UK/EU infrastructure.",
      "Digitised policy assets (including ledger certificates or tokenised cover proof) may be linked to your digital wallet where you consent to wallet linking for cover verification and claim payouts.",
      "Quotes, binders, and policy documents are provided electronically; you agree to receive contract variations, renewal notices, and servicing communications in digital form.",
      "Cover is subject to policy terms, limits, exclusions, and eligibility criteria disclosed at quote and bind — digitisation does not alter the underlying insurance contract.",
      "You must provide accurate registration details and keep your contact information up to date so we can meet FCA conduct and disclosure obligations.",
      "We may suspend or close accounts that breach these terms, present fraud risk, or fail identity or AML checks required under UK law.",
      "Reboot 2026 acts as an insurance distribution platform; regulated insurers remain responsible for underwriting decisions and policy performance.",
    ],
  },
  {
    id: "privacy",
    title: "Privacy Policy & data consent",
    eyebrow: "UK GDPR · Data Protection Act 2018",
    points: [
      "I consent to Reboot 2026 Insurance collecting and processing my personal data (name, email, mobile number, and account credentials) to create and operate my account.",
      "I understand identity verification data (ID documents, selfies, and liveness checks) will be processed solely for KYC, AML, and regulatory audit purposes where I proceed with verification.",
      "Personal data may be shared with regulated insurers, claims handlers, payment providers, and fraud-prevention partners only where necessary and lawful under UK GDPR.",
      "Data is stored on secure infrastructure with encryption and access controls aligned to UK financial services and insurance sector expectations.",
      "I may request access, correction, restriction, or erasure of my personal data subject to legal, regulatory, and contractual retention requirements.",
      "Marketing communications will only be sent where permitted by law and my preferences; core servicing messages about policies and verification may still be sent.",
      "Cross-border processing, where required for cloud hosting or insurer partners, will be protected by appropriate UK GDPR safeguards.",
      "Our full privacy notice describes retention periods, lawful bases, and how to contact us or the ICO regarding data protection concerns.",
    ],
  },
  {
    id: "risk",
    title: "Risk governance & conduct",
    eyebrow: "AML · Fraud Act 2006 · FCA conduct",
    points: [
      "I confirm the information I provide is accurate and I will not submit false identity documents or misrepresent my insurable interest, in line with the Fraud Act 2006.",
      "Automated and manual identity checks, sanctions screening, and fraud scoring may be applied before cover is bound or claims are settled.",
      "High-risk activity, suspicious transactions, or policy abuse may be escalated to compliance review and reported to authorities where required by UK AML regulations.",
      "Wallet linking and on-ledger settlement activity is monitored for conduct, duplicate claims, and financial crime indicators.",
      "Parametric and automated claim triggers are governed by pre-agreed rules; disputes follow the platform complaints and insurer dispute-resolution procedures.",
      "We maintain audit trails of consent, verification, policy issuance, and settlement events to support regulatory oversight and customer dispute handling.",
      "Customers must not use the platform to launder money, evade sanctions, or facilitate insurance fraud — accounts may be frozen pending investigation.",
      "Risk governance measures may evolve as UK regulatory guidance on digital assets, open finance, and insurance innovation develops.",
    ],
  },
] as const;

export function sectionById(id: RegistrationTermsSectionId): RegistrationTermsSection {
  return REGISTRATION_TERMS_SECTIONS.find((section) => section.id === id) ?? REGISTRATION_TERMS_SECTIONS[0];
}
