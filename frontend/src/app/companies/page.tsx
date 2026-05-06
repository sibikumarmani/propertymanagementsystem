"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { DataTable } from "@/components/common/data-table";
import { SectionCard } from "@/components/common/section-card";
import { SidebarDrawer } from "@/components/common/sidebar-drawer";
import { AppShell } from "@/components/layout/app-shell";
import { companyApi } from "@/lib/api";
import type { CompanyRecord } from "@/lib/types";
import { useAppStore } from "@/store/app-store";
import { useIsClient } from "@/hooks/use-is-client";

function readError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error) && typeof error.response?.data?.message === "string") {
    return error.response.data.message;
  }
  return fallback;
}

type CompanyFormState = Omit<CompanyRecord, "id">;

const defaultForm: CompanyFormState = {
  companyName: "",
  companyCode: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
  gstNumber: "",
  taxNumber: "",
  defaultCompany: false,
  status: "ACTIVE",
};

export default function CompaniesPage() {
  const isClient = useIsClient();
  const { accessToken, hasHydrated } = useAppStore();
  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
  const [editingCompany, setEditingCompany] = useState<CompanyRecord | null>(null);
  const [draft, setDraft] = useState<CompanyFormState>(defaultForm);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  async function loadCompanies() {
    const response = await companyApi.getCompanies();
    setCompanies((response.data.data as Array<Omit<CompanyRecord, "id"> & { id: number | string }>).map((company) => ({ ...company, id: String(company.id) })));
  }

  useEffect(() => {
    if (!isClient || !hasHydrated || !accessToken) {
      return;
    }
    let cancelled = false;
    async function run() {
      try {
        setIsLoading(true);
        const response = await companyApi.getCompanies();
        if (cancelled) {
          return;
        }
        setCompanies((response.data.data as Array<Omit<CompanyRecord, "id"> & { id: number | string }>).map((company) => ({ ...company, id: String(company.id) })));
        setError(null);
      } catch (error: unknown) {
        if (!cancelled) {
          setError(readError(error, "Companies could not be loaded."));
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
      if (editingCompany) {
        await companyApi.updateCompany(editingCompany.id, draft);
      } else {
        await companyApi.createCompany(draft);
      }
      setIsDrawerOpen(false);
      setDraft(defaultForm);
      setEditingCompany(null);
      await loadCompanies();
    } catch (error: unknown) {
      setFormError(readError(error, "Company could not be saved."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell title="Company management" subtitle="Maintain company masters used for active ERP context and user-company assignments.">
      <SectionCard
        title="Company directory"
        eyebrow="Administration"
        action={
          <button className="rounded-full bg-brand-strong px-5 py-3 text-sm font-semibold text-white" onClick={() => {
            setEditingCompany(null);
            setDraft(defaultForm);
            setFormError(null);
            setIsDrawerOpen(true);
          }} type="button">
            Add Company
          </button>
        }
      >
        {error ? <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
        {isLoading ? (
          <div className="rounded-[22px] border border-line bg-[color:var(--surface-soft)] px-4 py-8 text-sm text-[color:var(--foreground-muted)]">Loading companies...</div>
        ) : (
          <DataTable
            rows={companies}
            columns={[
              { key: "companyName", header: "Company" },
              { key: "companyCode", header: "Code", render: (row) => row.companyCode || "Not set" },
              { key: "email", header: "Email", render: (row) => row.email || "Not set" },
              { key: "phone", header: "Phone", render: (row) => row.phone || "Not set" },
              { key: "defaultCompany", header: "Default", render: (row) => (row.defaultCompany ? "Yes" : "No") },
              { key: "status", header: "Status" },
              {
                key: "actions",
                header: "Actions",
                render: (row) => (
                  <div className="flex gap-2">
                    <button className="rounded-full border border-line bg-[color:var(--surface-raised)] px-3 py-2 text-xs font-semibold text-brand-strong" onClick={() => {
                      setEditingCompany(row);
                      setDraft({
                        companyName: row.companyName,
                        companyCode: row.companyCode || "",
                        email: row.email || "",
                        phone: row.phone || "",
                        address: row.address || "",
                        city: row.city || "",
                        state: row.state || "",
                        country: row.country || "",
                        postalCode: row.postalCode || "",
                        gstNumber: row.gstNumber || "",
                        taxNumber: row.taxNumber || "",
                        defaultCompany: row.defaultCompany,
                        status: row.status,
                      });
                      setFormError(null);
                      setIsDrawerOpen(true);
                    }} type="button">
                      Edit
                    </button>
                    <button className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700" onClick={async () => {
                      try {
                        await companyApi.deleteCompany(row.id);
                        await loadCompanies();
                      } catch (error: unknown) {
                        setError(readError(error, "Company could not be deleted."));
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

      <SidebarDrawer eyebrow={editingCompany ? "Edit Company" : "New Company"} onClose={() => setIsDrawerOpen(false)} open={isDrawerOpen} title={editingCompany ? editingCompany.companyName : "Create company"} widthClassName="sm:max-w-3xl">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => {
          event.preventDefault();
          void handleSave();
        }}>
          {(["companyName", "companyCode", "email", "phone", "city", "state", "country", "postalCode", "gstNumber", "taxNumber"] as const).map((field) => (
            <label key={field} className="block">
              <span className="mb-2 block text-sm font-semibold capitalize text-brand-strong">{field.replace(/([A-Z])/g, " $1")}</span>
              <input className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, [field]: event.target.value }))} value={draft[field] ?? ""} />
            </label>
          ))}
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Address</span>
            <textarea className="field min-h-28 w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, address: event.target.value }))} value={draft.address ?? ""} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Status</span>
            <select className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))} value={draft.status}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3 md:col-span-2">
            <input checked={draft.defaultCompany} className="h-4 w-4" onChange={(event) => setDraft((current) => ({ ...current, defaultCompany: event.target.checked }))} type="checkbox" />
            <span className="text-sm font-semibold text-brand-strong">Use as default company for self-registration</span>
          </label>
          {formError ? <p className="md:col-span-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{formError}</p> : null}
          <div className="md:col-span-2 flex items-center justify-end gap-3 border-t border-line pt-4">
            <button className="btn-secondary rounded-full px-5 py-3 text-sm font-semibold" onClick={() => setIsDrawerOpen(false)} type="button">Cancel</button>
            <button className="btn-primary rounded-full px-5 py-3 text-sm font-semibold" disabled={isSaving} type="submit">{isSaving ? "Saving..." : editingCompany ? "Update Company" : "Create Company"}</button>
          </div>
        </form>
      </SidebarDrawer>
    </AppShell>
  );
}
