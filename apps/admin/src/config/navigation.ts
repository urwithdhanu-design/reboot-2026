import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  FileText,
  ClipboardList,
  GitBranch,
  Wallet,
  Package,
  BarChart3,
  Settings,
  Coins,
  Link2,
  Radio,
  FileCode2,
  Building2,
  Server,
  Zap,
  ClipboardCheck,
  BookOpen,
  ScrollText,
  Radar,
  Landmark,
  TriangleAlert,
  Boxes,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

export interface NavLinkItem {
  to: string;
  label: string;
}

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  section?: string;
}

export interface NavGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  section: string;
  /** Short line for executives — shown under the group label in the sidebar */
  description?: string;
  children: NavLinkItem[];
}

export type NavEntry =
  | { kind: 'link'; item: NavItem }
  | { kind: 'group'; group: NavGroup };

/** Executive-facing hub for insurance capital markets, Canton, and programmable ILS strategy. */
export const STRATEGIC_CAPITAL_MARKETS_GROUP: NavGroup = {
  id: 'strategic-capital-markets',
  label: 'Strategic capital markets',
  icon: Landmark,
  section: 'Blockchain',
  description: 'ILS vision, Canton strategy & live platform',
  children: [
    { to: '/capital-market', label: 'Market vision & ILS roadmap' },
    { to: '/capital-market/blueprint', label: 'Capital markets blueprint' },
    { to: '/capital-market/enterprise', label: 'Enterprise DLT priorities' },
    { to: '/capital-market/kit', label: 'Canton coordination kit' },
    { to: '/capital-market/canton-live', label: 'Live implementation guide' },
  ],
};

export const navEntries: NavEntry[] = [
  { kind: 'link', item: { to: '/', label: 'Dashboard', icon: LayoutDashboard, section: 'Operations' } },
  { kind: 'link', item: { to: '/customers', label: 'Customers', icon: Users, section: 'Operations' } },
  { kind: 'link', item: { to: '/kyc', label: 'KYC Review', icon: ShieldCheck, section: 'Operations' } },
  { kind: 'link', item: { to: '/policies', label: 'Policies', icon: FileText, section: 'Operations' } },
  { kind: 'link', item: { to: '/claims', label: 'Claims', icon: ClipboardList, section: 'Operations' } },
  { kind: 'link', item: { to: '/parametric', label: 'Parametric', icon: Zap, section: 'Operations' } },
  { kind: 'link', item: { to: '/workflows', label: 'Workflows', icon: GitBranch, section: 'Operations' } },
  { kind: 'link', item: { to: '/flows', label: 'Platform Flows', icon: BookOpen, section: 'Operations' } },
  { kind: 'link', item: { to: '/platform-observability', label: 'Platform observability', icon: Radar, section: 'Operations' } },
  { kind: 'link', item: { to: '/audit', label: 'Audit trail', icon: ScrollText, section: 'Operations' } },
  { kind: 'link', item: { to: '/services', label: 'Platform Services', icon: Server, section: 'Operations' } },
  { kind: 'link', item: { to: '/tokenization', label: 'Tokenization', icon: Coins, section: 'Blockchain' } },
  { kind: 'group', group: STRATEGIC_CAPITAL_MARKETS_GROUP },
  { kind: 'link', item: { to: '/compliance', label: 'Compliance Controls', icon: ClipboardCheck, section: 'Blockchain' } },
  { kind: 'link', item: { to: '/observability', label: 'Chain Monitor', icon: Radio, section: 'Blockchain' } },
  { kind: 'link', item: { to: '/blockchain', label: 'Blockchain Ledger', icon: Link2, section: 'Blockchain' } },
  { kind: 'link', item: { to: '/contracts', label: 'Smart Contracts', icon: FileCode2, section: 'Blockchain' } },
  { kind: 'link', item: { to: '/wallet', label: 'Wallet Ops', icon: Wallet, section: 'Blockchain' } },
  { kind: 'link', item: { to: '/vendors', label: 'Vendors', icon: Building2, section: 'Configuration' } },
  { kind: 'link', item: { to: '/products', label: 'Products', icon: Package, section: 'Configuration' } },
  { kind: 'link', item: { to: '/reports', label: 'Reports', icon: BarChart3, section: 'Configuration' } },
  { kind: 'link', item: { to: '/settings', label: 'Settings', icon: Settings, section: 'Configuration' } },
];

/** Flat list for legacy consumers (search, breadcrumbs, etc.) */
export const navItems: NavItem[] = navEntries.flatMap((entry) => {
  if (entry.kind === 'link') return [entry.item];
  return entry.group.children.map((child) => ({
    to: child.to,
    label: child.label,
    icon: entry.group.icon,
    section: entry.group.section,
  }));
});

export const navSections = ['Operations', 'Blockchain', 'Configuration'];

export function isCapitalMarketRoute(pathname: string): boolean {
  return pathname === '/capital-market' || pathname.startsWith('/capital-market/');
}

export function getNavGroupForPath(pathname: string): NavGroup | undefined {
  for (const entry of navEntries) {
    if (entry.kind !== 'group') continue;
    const match = entry.group.children.some(
      (c) => pathname === c.to || (c.to !== '/' && pathname.startsWith(`${c.to}/`)),
    );
    if (match) return entry.group;
  }
  return undefined;
}

/** Icons for capital-market sub-pages (optional UI use) */
export const capitalMarketChildIcons: Record<string, LucideIcon> = {
  '/capital-market': Landmark,
  '/capital-market/blueprint': BookOpen,
  '/capital-market/enterprise': TriangleAlert,
  '/capital-market/kit': Boxes,
  '/capital-market/canton-live': Sparkles,
};
