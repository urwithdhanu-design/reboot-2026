import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { AuthUser } from "../api";
import { useSession } from "../session";

function decodeUserPayload(raw: string): AuthUser | null {
  try {
    const json = decodeURIComponent(
      Array.prototype.map
        .call(atob(raw), (c: string) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(""),
    );
    return JSON.parse(json) as AuthUser;
  } catch {
    return null;
  }
}

export function SimulateBootstrapPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setSession } = useSession();

  useEffect(() => {
    const token = searchParams.get("token")?.trim();
    const userRaw = searchParams.get("user")?.trim();
    const next = searchParams.get("next")?.trim() || "/policies";

    if (token && userRaw) {
      const user = decodeUserPayload(userRaw);
      if (user) {
        setSession(token, user);
      }
    }

    const safeNext = next.startsWith("/") ? next : "/policies";
    navigate(safeNext, { replace: true });
  }, [navigate, searchParams, setSession]);

  return (
    <div className="landing-page" style={{ padding: "2rem", textAlign: "center" }}>
      <p className="text-sm text-lbg-gray-600">Opening simulation view…</p>
    </div>
  );
}
