import {
  BarChart3,
  Boxes,
  Building2,
  ClipboardCheck,
  CreditCard,
  FileText,
  House,
  Layers3,
  MapPinned,
  MessageSquare,
  PlugZap,
  ShieldCheck,
  SquareStack,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type NavigationItem = {
  key: string;
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

export type NavigationGroup = {
  label: string;
  icon: LucideIcon;
  items: NavigationItem[];
  adminOnly?: boolean;
};

export const navigationGroups: NavigationGroup[] = [
  {
    label: "Insights",
    icon: BarChart3,
    items: [
      { key: "dashboard", href: "/dashboard", label: "Dashboard", icon: BarChart3 },
      { key: "dashboard", href: "/tenant-portal", label: "Tenant Portal", icon: Users },
      { key: "dashboard", href: "/owner-portal", label: "Owner Portal", icon: Building2 },
      { key: "reports", href: "/reports", label: "Reports", icon: FileText },
      { key: "notifications", href: "/notifications", label: "Notifications", icon: MessageSquare },
    ],
  },
  {
    label: "Administration",
    icon: ShieldCheck,
    adminOnly: true,
    items: [
      { key: "users", href: "/users", label: "Users", icon: Users, adminOnly: true },
      { key: "roles", href: "/roles", label: "Roles", icon: ShieldCheck, adminOnly: true },
      { key: "approvals", href: "/approvals", label: "Approvals", icon: ClipboardCheck, adminOnly: true },
      { key: "audit-logs", href: "/audit-logs", label: "Audit Logs", icon: ClipboardCheck, adminOnly: true },
      { key: "companies", href: "/companies", label: "Companies", icon: Building2, adminOnly: true },
      { key: "branches", href: "/branches", label: "Branches", icon: MapPinned, adminOnly: true },
    ],
  },
  {
    label: "Property Setup",
    icon: House,
    items: [
      { key: "properties", href: "/properties", label: "Properties", icon: House },
      { key: "buildings", href: "/buildings", label: "Buildings", icon: Layers3 },
      { key: "floors", href: "/floors", label: "Floors", icon: Layers3 },
      { key: "units", href: "/units", label: "Units", icon: SquareStack },
      { key: "assets", href: "/assets", label: "Assets", icon: Boxes },
      { key: "documents", href: "/documents", label: "Documents", icon: FileText },
    ],
  },
  {
    label: "Leasing",
    icon: FileText,
    items: [
      { key: "leases", href: "/leases", label: "Leases", icon: FileText },
      { key: "rent-billing", href: "/rent-billing", label: "Rent & Billing", icon: FileText },
      { key: "accounting", href: "/accounting", label: "Accounting", icon: CreditCard },
      { key: "tenants", href: "/tenants", label: "Tenants", icon: Users },
      { key: "owners", href: "/owners", label: "Owners", icon: Building2 },
    ],
  },
  {
    label: "Work Orders",
    icon: Wrench,
    items: [
      { key: "maintenance", href: "/maintenance", label: "Maintenance", icon: Wrench },
      { key: "inspections", href: "/inspections", label: "Inspections", icon: ClipboardCheck },
      { key: "utilities", href: "/utilities", label: "Utilities", icon: PlugZap },
    ],
  },
  {
    label: "Procurement",
    icon: CreditCard,
    items: [
      { key: "purchase-expenses", href: "/purchase-expenses", label: "Purchase & Expenses", icon: CreditCard },
      { key: "vendors", href: "/vendors", label: "Vendors", icon: Building2 },
    ],
  },
];

export const navigationItems = navigationGroups.flatMap((group) => group.items);
