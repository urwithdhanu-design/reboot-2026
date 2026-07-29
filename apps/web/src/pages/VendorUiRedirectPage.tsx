import { Navigate, useParams } from "react-router-dom";
import { resolveVendorQuotePath } from "../vendorUiUrls";

export function VendorUiRedirectPage() {
  const { vendorCode = "" } = useParams();
  const quotePath = resolveVendorQuotePath(vendorCode);
  if (!quotePath) {
    return <Navigate to="/" replace />;
  }
  return <Navigate to={quotePath} replace />;
}
