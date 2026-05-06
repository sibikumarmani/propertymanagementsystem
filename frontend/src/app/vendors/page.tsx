"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { DataTable } from "@/components/common/data-table";
import { SectionCard } from "@/components/common/section-card";
import { SidebarDrawer } from "@/components/common/sidebar-drawer";
import { AppShell } from "@/components/layout/app-shell";
import { vendorApi } from "@/lib/api";
import type { VendorRecord } from "@/lib/types";
import { useIsClient } from "@/hooks/use-is-client";
import { useAppStore } from "@/store/app-store";

function readError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error) && typeof error.response?.data?.message === "string") {
    return error.response.data.message;
  }
  return fallback;
}

type VendorFormState = Omit<VendorRecord, "id" | "companyId" | "companyName" | "companyCode">;

const contractStatuses = ["DRAFT", "APPROVED", "ACTIVE", "EXPIRED", "SUSPENDED", "TERMINATED"] as const;
const vendorStatuses = ["ACTIVE", "INACTIVE"] as const;
const assignmentStages = [
  "WORK_ORDER_REQUIRES_VENDOR",
  "APPROVED_VENDOR_SELECTED",
  "WORK_ORDER_SENT",
  "VENDOR_ACCEPTED",
  "WORK_COMPLETED",
  "INVOICE_SUBMITTED",
  "MANAGER_VERIFIED",
  "PAYMENT_PROCESSED",
] as const;

const defaultForm: VendorFormState = {
  vendorCode: "",
  vendorName: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  serviceCategory: "",
  taxNumber: "",
  bankDetails: "",
  contractStatus: "DRAFT",
  insuranceDetails: "",
  rating: null,
  vendorStatus: "ACTIVE",
  assignmentStage: "WORK_ORDER_REQUIRES_VENDOR",
};

function prettify(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }
  return value.replaceAll("_", " ");
}

