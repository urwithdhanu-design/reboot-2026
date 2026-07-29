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
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  section?: string;
}

export const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, section: 'Operations' },
  { to: '/customers', label: 'Customers', icon: Users, section: 'Operations' },
  { to: '/kyc', label: 'KYC Review', icon: ShieldCheck, section: 'Operations' },
  { to: '/policies', label: 'Policies', icon: FileText, section: 'Operations' },
  { to: '/claims', label: 'Claims', icon: ClipboardList, section: 'Operations' },
  { to: '/parametric', label: 'Parametric', icon: Zap, section: 'Operations' },
  { to: '/workflows', label: 'Workflows', icon: GitBranch, section: 'Operations' },
  { to: '/flows', label: 'Platform Flows', icon: BookOpen, section: 'Operations' },
  { to: '/platform-observability', label: 'Platform observability', icon: Radar, section: 'Operations' },
  { to: '/audit', label: 'Audit trail', icon: ScrollText, section: 'Operations' },
  { to: '/services', label: 'Platform Services', icon: Server, section: 'Operations' },
  { to: '/tokenization', label: 'Tokenization', icon: Coins, section: 'Blockchain' },
  { to: '/capital-market', label: 'Insurance capital market', icon: Landmark, section: 'Blockchain' },
  { to: '/capital-market/blueprint', label: 'Canton blueprint', icon: BookOpen, section: 'Blockchain' },
  { to: '/capital-market/enterprise', label: 'Canton enterprise challenges', icon: TriangleAlert, section: 'Blockchain' },
  { to: '/compliance', label: 'Compliance Controls', icon: ClipboardCheck, section: 'Blockchain' },
  { to: '/observability', label: 'Chain Monitor', icon: Radio, section: 'Blockchain' },
  { to: '/blockchain', label: 'Blockchain Ledger', icon: Link2, section: 'Blockchain' },
  { to: '/contracts', label: 'Smart Contracts', icon: FileCode2, section: 'Blockchain' },
  { to: '/wallet', label: 'Wallet Ops', icon: Wallet, section: 'Blockchain' },
  { to: '/vendors', label: 'Vendors', icon: Building2, section: 'Configuration' },
  { to: '/products', label: 'Products', icon: Package, section: 'Configuration' },
  { to: '/reports', label: 'Reports', icon: BarChart3, section: 'Configuration' },
  { to: '/settings', label: 'Settings', icon: Settings, section: 'Configuration' },
];

export const navSections = ['Operations', 'Blockchain', 'Configuration'];
