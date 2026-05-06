"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import { RoleMenuAccessFields } from "@/components/admin/menu-access-fields";
import { DataTable } from "@/components/common/data-table";
import { SectionCard } from "@/components/common/section-card";
import { SidebarDrawer } from "@/components/common/sidebar-drawer";
import { AppShell } from "@/components/layout/app-shell";
import { roleApi } from "@/lib/api";
import type { RoleRecord } from "@/lib/types";
import { useAppStore } from "@/store/app-store";
import { useIsClient } from "@/hooks/use-is-client";

function readError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error) && typeof error.response?.data?.message === "string") {
    return error.response.data.message;
  }
  return fallback;
}

type RoleFormState = {
  roleName: string;
  description: string;
  defaultRole: boolean;
  status: string;
  menuAccessKeys: string[];
};

const defaultForm: RoleFormState = {
  roleName: "",
  description: "",
  defaultRole: false,
  status: "ACTIVE",
  menuAccessKeys: [],
};

function isProtectedAdminRole(roleName: string) {
  return roleName.trim().toUpperCase() === "ADMIN";
}

export default function RolesPage() {
  const isClient = useIsClient();
  const { accessToken, hasHydrated } = useAppStore();
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [editingRole, setEditingRole] = useState<RoleRecord | null>(null);
  const [draft, setDraft] = useState<RoleFormState>(defaultForm);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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
      } catch (error: unknown) {
        if (!cancelled) {
          setError(readError(error, "Roles could not be loaded."));
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

  async function handleSave() {
    try {
      setIsSaving(true);
      setFormError(null);
      if (isProtectedAdminRole(draft.roleName) && draft.defaultRole) {
        setFormError("ADMIN cannot be used as the default self-registration role.");
        return;
      }
      if (editingRole) {
        await roleApi.updateRole(editingRole.id, draft);
      } else {
        await roleApi.createRole(draft);
      }
      setIsDrawerOpen(false);
      setDraft(defaultForm);
      setEditingRole(null);
      await loadRoles();
    } catch (error: unknown) {
      setFormError(readError(error, "Role could not be saved."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell title="Role management" subtitle="Maintain ERP role definitions and activation state for multi-role user assignments.">
      <SectionCard
        title="Role directory"
        eyebrow="Administration"
        action={
          <div className="flex flex-wrap items-center gap-3">
            <Link className="btn-secondary rounded-full px-5 py-3 text-sm font-semibold" href="/role-access">
              Role Access Page
            </Link>
            <button className="rounded-full bg-brand-strong px-5 py-3 text-sm font-semibold text-white" onClick={() => {
              setEditingRole(null);
              setDraft(defaultForm);
              setFormError(null);
              setIsDrawerOpen(true);
            }} type="button">
              Add Role
            </button>
          </div>
        }
      >
        {error ? <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
        {isLoading ? (
          <div className="rounded-[22px] border border-line bg-[color:var(--surface-soft)] px-4 py-8 text-sm text-[color:var(--foreground-muted)]">Loading roles...</div>
        ) : (
          <DataTable
            rows={roles}
            columns={[
              { key: "roleName", header: "Role Name" },
              { key: "description", header: "Description", render: (row) => row.description || "No description" },
              { key: "defaultRole", header: "Default", render: (row) => (row.defaultRole ? "Yes" : "No") },
              { key: "status", header: "Status" },
              {
                key: "actions",
                header: "Actions",
                render: (row) => (
                  <div className="flex gap-2">
                    <button className="rounded-full border border-line bg-[color:var(--surface-raised)] px-3 py-2 text-xs font-semibold text-brand-strong" onClick={() => {
                      setEditingRole(row);
                      setDraft({
                        roleName: row.roleName,
                        description: row.description || "",
                        defaultRole: row.defaultRole,
                        status: row.status,
                        menuAccessKeys: row.menuAccessKeys,
                      });
                      setFormError(null);
                      setIsDrawerOpen(true);
                    }} type="button">
                      Edit
                    </button>
                    <button className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400" disabled={isProtectedAdminRole(row.roleName)} onClick={async () => {
                      try {
                        await roleApi.deleteRole(row.id);
                        await loadRoles();
                      } catch (error: unknown) {
                        setError(readError(error, "Role could not be deleted."));
                      }
                    }} type="button">
                      Delete
                    </button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </SectionCard>

      <SidebarDrawer eyebrow={editingRole ? "Edit Role" : "New Role"} onClose={() => setIsDrawerOpen(false)} open={isDrawerOpen} title={editingRole ? editingRole.roleName : "Create role"}>
        <form className="grid gap-4" onSubmit={(event) => {
          event.preventDefault();
          void handleSave();
        }}>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Role Name</span>
            <input className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, roleName: event.target.value.toUpperCase() }))} value={draft.roleName} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Description</span>
            <textarea className="field min-h-28 w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} value={draft.description} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Status</span>
            <select className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))} value={draft.status}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </label>
          <div className="md:col-span-2">
            <span className="mb-3 block text-sm font-semibold text-brand-strong">Menu Access</span>
            <RoleMenuAccessFields
              disabled={isProtectedAdminRole(draft.roleName)}
              onToggle={(menuKey, checked) =>
                setDraft((current) => ({
                  ...current,
                  menuAccessKeys: checked
                    ? Array.from(new Set([...current.menuAccessKeys, menuKey]))
                    : current.menuAccessKeys.filter((item) => item !== menuKey),
                }))
              }
              selectedKeys={draft.menuAccessKeys}
            />
          </div>
          <label className="flex items-center gap-3 rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3 md:col-span-2">
            <input checked={draft.defaultRole} className="h-4 w-4" disabled={isProtectedAdminRole(draft.roleName)} onChange={(event) => setDraft((current) => ({ ...current, defaultRole: event.target.checked }))} type="checkbox" />
            <span className="text-sm font-semibold text-brand-strong">Use as default role for self-registration</span>
          </label>
          {isProtectedAdminRole(draft.roleName) ? <p className="text-xs text-[color:var(--foreground-muted)]">ADMIN is protected. It must stay active and cannot be used as the default registration role.</p> : null}
          {formError ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{formError}</p> : null}
          <div className="flex items-center justify-end gap-3 border-t border-line pt-4">
            <button className="btn-secondary rounded-full px-5 py-3 text-sm font-semibold" onClick={() => setIsDrawerOpen(false)} type="button">Cancel</button>
            <button className="btn-primary rounded-full px-5 py-3 text-sm font-semibold" disabled={isSaving} type="submit">{isSaving ? "Saving..." : editingRole ? "Update Role" : "Create Role"}</button>
          </div>
        </form>
      </SidebarDrawer>
    </AppShell>
  );
}
