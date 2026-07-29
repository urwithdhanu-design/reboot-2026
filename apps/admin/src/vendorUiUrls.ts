/** Customer web origin for published partner quote UIs (local dev default). */
export const CUSTOMER_WEB_ORIGIN =
  import.meta.env.VITE_CUSTOMER_WEB_ORIGIN ?? 'http://localhost:5174';

/** Admin app origin for vendor portal login (local dev default). */
export const VENDOR_PORTAL_ORIGIN =
  import.meta.env.VITE_VENDOR_PORTAL_ORIGIN ?? 'http://localhost:5175';

export const VENDOR_PORTAL_URL = `${VENDOR_PORTAL_ORIGIN}/vendor/portal`;
export const VENDOR_PORTAL_LOGIN_URL = `${VENDOR_PORTAL_ORIGIN}/vendor/login`;

export function localVendorUiUrl(code: string): string {
  return `${CUSTOMER_WEB_ORIGIN}/vendors/${code.trim().toLowerCase()}`;
}
