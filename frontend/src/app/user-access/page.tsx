"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { UserMenuOverrideFields } from "@/components/admin/menu-access-fields";
import { DataTable } from "@/components/common/data-table";
import { SectionCard } from "@/components/common/section-card";
import { SidebarDrawer } from "@/components/common/sidebar-drawer";
import { AppShell } from "@/components/layout/app-shell";
import { useIsClient } from "@/hooks/use-is-client";
import { userApi } from "@/lib/api";
import type { UserRecord } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

function readError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error) && typeof error.response?.data?.message === "string") {
    return error.response.data.message;
  }
  return fallback;
}

type OverrideValue = "INHERIT" | "ALLOW" | "DENY";

type UserAccessDraft = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  roleIds: string[];
  companyIds: string[];
  defaultCompanyId: string | null;
  status: string;
  emailVerified: boolean;
  avatarImage: string | null;
  menuAccessOverrides: Record<string, OverrideValue>;
};

function toOverrideMap(overrides: UserRecord["menuAccessOverrides"]): Record<string, OverrideValue> {
  return Object.fromEntries(overrides.map((override) => [override.menuKey, override.allowed ? "ALLOW" : "DENY"]));
}

export default function UserAccessPage() {
  const isClient = useIsClient();
  const { accessToken, hasHydrated } = useAppStore();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [editingUser, setEditingUser] = useState<UserAccessDraft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  async function loadUsers() {
    const response = await userApi.getUsers();
    setUsers(
      (response.data.data as Array<Omit<UserRecord, "id"> & { id: number | string }>).map((user) => ({
        ...user,
        id: String(user.id),
        roles: user.roles.map((role) => ({ ...role, id: String(role.id) })),
        companies: user.companies.map((company) => ({ ...company, id: String(company.id) })),
        defaultCompanyId: user.defaultCompanyId ? String(user.defaultCompanyId) : null,
        menuAccessOverrides: user.menuAccessOverrides ?? [],
        effectiveMenuAccessKeys: user.effectiveMenuAccessKeys ?? [],
      })),
    );
  }

  useEffect(() => {
    if (!isClient || !hasHydrated || !accessToken) {
      return;
    }
    let cancelled = false;
    async function run() {
      try {
        setIsLoading(true);
        const response = await userApi.getUsers();
        if (cancelled) {
          return;
        }
        setUsers(
          (response.data.data as Array<Omit<UserRecord, "id"> & { id: number | string }>).map((user) => ({
            ...user,
            id: String(user.id),
            roles: user.roles.map((role) => ({ ...role, id: String(role.id) })),
            companies: user.companies.map((company) => ({ ...company, id: String(company.id) })),
            defaultCompanyId: user.defaultCompanyId ? String(user.defaultCompanyId) : null,
            menuAccessOverrides: user.menuAccessOverrides ?? [],
            effectiveMenuAccessKeys: user.effectiveMenuAccessKeys ?? [],
          })),
        );
        setError(null);
      } catch (loadError: unknown) {
        if (!cancelled) {
          setError(readError(loadError, "User access could not be loaded."));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [accessToken, hasHydrated, isClient]);

  const userRows = useMemo(
    () =>
      users.map((user) => ({
        ...user,
        overrideCount: user.menuAccessOverrides.length,
      })),
    [users],
  );

  async function handleSave() {
    if (!editingUser) {
      return;
    }
    try {
      setIsSaving(true);
      setFormError(null);
      await userApi.updateUser(editingUser.id, {
        fullName: editingUser.fullName,
        email: editingUser.email,
        phone: editingUser.phone,
        status: editingUser.status,
        emailVerified: editingUser.emailVerified,
        avatarImage: editingUser.avatarImage,
        roleIds: editingUser.roleIds.map(Number),
        companyIds: editingUser.companyIds.map(Number),
        defaultCompanyId: Number(editingUser.defaultCompanyId),
        menuAccessOverrides: Object.entries(editingUser.menuAccessOverrides)
          .filter(([, value]) => value !== "INHERIT")
          .map(([menuKey, value]) => ({
            menuKey,
            allowed: value === "ALLOW",
          })),
      });
      setIsDrawerOpen(false);
      setEditingUser(null);
      await loadUsers();
    } catch (saveError: unknown) {
      setFormError(readError(saveError, "User access could not be updated."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell title="User level access" subtitle="Manage user-specific menu overrides that extend or restrict the effective access inherited from assigned roles.">
      <SectionCard title="User access matrix" eyebrow="Administration">
        {error ? <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
        {isLoading ? (
          <div className="rounded-[22px] border border-line bg-[color:var(--surface-soft)] px-4 py-8 text-sm text-[color:var(--foreground-muted)]">Loading user access...</div>
        ) : (
          <DataTable
            rows={userRows.map((user) => ({ ...user, id: user.id }))}
            columns={[
              { key: "fullName", header: "User" },
              { key: "email", header: "Email" },
              { key: "roles", header: "Roles", render: (row) => row.roles.map((role) => role.roleName).join(", ") },
              { key: "overrideCount", header: "Overrides", render: (row) => String(row.overrideCount) },
              {
                key: "effectiveMenuAccessKeys",
                header: "Effective Access",
                render: (row) => (row.effectiveMenuAccessKeys.length ? row.effectiveMenuAccessKeys.join(", ") : "No menu access"),
              },
              {
                key: "actions",
                header: "Actions",
                render: (row) => (
                  <button
                    className="rounded-full border border-line bg-[color:var(--surface-raised)] px-3 py-2 text-xs font-semibold text-brand-strong"
                    onClick={() => {
                      setEditingUser({
                        id: row.id,
                        fullName: row.fullName,
                        email: row.email,
                        phone: row.phone,
                        roleIds: row.roles.map((role) => role.id),
                        companyIds: row.companies.map((company) => company.id),
                        defaultCompanyId: row.defaultCompanyId,
                        status: row.status,
                        emailVerified: row.emailVerified,
                        avatarImage: row.avatarImage,
                        menuAccessOverrides: toOverrideMap(row.menuAccessOverrides),
                      });
                      setFormError(null);
                      setIsDrawerOpen(true);
                    }}
                    type="button"
                  >
                    Manage Access
                  </button>
                ),
              },
            ]}
          />
        )}
      </SectionCard>

      <SidebarDrawer eyebrow="User Access" onClose={() => setIsDrawerOpen(false)} open={isDrawerOpen} title={editingUser?.fullName ?? "User access"} widthClassName="sm:max-w-3xl">
        {editingUser ? (
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSave();
            }}
          >
            <div className="rounded-[24px] border border-line bg-[color:var(--surface-glass)] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--foreground-subtle)]">User</p>
              <p className="mt-2 text-lg font-semibold text-brand-strong">{editingUser.fullName}</p>
              <p className="mt-1 text-sm text-[color:var(--foreground-muted)]">{editingUser.email}</p>
              <p className="mt-2 text-xs text-[color:var(--foreground-muted)]">Role permissions are applied first. Use overrides only where this person needs an exception.</p>
            </div>
            <div>
              <span className="mb-3 block text-sm font-semibold text-brand-strong">Menu Overrides</span>
              <UserMenuOverrideFields
                onChange={(menuKey, value) =>
                  setEditingUser((current) =>
                    current
                      ? {
                          ...current,
                          menuAccessOverrides: {
                            ...current.menuAccessOverrides,
                            [menuKey]: value,
                          },
                        }
                      : current,
                  )
                }
                values={editingUser.menuAccessOverrides}
              />
            </div>
            {formError ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{formError}</p> : null}
            <div className="flex items-center justify-end gap-3 border-t border-line pt-4">
              <button className="btn-secondary rounded-full px-5 py-3 text-sm font-semibold" onClick={() => setIsDrawerOpen(false)} type="button">
                Cancel
              </button>
              <button className="btn-primary rounded-full px-5 py-3 text-sm font-semibold" disabled={isSaving} type="submit">
                {isSaving ? "Saving..." : "Update Access"}
              </button>
            </div>
          </form>
        ) : null}
      </SidebarDrawer>
    </AppShell>
  );
}