export default function VendorsPage() {
  const isClient = useIsClient();
  const { accessToken, hasHydrated, user } = useAppStore();
  const [vendors, setVendors] = useState<VendorRecord[]>([]);
  const [editingVendor, setEditingVendor] = useState<VendorRecord | null>(null);
  const [draft, setDraft] = useState<VendorFormState>(defaultForm);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  async function loadVendors() {
    const response = await vendorApi.getVendors();
    setVendors(
      (
        response.data.data as Array<
          Omit<VendorRecord, "id" | "companyId"> & {
            id: number | string;
            companyId: number | string;
          }
        >
      ).map((vendor) => ({
        ...vendor,
        id: String(vendor.id),
        companyId: String(vendor.companyId),
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
        const response = await vendorApi.getVendors();
        if (cancelled) {
          return;
        }
        setVendors(
          (
            response.data.data as Array<
              Omit<VendorRecord, "id" | "companyId"> & {
                id: number | string;
                companyId: number | string;
              }
            >
          ).map((vendor) => ({
            ...vendor,
            id: String(vendor.id),
            companyId: String(vendor.companyId),
          })),
        );
        setError(null);
      } catch (loadError: unknown) {
        if (!cancelled) {
          setError(readError(loadError, "Vendors could not be loaded."));
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
      const payload = {
        vendorCode: draft.vendorCode,
        vendorName: draft.vendorName,
        contactPerson: draft.contactPerson,
        phone: draft.phone,
        email: draft.email,
        address: draft.address,
        serviceCategory: draft.serviceCategory,
        taxNumber: draft.taxNumber,
        bankDetails: draft.bankDetails,
        contractStatus: draft.contractStatus,
        insuranceDetails: draft.insuranceDetails,
        rating: draft.rating,
        vendorStatus: draft.vendorStatus,
        assignmentStage: draft.assignmentStage,
      };

      if (editingVendor) {
        await vendorApi.updateVendor(editingVendor.id, payload);
      } else {
        await vendorApi.createVendor(payload);
      }

      setIsDrawerOpen(false);
      setDraft(defaultForm);
      setEditingVendor(null);
      await loadVendors();
    } catch (saveError: unknown) {
      setFormError(readError(saveError, "Vendor could not be saved."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell
      title="Vendor management"
      subtitle="Maintain approved service providers, track work-order progression, and keep finance-ready vendor masters for payment processing."
    >
      <SectionCard
        title="Vendor directory"
        eyebrow="Vendor Management"
        action={
          <button
            className="rounded-full bg-brand-strong px-5 py-3 text-sm font-semibold text-white"
            onClick={() => {
              setEditingVendor(null);
              setDraft(defaultForm);
              setFormError(null);
              setIsDrawerOpen(true);
            }}
            type="button"
          >
            Add Vendor
          </button>
        }
      >
        <div className="mb-5 rounded-[22px] border border-line bg-[color:var(--surface-soft)] px-4 py-4 text-sm text-[color:var(--foreground-muted)]">
          <p className="font-semibold text-brand-strong">{user?.activeCompany?.companyName ?? "Active company"} vendor assignment flow</p>
          <p className="mt-1">Work Order Requires Vendor → Select Approved Vendor → Send Work Order → Vendor Accepts → Vendor Completes Work → Vendor Submits Invoice → Manager Verifies → Finance Processes Payment</p>
        </div>

        {error ? <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
        {isLoading ? (
          <div className="rounded-[22px] border border-line bg-[color:var(--surface-soft)] px-4 py-8 text-sm text-[color:var(--foreground-muted)]">Loading vendors...</div>
        ) : (
          <DataTable
            rows={vendors}
            columns={[
              { key: "vendorCode", header: "Vendor Code" },
              { key: "vendorName", header: "Vendor" },
              { key: "serviceCategory", header: "Service Category", render: (row) => row.serviceCategory || "Not set" },
              { key: "phone", header: "Phone" },
              { key: "contractStatus", header: "Contract", render: (row) => prettify(row.contractStatus) },
              { key: "assignmentStage", header: "Flow Stage", render: (row) => prettify(row.assignmentStage) },
              { key: "vendorStatus", header: "Status", render: (row) => prettify(row.vendorStatus) },
              {
                key: "actions",
                header: "Actions",
                render: (row) => (
                  <div className="flex gap-2">
                    <button
                      className="rounded-full border border-line bg-[color:var(--surface-raised)] px-3 py-2 text-xs font-semibold text-brand-strong"
                      onClick={() => {
                        setEditingVendor(row);
                        setDraft({
                          vendorCode: row.vendorCode,
                          vendorName: row.vendorName,
                          contactPerson: row.contactPerson ?? "",
                          phone: row.phone,
                          email: row.email ?? "",
                          address: row.address ?? "",
                          serviceCategory: row.serviceCategory ?? "",
                          taxNumber: row.taxNumber ?? "",
                          bankDetails: row.bankDetails ?? "",
                          contractStatus: row.contractStatus,
                          insuranceDetails: row.insuranceDetails ?? "",
                          rating: row.rating,
                          vendorStatus: row.vendorStatus,
                          assignmentStage: row.assignmentStage,
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
                          await vendorApi.deleteVendor(row.id);
                          await loadVendors();
                        } catch (deleteError: unknown) {
                          setError(readError(deleteError, "Vendor could not be deleted."));
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
        eyebrow={editingVendor ? "Edit Vendor" : "New Vendor"}
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
        title={editingVendor ? editingVendor.vendorName : "Create vendor"}
        description="Store vendor approvals, insurance and banking references, then move the assignment stage forward as work and payment progress."
        widthClassName="sm:max-w-5xl"
      >
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSave();
          }}
        >
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Vendor code</span>
            <input className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, vendorCode: event.target.value }))} value={draft.vendorCode} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Vendor name</span>
            <input className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, vendorName: event.target.value }))} value={draft.vendorName} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Contact person</span>
            <input className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, contactPerson: event.target.value }))} value={draft.contactPerson ?? ""} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Phone</span>
            <input className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} value={draft.phone} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Email</span>
            <input className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} value={draft.email ?? ""} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Service category</span>
            <input className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, serviceCategory: event.target.value }))} value={draft.serviceCategory ?? ""} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Tax number</span>
            <input className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, taxNumber: event.target.value }))} value={draft.taxNumber ?? ""} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Rating</span>
            <input
              className="field w-full rounded-2xl px-4 py-3 ring-0"
              min="1"
              max="5"
              onChange={(event) =>
                setDraft((current) => ({ ...current, rating: event.target.value ? Number(event.target.value) : null }))
              }
              type="number"
              value={draft.rating ?? ""}
            />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Address</span>
            <textarea className="field min-h-24 w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, address: event.target.value }))} value={draft.address ?? ""} />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Bank details</span>
            <textarea className="field min-h-24 w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, bankDetails: event.target.value }))} value={draft.bankDetails ?? ""} />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Insurance details</span>
            <textarea className="field min-h-24 w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, insuranceDetails: event.target.value }))} value={draft.insuranceDetails ?? ""} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Contract status</span>
            <select className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, contractStatus: event.target.value }))} value={draft.contractStatus}>
              {contractStatuses.map((option) => (
                <option key={option} value={option}>
                  {prettify(option)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Active / inactive status</span>
            <select className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, vendorStatus: event.target.value }))} value={draft.vendorStatus}>
              {vendorStatuses.map((option) => (
                <option key={option} value={option}>
                  {prettify(option)}
                </option>
              ))}
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Assignment flow stage</span>
            <select className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, assignmentStage: event.target.value }))} value={draft.assignmentStage}>
              {assignmentStages.map((option) => (
                <option key={option} value={option}>
                  {prettify(option)}
                </option>
              ))}
            </select>
          </label>
          {formError ? <p className="md:col-span-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{formError}</p> : null}
          <div className="md:col-span-2 flex items-center justify-end gap-3 border-t border-line pt-4">
            <button className="btn-secondary rounded-full px-5 py-3 text-sm font-semibold" onClick={() => setIsDrawerOpen(false)} type="button">
              Cancel
            </button>
            <button className="btn-primary rounded-full px-5 py-3 text-sm font-semibold" disabled={isSaving} type="submit">
              {isSaving ? "Saving..." : editingVendor ? "Update Vendor" : "Create Vendor"}
            </button>
          </div>
        </form>
      </SidebarDrawer>
    </AppShell>
  );
}
