const LAST_LOGIN_KEY = "gcul_last_login_at";

export function resolveLastLoginTimestamp(apiValue?: string | null): string | null {
  if (apiValue) return apiValue;
  return localStorage.getItem(LAST_LOGIN_KEY);
}

const clockFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const lastLoginFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

/** e.g. "Tue 28 Jul 2026 · 5:37 pm" */
export function formatClockNow(date: Date): string {
  const parts = clockFormatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  const weekday = get("weekday");
  const day = get("day");
  const month = get("month");
  const year = get("year");
  const hour = get("hour");
  const minute = get("minute");
  const dayPeriod = get("dayPeriod").toUpperCase();

  return `${weekday} ${day} ${month} ${year} · ${hour}:${minute} ${dayPeriod}`;
}

/** e.g. "Mon 27 Jul 2026 · 9:14 am" */
export function formatLastLogin(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const parts = lastLoginFormatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  const weekday = get("weekday");
  const day = get("day");
  const month = get("month");
  const year = get("year");
  const hour = get("hour");
  const minute = get("minute");
  const dayPeriod = get("dayPeriod").toLowerCase();

  return `${weekday} ${day} ${month} ${year} · ${hour}:${minute} ${dayPeriod}`;
}
