/** Customer web origin for published partner UIs (local dev default). */
export const CUSTOMER_WEB_ORIGIN =
  import.meta.env.VITE_CUSTOMER_WEB_ORIGIN ?? 'http://localhost:5174';

export function localVendorUiUrl(code: string): string {
  return `${CUSTOMER_WEB_ORIGIN}/vendors/${code.trim().toLowerCase()}`;
}
