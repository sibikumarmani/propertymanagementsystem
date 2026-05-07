"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  Boxes,
  Building2,
  ChevronDown,
  ClipboardCheck,
  CreditCard,
  FileText,
  House,
  Layers3,
  MapPinned,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  PlugZap,
  ShieldCheck,
  SquareStack,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { NavigationGroup, NavigationItem } from "@/lib/navigation";

type SidebarProps = {
  groups: NavigationGroup[];
  collapsed: boolean;
  onToggleCollapse: () => void;
};

function isItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isGroupActive(pathname: string, items: NavigationItem[]) {
  return items.some((item) => isItemActive(pathname, item.href));
}

export function Sidebar({ groups, collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const navRef = useRef<HTMLElement | null>(null);

  // Auto-expand the active group on pathname change
  useEffect(() => {
    const activeGroup = groups.find((g) => isGroupActive(pathname, g.items));
    if (activeGroup) {
      setExpandedGroups((prev) => ({ ...prev, [activeGroup.label]: true }));
    }
  }, [pathname, groups]);

  const toggleGroup = (label: string) => {
    if (collapsed) return;
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <aside
      ref={navRef}
      className="fixed left-0 top-0 z-40 flex h-screen flex-col border-r transition-all duration-300"
      style={{
        width: collapsed ? 64 : 260,
        background: "var(--menu-surface)",
        borderColor: "var(--menu-border)",
      }}
    >
      {/* Header with toggle */}
      <div className="flex items-center border-b px-3 py-4" style={{ borderColor: "var(--menu-border)" }}>
        {!collapsed && (
          <span className="flex-1 truncate text-sm font-bold tracking-tight text-[color:var(--brand-strong)]">
            PMS
          </span>
        )}
        <button
          onClick={onToggleCollapse}
          className="ml-auto rounded-lg p-1.5 transition hover:bg-[color:var(--surface-muted)]"
          style={{ color: "var(--foreground-muted)" }}
          type="button"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation groups */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3">
        <div className="flex flex-col gap-1">
          {groups.map(({ label, icon: GroupIcon, items }) => {
            const active = isGroupActive(pathname, items);
            const isExpanded = expandedGroups[label] ?? false;

            return (
              <div key={label}>
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(label)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition"
                  style={{
                    background: active && !collapsed ? "var(--brand-tint)" : "transparent",
                    color: active ? "var(--brand-strong)" : "var(--menu-item-text)",
                  }}
                  type="button"
                  title={collapsed ? label : undefined}
                >
                  <GroupIcon className="h-5 w-5 shrink-0" style={{ color: active ? "var(--brand)" : "var(--foreground-muted)" }} />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{label}</span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 transition-transform ${isExpanded ? "rotate-0" : "-rotate-90"}`}
                        style={{ color: "var(--foreground-subtle)" }}
                      />
                    </>
                  )}
                </button>

                {/* Expanded group items */}
                {!collapsed && isExpanded && (
                  <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l pl-2" style={{ borderColor: "var(--line)" }}>
                    {items.map((item) => {
                      const itemActive = isItemActive(pathname, item.href);
                      const ItemIcon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition"
                          style={{
                            background: itemActive ? "var(--brand-tint)" : "transparent",
                            color: itemActive ? "var(--brand-strong)" : "var(--foreground)",
                          }}
                        >
                          <ItemIcon className="h-4 w-4 shrink-0" style={{ color: itemActive ? "var(--brand)" : "var(--foreground-subtle)" }} />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* Collapsed: show items as icon-only links */}
                {collapsed && (
                  <div className="mt-1 flex flex-col gap-0.5">
                    {items.map((item) => {
                      const itemActive = isItemActive(pathname, item.href);
                      const ItemIcon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center justify-center rounded-lg p-2 transition"
                          style={{
                            background: itemActive ? "var(--brand-tint)" : "transparent",
                            color: itemActive ? "var(--brand)" : "var(--foreground-subtle)",
                          }}
                          title={item.label}
                        >
                          <ItemIcon className="h-5 w-5" />
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
