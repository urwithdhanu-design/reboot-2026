export function formatWalletConsentApprovedNotice(approvedAt: string): string {
  return `Wallet consent approved on ${new Date(approvedAt).toLocaleString()}`;
}

export function WalletConsentApprovedNotice({
  approvedAt,
  className,
}: {
  approvedAt: string;
  className?: string;
}) {
  return (
    <p
      className={`manage-notice wallet-consent-notice${className ? ` ${className}` : ""}`}
      role="status"
    >
      {formatWalletConsentApprovedNotice(approvedAt)}
    </p>
  );
}
