import { useNavigate } from "react-router-dom";
import { useSession } from "../session";

/** Send guests to login with return path; logged-in users go straight to quote. */
export function useQuoteNavigation() {
  const navigate = useNavigate();
  const { token } = useSession();

  return (productId: string) => {
    const quotePath = `/quote/${productId}`;
    if (token) {
      navigate(quotePath);
      return;
    }
    navigate(`/login?next=${encodeURIComponent(quotePath)}`);
  };
}
