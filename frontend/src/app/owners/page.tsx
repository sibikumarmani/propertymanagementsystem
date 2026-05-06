"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/common/data-table";
import { SectionCard } from "@/components/common/section-card";
import { SidebarDrawer } from "@/components/common/sidebar-drawer";
import { AppShell } from "@/components/layout/app-shell";
import { ownerApi, propertyApi } from "@/lib/api";
import type { OwnerRecord, PropertyRecord } from "@/lib/types";
import { useIsClient } from "@/hooks/use-is-client";
import { useAppStore } from "@/store/app-store";

function readError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error) && typeof error.response?.data?.message === "string") {
    return error.response.data.message;
  }
  return fallback;
}

type OwnerFormState = Omit<OwnerRecord, "id" | "companyId" | "companyName" | "companyCode" | "propertiesOwnedSummary">;

const payoutFrequencies = ["MONTHLY", "QUARTERLY", "HALF_YEARLY", "YEARLY", "ON_DEMAND"] as const;
const statementPreferences = ["EMAIL", "PORTAL", "EMAIL_AND_PORTAL", "PRINTED"] as const;
const ownerStatuses = ["ACTIVE", "INACTIVE"] as const;
const statementStages = [
  "RENT_COLLECTED",
  "MANAGEMENT_FEE_DEDUCTED",
  "MAINTENANCE_EXPENSES_DEDUCTED",
  "TAXES_AND_OTHER_CHARGES_DEDUCTED",
  "OWNER_PAYABLE_CALCULATED",
  "OWNER_STATEMENT_GENERATED",
  "STATEMENT_APPROVED",
  "OWNER_PAYMENT_PROCESSED",
] as const;

const defaultForm: OwnerFormState = {
  ownerCode: "",
  ownerName: "",
  phone: "",
  email: "",
  address: "",
  taxDetails: "",
  bankAccountDetails: "",
  propertyIds: [],
  ownershipPercentage: null,
  payoutFrequency: "MONTHLY",
  statementPreference: "EMAIL",
  ownerStatus: "ACTIVE",
  statementStage: "RENT_COLLECTED",
};

function prettify(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }
  return value.replaceAll("_", " ");
}

