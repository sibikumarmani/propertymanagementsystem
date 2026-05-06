"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { DataTable } from "@/components/common/data-table";
import { CompanyContextBanner } from "@/components/common/company-context-banner";
import { SectionCard } from "@/components/common/section-card";
import { SidebarDrawer } from "@/components/common/sidebar-drawer";
import { AppShell } from "@/components/layout/app-shell";
import { branchApi } from "@/lib/api";
import type { BranchRecord } from "@/lib/types";
import { useAppStore } from "@/store/app-store";
import { useIsClient } from "@/hooks/use-is-client";

function readError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error) && typeof error.response?.data?.message === "string") {
    return error.response.data.message;
  }
  return fallback;
}

type BranchFormState = Omit<BranchRecord, "id" | "companyName" | "companyCode">;

const defaultForm: BranchFormState = {
  companyId: "",
  branchName: "",
  branchCode: "",
  address: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
  status: "ACTIVE",
};

export default function BranchesPage() {
  const isClient = useIsClient();
  const { accessToken, hasHydrated, user } = useAppStore();
  const activeCompany = user?.activeCompany;
  const activeCompanyId = activeCompany?.id ? String(activeCompany.id) : "";
  const [branches, setBranches] = useState<BranchRecord[]>([]);
  const [editingBranch, setEditingBranch] = useState<BranchRecord | null>(null);
  const [draft, setDraft] = useState<BranchFormState>(defaultForm);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  async function loadPageData() {
    const branchResponse = await branchApi.getBranches();

    setBranches(
      (branchResponse.data.data as Array<Omit<BranchRecord, "id" | "companyId"> & { id: number | string; companyId: number | string }>).map((branch) => ({
        ...branch,
        id: String(branch.id),
        companyId: String(branch.companyId),
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
        const branchResponse = await branchApi.getBranches();
        if (cancelled) {
          return;
        }
        setBranches(
          (branchResponse.data.data as Array<Omit<BranchRecord, "id" | "companyId"> & { id: number | string; companyId: number | string }>).map((branch) => ({
            ...branch,
            id: String(branch.id),
            companyId: String(branch.companyId),
          })),
        );
        setError(null);
      } catch (error: unknown) {
        if (!cancelled) {
          setError(readError(error, "Branches could not be loaded."));
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
    if (!activeCompanyId) {
      setFormError("Company is required.");
      return;
    }

    try {
      setIsSaving(true);
      setFormError(null);
      const payload = {
        companyId: Number(activeCompanyId),
        branchName: draft.branchName,
        branchCode: draft.branchCode,
        address: draft.address,
        city: draft.city,
        state: draft.state,
        country: draft.country,
        postalCode: draft.postalCode,
        status: draft.status,
      };
      if (editingBranch) {
        await branchApi.updateBranch(editingBranch.id, payload);
      } else {
        await branchApi.createBranch(payload);
      }
      setIsDrawerOpen(false);
      setDraft(defaultForm);
      setEditingBranch(null);
      await loadPageData();
    } catch (error: unknown) {
      setFormError(readError(error, "Branch could not be saved."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell title="Branch / region master" subtitle="Maintain company-linked branches, operational regions, and location details in a separate administration master.">
      <SectionCard
        title="Branch directory"
        eyebrow="Administration"
        action={
          <button
            className="rounded-full bg-brand-strong px-5 py-3 text-sm font-semibold text-white"
            onClick={() => {
              setEditingBranch(null);
              setDraft({ ...defaultForm, companyId: activeCompanyId });
              setFormError(null);
              setIsDrawerOpen(true);
            }}
            type="button"
          >
            Add Branch
          </button>
        }
      >
        {error ? <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
        {isLoading ? (
          <div className="rounded-[22px] border border-line bg-[color:var(--surface-soft)] px-4 py-8 text-sm text-[color:var(--foreground-muted)]">Loading branches...</div>
        ) : (
          <DataTable
            rows={branches}
            columns={[
              { key: "companyName", header: "Company", render: (row) => row.companyName || "Not set" },
              { key: "branchName", header: "Branch" },
              { key: "branchCode", header: "Code", render: (row) => row.branchCode || "Not set" },
              { key: "city", header: "City", render: (row) => row.city || "Not set" },
              { key: "state", header: "State", render: (row) => row.state || "Not set" },
              { key: "country", header: "Country", render: (row) => row.country || "Not set" },
              { key: "status", header: "Status" },
              {
                key: "actions",
                header: "Actions",
                render: (row) => (
                  <div className="flex gap-2">
                    <button
                      className="rounded-full border border-line bg-[color:var(--surface-raised)] px-3 py-2 text-xs font-semibold text-brand-strong"
                      onClick={() => {
                        setEditingBranch(row);
                        setDraft({
                          companyId: row.companyId,
                          branchName: row.branchName,
                          branchCode: row.branchCode || "",
                          address: row.address || "",
                          city: row.city || "",
                          state: row.state || "",
                          country: row.country || "",
                          postalCode: row.postalCode || "",
                          status: row.status,
                        });
                        setFormError(null);
                        setIsDrawerOpen(true);
                      }}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
                      onClick={async () => {
                        try {
                          await branchApi.deleteBranch(row.id);
                          await loadPageData();
                        } catch (error: unknown) {
                          setError(readError(error, "Branch could not be deleted."));
                        }
                      }}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </SectionCard>

      <SidebarDrawer
        eyebrow={editingBranch ? "Edit Branch" : "New Branch"}
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
        title={editingBranch ? editingBranch.branchName : "Create branch"}
        widthClassName="sm:max-w-3xl"
      >
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSave();
          }}
        >
          <div className="md:col-span-2">
            <CompanyContextBanner companyName={activeCompany?.companyName} />
          </div>
          {(["branchName", "branchCode", "city", "state", "country", "postalCode"] as const).map((field) => (
            <label key={field} className="block">
              <span className="mb-2 block text-sm font-semibold capitalize text-brand-strong">{field.replace(/([A-Z])/g, " $1")}</span>
              <input
                className="field w-full rounded-2xl px-4 py-3 ring-0"
                onChange={(event) => setDraft((current) => ({ ...current, [field]: event.target.value }))}
                value={draft[field] ?? ""}
              />
            </label>
          ))}
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Address</span>
            <textarea
              className="field min-h-28 w-full rounded-2xl px-4 py-3 ring-0"
              onChange={(event) => setDraft((current) => ({ ...current, address: event.target.value }))}
              value={draft.address ?? ""}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Status</span>
            <select
              className="field w-full rounded-2xl px-4 py-3 ring-0"
              onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}
              value={draft.status}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </label>
          {formError ? <p className="md:col-span-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{formError}</p> : null}
          <div className="flex items-center justify-end gap-3 border-t border-line pt-4 md:col-span-2">
            <button className="btn-secondary rounded-full px-5 py-3 text-sm font-semibold" onClick={() => setIsDrawerOpen(false)} type="button">
              Cancel
            </button>
            <button className="btn-primary rounded-full px-5 py-3 text-sm font-semibold" disabled={isSaving} type="submit">
              {isSaving ? "Saving..." : editingBranch ? "Update Branch" : "Create Branch"}
            </button>
          </div>
        </form>
      </SidebarDrawer>
    </AppShell>
  );
}
