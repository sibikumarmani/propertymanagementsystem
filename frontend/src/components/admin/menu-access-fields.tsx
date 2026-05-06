"use client";

import { navigationGroups } from "@/lib/navigation";

type RoleMenuAccessFieldsProps = {
  selectedKeys: string[];
  onToggle: (menuKey: string, checked: boolean) => void;
  disabled?: boolean;
};

type UserMenuOverrideFieldsProps = {
  values: Record<string, "INHERIT" | "ALLOW" | "DENY">;
  onChange: (menuKey: string, value: "INHERIT" | "ALLOW" | "DENY") => void;
};

export function RoleMenuAccessFields({ selectedKeys, onToggle, disabled = false }: RoleMenuAccessFieldsProps) {
  return (
    <div className="grid gap-4">
      {navigationGroups.map((group) => (
        <div key={group.label} className="rounded-[24px] border border-line bg-[color:var(--surface-glass)] p-5">
          <p className="mb-3 text-sm font-semibold text-brand-strong">{group.label}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {group.items.map((item) => (
              <label key={item.key} className="flex items-center gap-3 rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3">
                <input
                  checked={selectedKeys.includes(item.key)}
                  className="h-4 w-4"
                  disabled={disabled}
                  onChange={(event) => onToggle(item.key, event.target.checked)}
                  type="checkbox"
                />
                <span className="text-sm font-semibold text-brand-strong">{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function UserMenuOverrideFields({ values, onChange }: UserMenuOverrideFieldsProps) {
  return (
    <div className="grid gap-4">
      {navigationGroups.map((group) => (
        <div key={group.label} className="rounded-[24px] border border-line bg-[color:var(--surface-glass)] p-5">
          <p className="mb-3 text-sm font-semibold text-brand-strong">{group.label}</p>
          <div className="grid gap-3">
            {group.items.map((item) => (
              <label key={item.key} className="grid gap-2 rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-center">
                <span className="text-sm font-semibold text-brand-strong">{item.label}</span>
                <select
                  className="field w-full rounded-2xl px-4 py-3 ring-0"
                  onChange={(event) => onChange(item.key, event.target.value as "INHERIT" | "ALLOW" | "DENY")}
                  value={values[item.key] ?? "INHERIT"}
                >
                  <option value="INHERIT">Inherit role access</option>
                  <option value="ALLOW">Allow</option>
                  <option value="DENY">Deny</option>
                </select>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
