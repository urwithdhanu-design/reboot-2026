/** Customer web base URL for published partner quote UIs (local dev default). */
export const CUSTOMER_WEB_ORIGIN =
  import.meta.env.VITE_CUSTOMER_WEB_ORIGIN ?? "http://localhost:5174";

/** Vendor code → quote/product entry path on the customer app. */
export const VENDOR_QUOTE_PATHS: Record<string, string> = {
  vitality: "/quote/health-plan",
  homeshield: "/quote/home-insurance",
};

export function vendorUiPath(code: string): string {
  const normalized = code.trim().toLowerCase();
  return VENDOR_QUOTE_PATHS[normalized] ?? `/vendors/${normalized}`;
}

export function localVendorUiUrl(code: string): string {
  return `${CUSTOMER_WEB_ORIGIN}/vendors/${code.trim().toLowerCase()}`;
}

export function resolveVendorQuotePath(vendorCode: string): string | null {
  const normalized = vendorCode.trim().toLowerCase();
  return VENDOR_QUOTE_PATHS[normalized] ?? null;
}
