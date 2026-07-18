import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 20, ...props }: IconProps) {
  return { width: size, height: size, fill: "none", stroke: "currentColor", strokeWidth: 1.8, ...props };
}

export function IconUser(p: IconProps) {
  return (
    <svg {...base(p)} viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 19c1.8-3.2 4-4.8 7-4.8S17.2 15.8 19 19" />
    </svg>
  );
}

export function IconMail(p: IconProps) {
  return (
    <svg {...base(p)} viewBox="0 0 24 24">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4.5 7.5 7.5 6 7.5-6" />
    </svg>
  );
}

export function IconPhone(p: IconProps) {
  return (
    <svg {...base(p)} viewBox="0 0 24 24">
      <path d="M8 3.5h3.2l1 4.2-2 1.4a12 12 0 0 0 5.7 5.7l1.4-2 4.2 1V18a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 4 5.7 2 2 0 0 1 6 3.5Z" />
    </svg>
  );
}

export function IconChat(p: IconProps) {
  return (
    <svg {...base(p)} viewBox="0 0 24 24">
      <path d="M5 6.5h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H10l-4.5 3v-3H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z" />
      <circle cx="9" cy="12" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconChevron(p: IconProps) {
  return (
    <svg {...base(p)} viewBox="0 0 24 24">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function IconShield(p: IconProps) {
  return (
    <svg {...base({ ...p, strokeWidth: 1.6 })} viewBox="0 0 24 24">
      <path d="M12 3.5 19 6.5v5.2c0 4.2-2.8 7.6-7 8.8-4.2-1.2-7-4.6-7-8.8V6.5l7-3Z" fill="#006a4d" stroke="#004d38" />
      <path d="m9 12 2.1 2.1L15.5 9.7" stroke="#fff" strokeWidth="2" />
    </svg>
  );
}

export function IconSearch(p: IconProps) {
  return (
    <svg {...base(p)} viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16.5 16.5 4 4" />
    </svg>
  );
}

export function IconPlane(p: IconProps) {
  return (
    <svg {...base(p)} viewBox="0 0 24 24">
      <path d="M3 13.5 21 9l-2.2 6.2L12 14l-3.2 4.5L7 14.2 3 13.5Z" />
    </svg>
  );
}

export function IconLock(p: IconProps) {
  return (
    <svg {...base(p)} viewBox="0 0 24 24">
      <rect x="6" y="10" width="12" height="10" rx="2" />
      <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" />
    </svg>
  );
}

export function IconHome(p: IconProps) {
  return (
    <svg {...base(p)} viewBox="0 0 24 24">
      <path d="m4 11 8-7 8 7" />
      <path d="M6.5 10.5V19h11v-8.5" />
    </svg>
  );
}

export function IconDoc(p: IconProps) {
  return (
    <svg {...base(p)} viewBox="0 0 24 24">
      <path d="M7 3.5h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 20V5A1.5 1.5 0 0 1 7 3.5Z" />
      <path d="M14 3.5V8h4.5" />
    </svg>
  );
}

export function IconClaims(p: IconProps) {
  return (
    <svg {...base(p)} viewBox="0 0 24 24">
      <rect x="5" y="4" width="14" height="16" rx="2" />
      <path d="m8.5 12 2.2 2.2L15.5 9.5" />
    </svg>
  );
}

export function IconWallet(p: IconProps) {
  return (
    <svg {...base(p)} viewBox="0 0 24 24">
      <rect x="3.5" y="6.5" width="17" height="12" rx="2.5" />
      <path d="M3.5 10h17" />
      <circle cx="16.5" cy="14.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconRefresh(p: IconProps) {
  return (
    <svg {...base(p)} viewBox="0 0 24 24">
      <path d="M20 12a8 8 0 1 1-2.2-5.5" />
      <path d="M20 5v5h-5" />
    </svg>
  );
}

export function IconBank(p: IconProps) {
  return (
    <svg {...base(p)} viewBox="0 0 24 24">
      <path d="m4 9 8-4.5L20 9" />
      <path d="M6 10.5v6M10 10.5v6M14 10.5v6M18 10.5v6M4 17.5h16M4 20h16" />
    </svg>
  );
}

export function IconId(p: IconProps) {
  return (
    <svg {...base(p)} viewBox="0 0 24 24">
      <rect x="3.5" y="6" width="17" height="12" rx="2" />
      <circle cx="9" cy="12" r="2" />
      <path d="M13.5 10.5h4M13.5 13.5h3" />
    </svg>
  );
}

export function IconStar(p: IconProps) {
  return (
    <svg width={p.size ?? 14} height={p.size ?? 14} viewBox="0 0 24 24" fill="#f5a524" stroke="none">
      <path d="m12 2.5 2.8 6.2 6.7.6-5.1 4.4 1.5 6.5L12 16.8 6.1 20.2l1.5-6.5-5.1-4.4 6.7-.6L12 2.5Z" />
    </svg>
  );
}

export function IconPaw(p: IconProps) {
  return (
    <svg {...base(p)} viewBox="0 0 24 24">
      <ellipse cx="12" cy="16.5" rx="4.2" ry="3.2" />
      <circle cx="7.2" cy="9.2" r="2" />
      <circle cx="16.8" cy="9.2" r="2" />
      <circle cx="5.8" cy="13.5" r="1.7" />
      <circle cx="18.2" cy="13.5" r="1.7" />
      <path d="M10.2 6.2c.4-1.4 1.2-2.2 1.8-2.2s1.4.8 1.8 2.2" />
    </svg>
  );
}

export function IconHeart(p: IconProps) {
  return (
    <svg {...base(p)} viewBox="0 0 24 24">
      <path d="M12 20s-7-4.4-7-9.2A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.8C19 15.6 12 20 12 20Z" />
    </svg>
  );
}

export function IconCar(p: IconProps) {
  return (
    <svg {...base(p)} viewBox="0 0 24 24">
      <path d="M4.5 14.5h15l-.8-3.2a2 2 0 0 0-1.9-1.5H7.2a2 2 0 0 0-1.9 1.5L4.5 14.5Z" />
      <path d="M6 11.5 7.4 7.8A1.5 1.5 0 0 1 8.8 7h6.4a1.5 1.5 0 0 1 1.4.8l1.4 3.7" />
      <circle cx="7.5" cy="16.5" r="1.4" />
      <circle cx="16.5" cy="16.5" r="1.4" />
      <path d="M8.9 16.5h6.2" />
    </svg>
  );
}

export function IconVan(p: IconProps) {
  return (
    <svg {...base(p)} viewBox="0 0 24 24">
      <path d="M3.5 15.5h17V9.2A2.2 2.2 0 0 0 18.3 7H10L7.2 9.8H3.5v5.7Z" />
      <path d="M10 7v2.8" />
      <circle cx="7.2" cy="17.2" r="1.5" />
      <circle cx="16.8" cy="17.2" r="1.5" />
      <path d="M8.7 17.2h6.6" />
    </svg>
  );
}

export function IconUmbrella(p: IconProps) {
  return (
    <svg {...base(p)} viewBox="0 0 24 24">
      <path d="M12 4a8 8 0 0 0-8 8h16a8 8 0 0 0-8-8Z" />
      <path d="M12 12v6.2a1.8 1.8 0 0 0 3.6 0" />
      <path d="M4 12h16" />
    </svg>
  );
}

export function IconCross(p: IconProps) {
  return (
    <svg {...base(p)} viewBox="0 0 24 24">
      <path d="M9.5 4.5h5v5h5v5h-5v5h-5v-5h-5v-5h5v-5Z" />
    </svg>
  );
}

export function IconCoins(p: IconProps) {
  return (
    <svg {...base(p)} viewBox="0 0 24 24">
      <ellipse cx="10" cy="8" rx="6" ry="3.2" />
      <path d="M4 8v3.2c0 1.8 2.7 3.2 6 3.2s6-1.4 6-3.2V8" />
      <path d="M4 11.2v3.2c0 1.8 2.7 3.2 6 3.2" />
      <ellipse cx="15.5" cy="13.5" rx="4.5" ry="2.5" />
      <path d="M11 13.5v2.2c0 1.4 2 2.5 4.5 2.5s4.5-1.1 4.5-2.5v-2.2" />
    </svg>
  );
}

export function productIcon(name: string) {
  switch (name) {
    case "plane":
      return <IconPlane size={28} />;
    case "shield":
      return <IconShield size={28} />;
    case "lock":
      return <IconLock size={28} />;
    case "home":
      return <IconHome size={28} />;
    case "paw":
      return <IconPaw size={28} />;
    case "heart":
      return <IconHeart size={28} />;
    case "car":
      return <IconCar size={28} />;
    case "van":
      return <IconVan size={28} />;
    case "umbrella":
      return <IconUmbrella size={28} />;
    case "cross":
      return <IconCross size={28} />;
    case "coins":
      return <IconCoins size={28} />;
    default:
      return <IconDoc size={28} />;
  }
}