export default function OwnersPage() {
  const isClient = useIsClient();
  const { accessToken, hasHydrated, user } = useAppStore();
  const activeCompanyId = user?.activeCompany?.id ? String(user.activeCompany.id) : null;
  const [owners, setOwners] = useState<OwnerRecord[]>([]);
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [editingOwner, setEditingOwner] = useState<OwnerRecord | null>(null);
  const [draft, setDraft] = useState<OwnerFormState>(defaultForm);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const availableProperties = useMemo(
    () => properties.filter((property) => property.companyId === activeCompanyId && property.status === "ACTIVE"),
    [activeCompanyId, properties],
  );

  async function loadPageData() {
    const [ownerResponse, propertyResponse] = await Promise.all([ownerApi.getOwners(), propertyApi.getProperties()]);

    setOwners(
      (
        ownerResponse.data.data as Array<
          Omit<OwnerRecord, "id" | "companyId" | "propertyIds"> & {
            id: number | string;
            companyId: number | string;
            propertyIds: Array<number | string>;
          }
        >
      ).map((owner) => ({
        ...owner,
        id: String(owner.id),
        companyId: String(owner.companyId),
        propertyIds: owner.propertyIds.map((item) => String(item)),
      })),
    );
    setProperties(
      (
        propertyResponse.data.data as Array<
          PropertyRecord & {
            id: number | string;
            companyId: number | string;
            branchId: number | string | null;
            propertyManagerUserId: number | string | null;
          }
        >
      ).map((property) => ({
        ...property,
        id: String(property.id),
        companyId: String(property.companyId),
        branchId: property.branchId == null ? null : String(property.branchId),
        propertyManagerUserId: property.propertyManagerUserId == null ? null : String(property.propertyManagerUserId),
        documentAttachments: Array.isArray(property.documentAttachments) ? property.documentAttachments : [],
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
        await loadPageData();
        if (!cancelled) {
          setError(null);
        }
      } catch (loadError: unknown) {
        if (!cancelled) {
          setError(readError(loadError, "Owners could not be loaded."));
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
        ownerCode: draft.ownerCode,
        ownerName: draft.ownerName,
        phone: draft.phone,
        email: draft.email,
        address: draft.address,
        taxDetails: draft.taxDetails,
        bankAccountDetails: draft.bankAccountDetails,
        propertyIds: draft.propertyIds.map((id) => Number(id)),
        ownershipPercentage: draft.ownershipPercentage,
        payoutFrequency: draft.payoutFrequency,
        statementPreference: draft.statementPreference,
        ownerStatus: draft.ownerStatus,
        statementStage: draft.statementStage,
      };

      if (editingOwner) {
        await ownerApi.updateOwner(editingOwner.id, payload);
      } else {
        await ownerApi.createOwner(payload);
      }

      setIsDrawerOpen(false);
      setDraft(defaultForm);
      setEditingOwner(null);
      await loadPageData();
    } catch (saveError: unknown) {
      setFormError(readError(saveError, "Owner could not be saved."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell
      title="Owner management"
      subtitle="Maintain landlord masters, map owned properties, and track statement-to-payment processing for owner payouts."
    >
      <SectionCard
        title="Owner directory"
        eyebrow="Landlord Management"
        action={
          <button
            className="rounded-full bg-brand-strong px-5 py-3 text-sm font-semibold text-white"
            onClick={() => {
              setEditingOwner(null);
              setDraft(defaultForm);
              setFormError(null);
              setIsDrawerOpen(true);
            }}
            type="button"
          >
            Add Owner
          </button>
        }
      >
        <div className="mb-5 rounded-[22px] border border-line bg-[color:var(--surface-soft)] px-4 py-4 text-sm text-[color:var(--foreground-muted)]">
          <p className="font-semibold text-brand-strong">{user?.activeCompany?.companyName ?? "Active company"} owner statement flow</p>
          <p className="mt-1">Collect Rent → Deduct Management Fee → Deduct Maintenance Expenses → Deduct Taxes / Other Charges → Calculate Owner Payable → Generate Owner Statement → Approve Statement → Process Owner Payment</p>
        </div>

        {error ? <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
        {isLoading ? (
          <div className="rounded-[22px] border border-line bg-[color:var(--surface-soft)] px-4 py-8 text-sm text-[color:var(--foreground-muted)]">Loading owners...</div>
        ) : (
          <DataTable
            rows={owners}
            columns={[
              { key: "ownerCode", header: "Owner Code" },
              { key: "ownerName", header: "Owner" },
              { key: "phone", header: "Phone" },
              { key: "propertiesOwnedSummary", header: "Properties Owned", render: (row) => row.propertiesOwnedSummary || "Not linked" },
              { key: "payoutFrequency", header: "Payout", render: (row) => prettify(row.payoutFrequency) },
              { key: "statementStage", header: "Statement Stage", render: (row) => prettify(row.statementStage) },
              { key: "ownerStatus", header: "Status", render: (row) => prettify(row.ownerStatus) },
              {
                key: "actions",
                header: "Actions",
                render: (row) => (
                  <div className="flex gap-2">
                    <button
                      className="rounded-full border border-line bg-[color:var(--surface-raised)] px-3 py-2 text-xs font-semibold text-brand-strong"
                      onClick={() => {
                        setEditingOwner(row);
                        setDraft({
                          ownerCode: row.ownerCode,
                          ownerName: row.ownerName,
                          phone: row.phone,
                          email: row.email ?? "",
                          address: row.address ?? "",
                          taxDetails: row.taxDetails ?? "",
                          bankAccountDetails: row.bankAccountDetails ?? "",
                          propertyIds: row.propertyIds,
                          ownershipPercentage: row.ownershipPercentage,
                          payoutFrequency: row.payoutFrequency,
                          statementPreference: row.statementPreference,
                          ownerStatus: row.ownerStatus,
                          statementStage: row.statementStage,
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
                          await ownerApi.deleteOwner(row.id);
                          await loadPageData();
                        } catch (deleteError: unknown) {
                          setError(readError(deleteError, "Owner could not be deleted."));
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
        eyebrow={editingOwner ? "Edit Owner" : "New Owner"}
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
        title={editingOwner ? editingOwner.ownerName : "Create owner"}
        description="Link the owner to live property masters, define payout and statement preferences, then advance the statement stage as collections are settled."
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
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Owner code</span>
            <input className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, ownerCode: event.target.value }))} value={draft.ownerCode} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Owner name</span>
            <input className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, ownerName: event.target.value }))} value={draft.ownerName} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Phone</span>
            <input className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} value={draft.phone} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Email</span>
            <input className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} value={draft.email ?? ""} />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Address</span>
            <textarea className="field min-h-24 w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, address: event.target.value }))} value={draft.address ?? ""} />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Tax details</span>
            <textarea className="field min-h-24 w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, taxDetails: event.target.value }))} value={draft.taxDetails ?? ""} />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Bank account details</span>
            <textarea className="field min-h-24 w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, bankAccountDetails: event.target.value }))} value={draft.bankAccountDetails ?? ""} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Ownership percentage</span>
            <input
              className="field w-full rounded-2xl px-4 py-3 ring-0"
              min="0"
              max="100"
              onChange={(event) =>
                setDraft((current) => ({ ...current, ownershipPercentage: event.target.value ? Number(event.target.value) : null }))
              }
              step="0.01"
              type="number"
              value={draft.ownershipPercentage ?? ""}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Payout frequency</span>
            <select className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, payoutFrequency: event.target.value }))} value={draft.payoutFrequency}>
              {payoutFrequencies.map((option) => (
                <option key={option} value={option}>
                  {prettify(option)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Statement preference</span>
            <select className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, statementPreference: event.target.value }))} value={draft.statementPreference}>
              {statementPreferences.map((option) => (
                <option key={option} value={option}>
                  {prettify(option)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Owner status</span>
            <select className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, ownerStatus: event.target.value }))} value={draft.ownerStatus}>
              {ownerStatuses.map((option) => (
                <option key={option} value={option}>
                  {prettify(option)}
                </option>
              ))}
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Statement stage</span>
            <select className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setDraft((current) => ({ ...current, statementStage: event.target.value }))} value={draft.statementStage}>
              {statementStages.map((option) => (
                <option key={option} value={option}>
                  {prettify(option)}
                </option>
              ))}
            </select>
          </label>
          <div className="md:col-span-2 rounded-[22px] border border-line bg-[color:var(--surface-soft)] p-4">
            <p className="mb-3 text-sm font-semibold text-brand-strong">Properties owned</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {availableProperties.map((property) => (
                <label key={property.id} className="flex items-start gap-3 rounded-2xl border border-line bg-[color:var(--surface-raised)] px-4 py-3">
                  <input
                    checked={draft.propertyIds.includes(property.id)}
                    className="mt-1 h-4 w-4"
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        propertyIds: event.target.checked
                          ? [...current.propertyIds, property.id]
                          : current.propertyIds.filter((id) => id !== property.id),
                      }))
                    }
                    type="checkbox"
                  />
                  <span className="text-sm text-[color:var(--foreground)]">
                    <span className="block font-semibold text-brand-strong">{property.propertyName}</span>
                    <span className="block text-[color:var(--foreground-muted)]">{property.propertyCode}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
          {formError ? <p className="md:col-span-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{formError}</p> : null}
          <div className="md:col-span-2 flex items-center justify-end gap-3 border-t border-line pt-4">
            <button className="btn-secondary rounded-full px-5 py-3 text-sm font-semibold" onClick={() => setIsDrawerOpen(false)} type="button">
              Cancel
            </button>
            <button className="btn-primary rounded-full px-5 py-3 text-sm font-semibold" disabled={isSaving} type="submit">
              {isSaving ? "Saving..." : editingOwner ? "Update Owner" : "Create Owner"}
            </button>
          </div>
        </form>
      </SidebarDrawer>
    </AppShell>
  );
}
