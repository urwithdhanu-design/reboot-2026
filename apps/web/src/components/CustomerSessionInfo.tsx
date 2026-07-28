import { useEffect, useState } from "react";
import { useSession } from "../session";
import {
  formatClockNow,
  formatLastLogin,
  resolveLastLoginTimestamp,
} from "../sessionMeta";

type SessionInfoVariant = "topbar" | "rail" | "mobile";

export function CustomerSessionInfo({ variant }: { variant: SessionInfoVariant }) {
  const { token, user } = useSession();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!token) return;
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, [token]);

  if (!token) return null;

  const lastLogin = resolveLastLoginTimestamp(user?.last_login_at);
  const clock = formatClockNow(now);

  if (variant === "mobile") {
    return (
      <div className="customer-session-info customer-session-info--mobile" aria-live="polite">
        <time dateTime={now.toISOString()}>{clock}</time>
        {lastLogin ? (
          <>
            <span className="customer-session-info-sep" aria-hidden>
              ·
            </span>
            <span className="customer-session-info-last">
              Last login {formatLastLogin(lastLogin)}
            </span>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`customer-session-info customer-session-info--${variant}`} aria-live="polite">
      <time dateTime={now.toISOString()}>{clock}</time>
      {lastLogin ? (
        <span className="customer-session-info-last">
          Last login · {formatLastLogin(lastLogin)}
        </span>
      ) : null}
    </div>
  );
}
