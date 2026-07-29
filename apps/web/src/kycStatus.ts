export type KycStatus = "not_started" | "in_progress" | "pending_consent" | "verified" | "rejected" | string;

export function isKycPendingConsent(status: KycStatus | null | undefined) {
  return status === "pending_consent";
}

export function isKycVerified(status: KycStatus | null | undefined) {
  return status === "verified";
}

export function needsKycAttention(status: KycStatus | null | undefined) {
  return !isKycVerified(status);
}

export function isKycRequiredMessage(message: string) {
  return /kyc/i.test(message);
}

export function formatKycStatus(status: KycStatus | null | undefined) {
  const value = status || "not_started";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function kycStatusPillVariant(status: KycStatus | null | undefined) {
  switch (status) {
    case "in_progress":
      return "pending";
    case "pending_consent":
      return "pending";
    case "rejected":
      return "warning";
    case "verified":
      return "success";
    default:
      return "neutral";
  }
}

export function kycPromptCopy(status: KycStatus | null | undefined) {
  switch (status) {
    case "in_progress":
      return {
        eyebrow: "Verification in progress",
        title: "We are reviewing your identity documents",
        body: "Your KYC submission is pending review. You can return here to check status. Wallet setup unlocks once verification is approved.",
        cta: "View KYC status",
        tone: "pending" as const,
      };
    case "pending_consent":
      return {
        eyebrow: "Action required",
        title: "Approve digitisation & privacy consent",
        body: "Your identity check has been approved. Review the UK consent terms and approve to complete verification and unlock your wallet.",
        cta: "Review consent",
        tone: "action" as const,
      };
    case "rejected":
      return {
        eyebrow: "Action required",
        title: "We need updated identity documents",
        body: "Your previous verification could not be approved. Please resubmit your documents so we can connect your wallet and issue policies.",
        cta: "Resubmit KYC",
        tone: "warning" as const,
      };
    case "verified":
      return {
        eyebrow: "Verified",
        title: "Identity verification complete",
        body: "You can set up your wallet and continue with quotes and policies.",
        cta: "Go to wallet",
        tone: "success" as const,
      };
    default:
      return {
        eyebrow: "Before your wallet",
        title: "Complete KYC verification",
        body: "Verify your identity to create or link a wallet. This keeps your policies and payouts secure.",
        cta: "Start KYC verification",
        tone: "action" as const,
      };
  }
}
