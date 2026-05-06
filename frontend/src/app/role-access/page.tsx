"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { RoleMenuAccessFields } from "@/components/admin/menu-access-fields";
import { DataTable } from "@/components/common/data-table";
import { SectionCard } from "@/components/common/section-card";
import { SidebarDrawer } from "@/components/common/sidebar-drawer";
import { AppShell } from "@/components/layout/app-shell";
import { useIsClient } from "@/hooks/use-is-client";
import { roleApi } from "@/lib/api";
import type { RoleRecord } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

function readError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error) && typeof error.response?.data?.message === "string") {
    return error.response.data.message;
  }
  return fallback;
}

function isProtectedAdminRole(roleName: string) {
  return roleName.trim().toUpperCase() === "ADMIN";
}

type RoleAccessDraft = {
  id: string;
  roleName: string;
  description: string | null;
  defaultRole: boolean;
  status: string;
  menuAccessKeys: string[];
};

export default function RoleAccessPage() {
  const isClient = useIsClient();
  const { accessToken, hasHydrated } = useAppStore();
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [editingRole, setEditingRole] = useState<RoleAccessDraft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  async function loadRoles() {
    const response = await roleApi.getRoles();
    setRoles((response.data.data as Array<Omit<RoleRecord, "id"> & { id: number | string }>).map((role) => ({ ...role, id: String(role.id), menuAccessKeys: role.menuAccessKeys ?? [] })));
  }

  useEffect(() => {
    if (!isClient || !hasHydrated || !accessToken) {
      return;
    }
    let cancelled = false;
    async function run() {
      try {
        setIsLoading(true);
        const response = await roleApi.getRoles();
        if (cancelled) {
          return;
        }
        setRoles((response.data.data as Array<Omit<RoleRecord, "id"> & { id: number | string }>).map((role) => ({ ...role, id: String(role.id), menuAccessKeys: role.menuAccessKeys ?? [] })));
        setError(null);
      } catch (loadError: unknown) {
        if (!cancelled) {
          setError(readError(loadError, "Role access could not be loaded."));
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

  const accessSummary = useMemo(
    () =>
      roles.map((role) => ({
        ...role,
        grantedCount: role.menuAccessKeys.length,
      })),
    [roles],
  );

  async function handleSave() {
    if (!editingRole) {
      return;
    }
    try {
      setIsSaving(true);
      setFormError(null);
      await roleApi.updateRole(editingRole.id, {
        roleName: editingRole.roleName,
        description: editingRole.description,
        defaultRole: editingRole.defaultRole,
        status: editingRole.status,
        menuAccessKeys: editingRole.menuAccessKeys,
      });
      setIsDrawerOpen(false);
      setEditingRole(null);
      await loadRoles();
    } catch (saveError: unknown) {
      setFormError(readError(saveError, "Role access could not be updated."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell title="Role level access" subtitle="Control base menu permissions granted by each role before any user-specific override is applied.">
      <SectionCard title="Role access matrix" eyebrow="Administration">
        {error ? <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
        {isLoading ? (
          <div className="rounded-[22px] border border-line bg-[color:var(--surface-soft)] px-4 py-8 text-sm text-[color:var(--foreground-muted)]">Loading role access...</div>
        ) : (
          <DataTable
            rows={accessSummary.map((role) => ({ ...role, id: role.id }))}
            columns={[
              { key: "roleName", header: "Role" },
              { key: "description", header: "Description", render: (row) => row.description || "No description" },
              { key: "grantedCount", header: "Menus", render: (row) => String(row.grantedCount) },
              { key: "status", header: "Status" },
              {
                key: "access",
                header: "Granted Access",
                render: (row) => (row.menuAccessKeys.length ? row.menuAccessKeys.join(", ") : "No menu access"),
              },
              {
                key: "actions",
                header: "Actions",
                render: (row) => (
                  <button
                    className="rounded-full border border-line bg-[color:var(--surface-raised)] px-3 py-2 text-xs font-semibold text-brand-strong"
                    onClick={() => {
                      setEditingRole({
                        id: row.id,
                        roleName: row.roleName,
                        description: row.description,
                        defaultRole: row.defaultRole,
                        status: row.status,
                        menuAccessKeys: [...row.menuAccessKeys],
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

      <SidebarDrawer eyebrow="Role Access" onClose={() => setIsDrawerOpen(false)} open={isDrawerOpen} title={editingRole?.roleName ?? "Role access"} widthClassName="sm:max-w-3xl">
        {editingRole ? (
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSave();
            }}
          >
            <div className="rounded-[24px] border border-line bg-[color:var(--surface-glass)] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--foreground-subtle)]">Role</p>
              <p className="mt-2 text-lg font-semibold text-brand-strong">{editingRole.roleName}</p>
              <p className="mt-1 text-sm text-[color:var(--foreground-muted)]">{editingRole.description || "No description provided"}</p>
            </div>
            <div>
              <span className="mb-3 block text-sm font-semibold text-brand-strong">Menu Access</span>
              <RoleMenuAccessFields
                disabled={isProtectedAdminRole(editingRole.roleName)}
                onToggle={(menuKey, checked) =>
                  setEditingRole((current) =>
                    current
                      ? {
                          ...current,
                          menuAccessKeys: checked
                            ? Array.from(new Set([...current.menuAccessKeys, menuKey]))
                            : current.menuAccessKeys.filter((item) => item !== menuKey),
                        }
                      : current,
                  )
                }
                selectedKeys={editingRole.menuAccessKeys}
              />
            </div>
            {isProtectedAdminRole(editingRole.roleName) ? <p className="text-xs text-[color:var(--foreground-muted)]">ADMIN remains fully protected and keeps its existing access policy.</p> : null}
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
