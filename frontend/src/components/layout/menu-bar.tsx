"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { NavigationGroup, NavigationItem } from "@/lib/navigation";

type MenuBarProps = {
  groups: NavigationGroup[];
};

function isItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isGroupActive(pathname: string, items: NavigationItem[]) {
  return items.some((item) => isItemActive(pathname, item.href));
}

export function MenuBar({ groups }: MenuBarProps) {
  const pathname = usePathname();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!navRef.current?.contains(event.target as Node)) {
        setOpenGroup(null);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  return (
    <nav
      ref={navRef}
      className="relative z-30 border-b backdrop-blur-xl"
      style={{ borderColor: "var(--menu-border)", background: "var(--menu-surface)" }}
    >
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="-mx-1 overflow-visible px-1 py-3">
          <div className="flex flex-wrap items-center gap-2">
          {groups.map(({ label, icon: Icon, items }) => {
            const active = isGroupActive(pathname, items);
            const primaryItem = items[0];

            if (items.length === 1) {
              return (
                <Link
                  key={label}
                  href={primaryItem.href}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "text-[color:var(--on-brand)] shadow-[0_12px_24px_rgba(24,50,71,0.18)]"
                      : "ring-1 ring-[color:var(--line)] hover:text-brand"
                  }`}
                  style={
                    active
                      ? { background: "linear-gradient(135deg, var(--menu-active-start), var(--menu-active-end))" }
                      : {
                          background: "var(--menu-item-bg)",
                          color: "var(--menu-item-text)",
                          boxShadow: "0 6px 18px rgba(15,23,42,0.05)",
                        }
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{label}</span>
                </Link>
              );
            }

            return (
              <div key={label} className="relative shrink-0">
                <button
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "text-[color:var(--on-brand)] shadow-[0_12px_24px_rgba(24,50,71,0.18)]"
                      : "ring-1 ring-[color:var(--line)] hover:text-brand"
                  }`}
                  onClick={() => setOpenGroup((current) => (current === label ? null : label))}
                  style={
                    active
                      ? { background: "linear-gradient(135deg, var(--menu-active-start), var(--menu-active-end))" }
                      : {
                          background: "var(--menu-item-bg)",
                          color: "var(--menu-item-text)",
                          boxShadow: "0 6px 18px rgba(15,23,42,0.05)",
                        }
                  }
                  type="button"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{label}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 transition ${openGroup === label ? "rotate-180" : ""}`} />
                </button>

                <div
                  className={`absolute left-0 top-[calc(100%+0.55rem)] z-50 min-w-[16rem] rounded-[22px] border p-2 shadow-2xl transition ${
                    openGroup === label ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0"
                  }`}
                  style={{
                    borderColor: "var(--menu-border)",
                    background: "var(--surface-raised)",
                    boxShadow: "0 20px 45px rgba(15,23,42,0.18)",
                  }}
                >
                  <div className="mb-2 px-3 pt-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--foreground-subtle)]">
                    {label}
                  </div>
                  <div className="grid gap-1">
                    {items.map((item) => {
                      const itemActive = isItemActive(pathname, item.href);
                      const ItemIcon = item.icon;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition ${
                            itemActive ? "text-[color:var(--brand-strong)]" : "text-[color:var(--foreground)] hover:text-brand"
                          }`}
                          onClick={() => setOpenGroup(null)}
                          style={itemActive ? { background: "var(--brand-tint)" } : { background: "transparent" }}
                        >
                          <ItemIcon className="h-4 w-4 shrink-0" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </div>
    </nav>
  );
}
