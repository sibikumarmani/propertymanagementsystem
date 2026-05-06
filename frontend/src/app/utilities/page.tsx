"use client";

import axios from "axios";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { CompanyContextBanner } from "@/components/common/company-context-banner";
import { DataTable } from "@/components/common/data-table";
import { SectionCard } from "@/components/common/section-card";
import { SidebarDrawer } from "@/components/common/sidebar-drawer";
import { AppShell } from "@/components/layout/app-shell";
import { propertyApi, tenantApi, unitApi, utilityApi } from "@/lib/api";
import type { MeterReadingRecord, PropertyRecord, TenantRecord, UnitRecord, UtilityBillRecord, UtilityOptionsRecord, UtilityTypeRecord } from "@/lib/types";
import { useIsClient } from "@/hooks/use-is-client";
import { useAppStore } from "@/store/app-store";

type ActiveTab = "types" | "readings" | "bills";
type FormState = Record<string, string>;

const defaultOptions: UtilityOptionsRecord = {
  categories: ["ELECTRICITY", "WATER", "GAS", "INTERNET", "PARKING", "WASTE_MANAGEMENT", "OTHER"],
  billingMethods: ["FIXED", "USAGE_BASED", "FIXED_PLUS_USAGE"],
  utilityTypeStatuses: ["ACTIVE", "INACTIVE"],
  readingStatuses: ["RECORDED", "VERIFIED", "DISPUTED", "CANCELLED"],
  billStatuses: ["DRAFT", "APPROVED", "POSTED", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED"],
  unitsOfMeasure: ["KWH", "KL", "LITRE", "CUBIC_METER", "MBPS", "MONTH", "SLOT", "TRIP", "UNIT"],
};

const defaults: Record<ActiveTab, FormState> = {
  types: { typeCode: "", typeName: "", category: "ELECTRICITY", billingMethod: "USAGE_BASED", unitOfMeasure: "KWH", defaultRate: "", fixedCharge: "", commonArea: "false", status: "ACTIVE", description: "" },
  readings: { readingNumber: "", utilityTypeId: "", propertyId: "", unitId: "", tenantId: "", meterNumber: "", readingDate: "", previousReading: "", currentReading: "", commonArea: "false", status: "RECORDED", remarks: "" },
  bills: { billNumber: "", utilityTypeId: "", meterReadingId: "", tenantId: "", propertyId: "", unitId: "", billDate: "", dueDate: "", billingPeriodStart: "", billingPeriodEnd: "", billingMethod: "USAGE_BASED", consumption: "", rate: "", fixedCharge: "", commonAreaAmount: "", taxAmount: "", paidAmount: "", status: "DRAFT", remarks: "" },
};

function readError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error) && typeof error.response?.data?.message === "string") {
    return error.response.data.message;
  }
  return fallback;
}

function label(value: string | null | undefined) {
  return value ? value.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ") : "Not set";
}

function normalizeId(value: string | number | null | undefined) {
  return value == null ? null : String(value);
}

function toNumber(value: string) {
  if (!value.trim()) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toId(value: string) {
  return value ? Number(value) : null;
}

function money(value: number | null | undefined) {
  return value == null ? "0" : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function UtilitiesPage() {
  const isClient = useIsClient();
  const { accessToken, hasHydrated, user } = useAppStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>("types");
  const [options, setOptions] = useState<UtilityOptionsRecord>(defaultOptions);
  const [types, setTypes] = useState<UtilityTypeRecord[]>([]);
  const [readings, setReadings] = useState<MeterReadingRecord[]>([]);
  const [bills, setBills] = useState<UtilityBillRecord[]>([]);
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [units, setUnits] = useState<UnitRecord[]>([]);
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [draft, setDraft] = useState<FormState>(defaults.types);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const activeCompany = user?.activeCompany;
  const filteredUnits = useMemo(() => units.filter((unit) => !draft.propertyId || unit.propertyId === draft.propertyId), [draft.propertyId, units]);

  async function loadAll() {
    const [optionResponse, typeResponse, readingResponse, billResponse, propertyResponse, unitResponse, tenantResponse] = await Promise.all([
      utilityApi.getOptions(),
      utilityApi.getTypes(),
      utilityApi.getReadings(),
      utilityApi.getBills(),
      propertyApi.getProperties(),
      unitApi.getUnits(),
      tenantApi.getTenants(),
    ]);
    setOptions(optionResponse.data.data as UtilityOptionsRecord);
    setTypes((typeResponse.data.data as Array<UtilityTypeRecord & { id: number | string; companyId: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId) })));
    setReadings((readingResponse.data.data as Array<MeterReadingRecord & { id: number | string; companyId: number | string; utilityTypeId: number | string; propertyId: number | string; unitId: number | string | null; tenantId: number | string | null }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), utilityTypeId: String(item.utilityTypeId), propertyId: String(item.propertyId), unitId: normalizeId(item.unitId), tenantId: normalizeId(item.tenantId) })));
    setBills((billResponse.data.data as Array<UtilityBillRecord & { id: number | string; companyId: number | string; utilityTypeId: number | string; meterReadingId: number | string | null; tenantId: number | string | null; propertyId: number | string; unitId: number | string | null }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), utilityTypeId: String(item.utilityTypeId), meterReadingId: normalizeId(item.meterReadingId), tenantId: normalizeId(item.tenantId), propertyId: String(item.propertyId), unitId: normalizeId(item.unitId) })));
    setProperties((propertyResponse.data.data as Array<PropertyRecord & { id: number | string; companyId: number | string; branchId: number | string | null; propertyManagerUserId: number | string | null }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), branchId: normalizeId(item.branchId), propertyManagerUserId: normalizeId(item.propertyManagerUserId), documentAttachments: Array.isArray(item.documentAttachments) ? item.documentAttachments : [] })));
    setUnits((unitResponse.data.data as Array<UnitRecord & { id: number | string; companyId: number | string; propertyId: number | string; buildingId: number | string; floorId: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), propertyId: String(item.propertyId), buildingId: String(item.buildingId), floorId: String(item.floorId), photoAttachments: [], documentAttachments: [] })));
    setTenants((tenantResponse.data.data as Array<TenantRecord & { id: number | string; companyId: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), idProofAttachments: [], addressProofAttachments: [], financialAttachments: [] })));
  }

  useEffect(() => {
    if (!isClient || !hasHydrated || !accessToken) {
      return;
    }
    let cancelled = false;
    async function run() {
      try {
        setIsLoading(true);
        await loadAll();
        if (!cancelled) setError(null);
      } catch (loadError: unknown) {
        if (!cancelled) setError(readError(loadError, "Utility management data could not be loaded."));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [accessToken, hasHydrated, isClient]);

  function switchTab(tab: ActiveTab) {
    setActiveTab(tab);
    setDraft(defaults[tab]);
    setEditingId(null);
    setDrawerOpen(false);
    setFormError(null);
  }

  function openCreate() {
    setDraft(defaults[activeTab]);
    setEditingId(null);
    setFormError(null);
    setDrawerOpen(true);
  }

  function openEdit(row: UtilityTypeRecord | MeterReadingRecord | UtilityBillRecord) {
    setEditingId(row.id);
    setFormError(null);
    setDraft(Object.fromEntries(Object.entries(row).map(([key, value]) => [key, value == null ? "" : String(value)])));
    setDrawerOpen(true);
  }

  async function save() {
    try {
      setIsSaving(true);
      setFormError(null);
      if (activeTab === "types") {
        const payload = { typeCode: draft.typeCode, typeName: draft.typeName, category: draft.category, billingMethod: draft.billingMethod, unitOfMeasure: draft.unitOfMeasure || null, defaultRate: toNumber(draft.defaultRate), fixedCharge: toNumber(draft.fixedCharge), commonArea: draft.commonArea === "true", status: draft.status, description: draft.description || null };
        if (editingId) await utilityApi.updateType(editingId, payload);
        else await utilityApi.createType(payload);
      }
      if (activeTab === "readings") {
        const payload = { readingNumber: draft.readingNumber, utilityTypeId: Number(draft.utilityTypeId), propertyId: Number(draft.propertyId), unitId: toId(draft.unitId), tenantId: toId(draft.tenantId), meterNumber: draft.meterNumber || null, readingDate: draft.readingDate, previousReading: toNumber(draft.previousReading), currentReading: Number(draft.currentReading), commonArea: draft.commonArea === "true", status: draft.status, remarks: draft.remarks || null };
        if (editingId) await utilityApi.updateReading(editingId, payload);
        else await utilityApi.createReading(payload);
      }
      if (activeTab === "bills") {
        const payload = { billNumber: draft.billNumber, utilityTypeId: Number(draft.utilityTypeId), meterReadingId: toId(draft.meterReadingId), tenantId: toId(draft.tenantId), propertyId: Number(draft.propertyId), unitId: toId(draft.unitId), billDate: draft.billDate, dueDate: draft.dueDate, billingPeriodStart: draft.billingPeriodStart, billingPeriodEnd: draft.billingPeriodEnd, billingMethod: draft.billingMethod, consumption: toNumber(draft.consumption), rate: toNumber(draft.rate), fixedCharge: toNumber(draft.fixedCharge), commonAreaAmount: toNumber(draft.commonAreaAmount), taxAmount: toNumber(draft.taxAmount), paidAmount: toNumber(draft.paidAmount), status: draft.status, remarks: draft.remarks || null };
        if (editingId) await utilityApi.updateBill(editingId, payload);
        else await utilityApi.createBill(payload);
      }
      await loadAll();
      setDrawerOpen(false);
    } catch (saveError: unknown) {
      setFormError(readError(saveError, "Utility record could not be saved."));
    } finally {
      setIsSaving(false);
    }
  }

  async function remove(id: string) {
    try {
      if (activeTab === "types") await utilityApi.deleteType(id);
      if (activeTab === "readings") await utilityApi.deleteReading(id);
      if (activeTab === "bills") await utilityApi.deleteBill(id);
      await loadAll();
    } catch (deleteError: unknown) {
      setError(readError(deleteError, "Utility record could not be deleted."));
    }
  }

  async function updateBillStatus(id: string, action: "approve" | "post" | "cancel") {
    try {
      if (action === "approve") await utilityApi.approveBill(id);
      if (action === "post") await utilityApi.postBill(id);
      if (action === "cancel") await utilityApi.cancelBill(id);
      await loadAll();
    } catch (statusError: unknown) {
      setError(readError(statusError, "Utility bill status could not be updated."));
    }
  }

  const statCards = [
    { label: "Utility Types", value: String(types.length), detail: "Billable utility definitions" },
    { label: "Readings", value: String(readings.length), detail: "Captured meter records" },
    { label: "Open Due", value: money(bills.reduce((sum, bill) => sum + (bill.dueAmount ?? 0), 0)), detail: "Outstanding utility billing" },
  ];

  const typeColumns = [
    { key: "typeName", header: "Type", render: (row: UtilityTypeRecord) => <div><div className="font-semibold">{row.typeName}</div><div className="text-xs text-[color:var(--foreground-muted)]">{row.typeCode}</div></div> },
    { key: "category", header: "Category", render: (row: UtilityTypeRecord) => label(row.category) },
    { key: "billingMethod", header: "Billing", render: (row: UtilityTypeRecord) => label(row.billingMethod) },
    { key: "rate", header: "Rate", render: (row: UtilityTypeRecord) => `${money(row.defaultRate)} / ${label(row.unitOfMeasure)}` },
    { key: "fixedCharge", header: "Fixed", render: (row: UtilityTypeRecord) => money(row.fixedCharge) },
    { key: "status", header: "Status", render: (row: UtilityTypeRecord) => label(row.status) },
    { key: "actions", header: "Actions", render: (row: UtilityTypeRecord) => <ActionButtons onEdit={() => openEdit(row)} onDelete={() => remove(row.id)} /> },
  ];
  const readingColumns = [
    { key: "readingNumber", header: "Reading", render: (row: MeterReadingRecord) => <div><div className="font-semibold">{row.readingNumber}</div><div className="text-xs text-[color:var(--foreground-muted)]">{row.readingDate}</div></div> },
    { key: "utilityTypeName", header: "Utility" },
    { key: "location", header: "Location", render: (row: MeterReadingRecord) => `${row.propertyName ?? "Property"}${row.unitNumber ? ` / ${row.unitNumber}` : ""}` },
    { key: "tenantDisplayName", header: "Tenant", render: (row: MeterReadingRecord) => row.tenantDisplayName ?? (row.commonArea ? "Common area" : "Not mapped") },
    { key: "consumption", header: "Consumption", render: (row: MeterReadingRecord) => money(row.consumption) },
    { key: "status", header: "Status", render: (row: MeterReadingRecord) => label(row.status) },
    { key: "actions", header: "Actions", render: (row: MeterReadingRecord) => <ActionButtons onEdit={() => openEdit(row)} onDelete={() => remove(row.id)} /> },
  ];
  const billColumns = [
    { key: "billNumber", header: "Bill", render: (row: UtilityBillRecord) => <div><div className="font-semibold">{row.billNumber}</div><div className="text-xs text-[color:var(--foreground-muted)]">{row.billDate} due {row.dueDate}</div></div> },
    { key: "utilityTypeName", header: "Utility" },
    { key: "tenantDisplayName", header: "Tenant", render: (row: UtilityBillRecord) => row.tenantDisplayName ?? "Common/property" },
    { key: "method", header: "Method", render: (row: UtilityBillRecord) => label(row.billingMethod) },
    { key: "totalAmount", header: "Total", render: (row: UtilityBillRecord) => money(row.totalAmount) },
    { key: "dueAmount", header: "Due", render: (row: UtilityBillRecord) => money(row.dueAmount) },
    { key: "status", header: "Status", render: (row: UtilityBillRecord) => label(row.status) },
    { key: "actions", header: "Actions", render: (row: UtilityBillRecord) => <div className="flex flex-wrap gap-2"><ActionButtons onEdit={() => openEdit(row)} onDelete={() => remove(row.id)} /><button className="btn-secondary rounded-full px-3 py-1 text-xs" onClick={() => updateBillStatus(row.id, "approve")}>Approve</button><button className="btn-secondary rounded-full px-3 py-1 text-xs" onClick={() => updateBillStatus(row.id, "post")}>Post</button></div> },
  ];

  return (
    <AppShell title="Utility Management" subtitle="Metered, fixed, tenant, and common-area utility billing">
      <div className="space-y-6">
        <CompanyContextBanner companyName={activeCompany?.companyName ?? null} />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[color:var(--accent)]">Operations</p>
            <h1 className="text-3xl font-semibold tracking-tight">Utility Management</h1>
            <p className="mt-2 max-w-3xl text-sm text-[color:var(--foreground-muted)]">Manage electricity, water, gas, internet, parking, waste management, meter readings, tenant charges, and common-area utility billing.</p>
          </div>
          <button className="btn-primary rounded-full px-5 py-3 text-sm font-semibold" onClick={openCreate}>Add {activeTab === "types" ? "Utility Type" : activeTab === "readings" ? "Meter Reading" : "Utility Bill"}</button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {statCards.map((stat) => (
            <SectionCard key={stat.label} title={stat.label}>
              <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--foreground-subtle)]">{stat.label}</p>
              <p className="mt-3 text-3xl font-semibold">{stat.value}</p>
              <p className="mt-1 text-sm text-[color:var(--foreground-muted)]">{stat.detail}</p>
            </SectionCard>
          ))}
        </div>

        <SectionCard title="Utility Register">
          <div className="mb-5 flex flex-wrap gap-2">
            {(["types", "readings", "bills"] as ActiveTab[]).map((tab) => (
              <button key={tab} className={`${activeTab === tab ? "btn-primary" : "btn-secondary"} rounded-full px-4 py-2 text-sm font-semibold`} onClick={() => switchTab(tab)}>
                {tab === "types" ? "Utility Types" : tab === "readings" ? "Meter Readings" : "Utility Bills"}
              </button>
            ))}
          </div>
          {error ? <p className="mb-4 rounded-md border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-600">{error}</p> : null}
          {isLoading ? <p className="text-sm text-[color:var(--foreground-muted)]">Loading utility data...</p> : null}
          {!isLoading && activeTab === "types" ? <DataTable columns={typeColumns} rows={types} /> : null}
          {!isLoading && activeTab === "readings" ? <DataTable columns={readingColumns} rows={readings} /> : null}
          {!isLoading && activeTab === "bills" ? <DataTable columns={billColumns} rows={bills} /> : null}
        </SectionCard>
      </div>

      <SidebarDrawer open={drawerOpen} title={editingId ? "Edit utility record" : "New utility record"} onClose={() => setDrawerOpen(false)}>
        <div className="space-y-4">
          {formError ? <p className="rounded-md border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-600">{formError}</p> : null}
          {activeTab === "types" ? <TypeFields draft={draft} setDraft={setDraft} options={options} /> : null}
          {activeTab === "readings" ? <ReadingFields draft={draft} setDraft={setDraft} options={options} types={types} properties={properties} units={filteredUnits} tenants={tenants} /> : null}
          {activeTab === "bills" ? <BillFields draft={draft} setDraft={setDraft} options={options} types={types} readings={readings} properties={properties} units={filteredUnits} tenants={tenants} /> : null}
          <button className="btn-primary w-full rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-60" disabled={isSaving} onClick={save}>{isSaving ? "Saving..." : "Save"}</button>
        </div>
      </SidebarDrawer>
    </AppShell>
  );
}

function ActionButtons({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex gap-2">
      <button className="btn-secondary rounded-full px-3 py-1 text-xs" onClick={onEdit}>Edit</button>
      <button className="btn-secondary rounded-full px-3 py-1 text-xs text-red-600" onClick={onDelete}>Delete</button>
    </div>
  );
}

function update(setDraft: (value: FormState) => void, draft: FormState, key: string, value: string) {
  setDraft({ ...draft, [key]: value });
}

function TextField({ labelText, value, onChange, type = "text" }: { labelText: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="block text-sm font-medium">{labelText}<input className="field mt-1 w-full rounded-2xl px-3 py-2" type={type} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function SelectField({ labelText, value, onChange, children }: { labelText: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  return <label className="block text-sm font-medium">{labelText}<select className="field mt-1 w-full rounded-2xl px-3 py-2" value={value} onChange={(event) => onChange(event.target.value)}>{children}</select></label>;
}

function TypeFields({ draft, setDraft, options }: { draft: FormState; setDraft: (value: FormState) => void; options: UtilityOptionsRecord }) {
  return (
    <>
      <TextField labelText="Type code" value={draft.typeCode} onChange={(value) => update(setDraft, draft, "typeCode", value)} />
      <TextField labelText="Type name" value={draft.typeName} onChange={(value) => update(setDraft, draft, "typeName", value)} />
      <SelectField labelText="Category" value={draft.category} onChange={(value) => update(setDraft, draft, "category", value)}>{options.categories.map((item) => <option key={item} value={item}>{label(item)}</option>)}</SelectField>
      <SelectField labelText="Billing method" value={draft.billingMethod} onChange={(value) => update(setDraft, draft, "billingMethod", value)}>{options.billingMethods.map((item) => <option key={item} value={item}>{label(item)}</option>)}</SelectField>
      <SelectField labelText="Unit of measure" value={draft.unitOfMeasure} onChange={(value) => update(setDraft, draft, "unitOfMeasure", value)}><option value="">Not set</option>{options.unitsOfMeasure.map((item) => <option key={item} value={item}>{label(item)}</option>)}</SelectField>
      <TextField labelText="Default rate" type="number" value={draft.defaultRate} onChange={(value) => update(setDraft, draft, "defaultRate", value)} />
      <TextField labelText="Fixed charge" type="number" value={draft.fixedCharge} onChange={(value) => update(setDraft, draft, "fixedCharge", value)} />
      <SelectField labelText="Common area utility" value={draft.commonArea} onChange={(value) => update(setDraft, draft, "commonArea", value)}><option value="false">No</option><option value="true">Yes</option></SelectField>
      <SelectField labelText="Status" value={draft.status} onChange={(value) => update(setDraft, draft, "status", value)}>{options.utilityTypeStatuses.map((item) => <option key={item} value={item}>{label(item)}</option>)}</SelectField>
      <TextField labelText="Description" value={draft.description} onChange={(value) => update(setDraft, draft, "description", value)} />
    </>
  );
}

function ReadingFields({ draft, setDraft, options, types, properties, units, tenants }: { draft: FormState; setDraft: (value: FormState) => void; options: UtilityOptionsRecord; types: UtilityTypeRecord[]; properties: PropertyRecord[]; units: UnitRecord[]; tenants: TenantRecord[] }) {
  return (
    <>
      <TextField labelText="Reading number" value={draft.readingNumber} onChange={(value) => update(setDraft, draft, "readingNumber", value)} />
      <SelectField labelText="Utility type" value={draft.utilityTypeId} onChange={(value) => update(setDraft, draft, "utilityTypeId", value)}><option value="">Select utility</option>{types.map((item) => <option key={item.id} value={item.id}>{item.typeName}</option>)}</SelectField>
      <SelectField labelText="Property" value={draft.propertyId} onChange={(value) => update(setDraft, { ...draft, unitId: "" }, "propertyId", value)}><option value="">Select property</option>{properties.map((item) => <option key={item.id} value={item.id}>{item.propertyName}</option>)}</SelectField>
      <SelectField labelText="Unit" value={draft.unitId} onChange={(value) => update(setDraft, draft, "unitId", value)}><option value="">Common/property meter</option>{units.map((item) => <option key={item.id} value={item.id}>{item.unitNumber}</option>)}</SelectField>
      <SelectField labelText="Tenant" value={draft.tenantId} onChange={(value) => update(setDraft, draft, "tenantId", value)}><option value="">Not mapped</option>{tenants.map((item) => <option key={item.id} value={item.id}>{item.displayName}</option>)}</SelectField>
      <TextField labelText="Meter number" value={draft.meterNumber} onChange={(value) => update(setDraft, draft, "meterNumber", value)} />
      <TextField labelText="Reading date" type="date" value={draft.readingDate} onChange={(value) => update(setDraft, draft, "readingDate", value)} />
      <TextField labelText="Previous reading" type="number" value={draft.previousReading} onChange={(value) => update(setDraft, draft, "previousReading", value)} />
      <TextField labelText="Current reading" type="number" value={draft.currentReading} onChange={(value) => update(setDraft, draft, "currentReading", value)} />
      <SelectField labelText="Common area reading" value={draft.commonArea} onChange={(value) => update(setDraft, draft, "commonArea", value)}><option value="false">No</option><option value="true">Yes</option></SelectField>
      <SelectField labelText="Status" value={draft.status} onChange={(value) => update(setDraft, draft, "status", value)}>{options.readingStatuses.map((item) => <option key={item} value={item}>{label(item)}</option>)}</SelectField>
      <TextField labelText="Remarks" value={draft.remarks} onChange={(value) => update(setDraft, draft, "remarks", value)} />
    </>
  );
}

function BillFields({ draft, setDraft, options, types, readings, properties, units, tenants }: { draft: FormState; setDraft: (value: FormState) => void; options: UtilityOptionsRecord; types: UtilityTypeRecord[]; readings: MeterReadingRecord[]; properties: PropertyRecord[]; units: UnitRecord[]; tenants: TenantRecord[] }) {
  return (
    <>
      <TextField labelText="Bill number" value={draft.billNumber} onChange={(value) => update(setDraft, draft, "billNumber", value)} />
      <SelectField labelText="Utility type" value={draft.utilityTypeId} onChange={(value) => update(setDraft, draft, "utilityTypeId", value)}><option value="">Select utility</option>{types.map((item) => <option key={item.id} value={item.id}>{item.typeName}</option>)}</SelectField>
      <SelectField labelText="Meter reading" value={draft.meterReadingId} onChange={(value) => update(setDraft, draft, "meterReadingId", value)}><option value="">No reading</option>{readings.map((item) => <option key={item.id} value={item.id}>{item.readingNumber}</option>)}</SelectField>
      <SelectField labelText="Property" value={draft.propertyId} onChange={(value) => update(setDraft, { ...draft, unitId: "" }, "propertyId", value)}><option value="">Select property</option>{properties.map((item) => <option key={item.id} value={item.id}>{item.propertyName}</option>)}</SelectField>
      <SelectField labelText="Unit" value={draft.unitId} onChange={(value) => update(setDraft, draft, "unitId", value)}><option value="">Common/property bill</option>{units.map((item) => <option key={item.id} value={item.id}>{item.unitNumber}</option>)}</SelectField>
      <SelectField labelText="Tenant" value={draft.tenantId} onChange={(value) => update(setDraft, draft, "tenantId", value)}><option value="">Not mapped</option>{tenants.map((item) => <option key={item.id} value={item.id}>{item.displayName}</option>)}</SelectField>
      <TextField labelText="Bill date" type="date" value={draft.billDate} onChange={(value) => update(setDraft, draft, "billDate", value)} />
      <TextField labelText="Due date" type="date" value={draft.dueDate} onChange={(value) => update(setDraft, draft, "dueDate", value)} />
      <TextField labelText="Period start" type="date" value={draft.billingPeriodStart} onChange={(value) => update(setDraft, draft, "billingPeriodStart", value)} />
      <TextField labelText="Period end" type="date" value={draft.billingPeriodEnd} onChange={(value) => update(setDraft, draft, "billingPeriodEnd", value)} />
      <SelectField labelText="Billing method" value={draft.billingMethod} onChange={(value) => update(setDraft, draft, "billingMethod", value)}>{options.billingMethods.map((item) => <option key={item} value={item}>{label(item)}</option>)}</SelectField>
      <TextField labelText="Consumption" type="number" value={draft.consumption} onChange={(value) => update(setDraft, draft, "consumption", value)} />
      <TextField labelText="Rate" type="number" value={draft.rate} onChange={(value) => update(setDraft, draft, "rate", value)} />
      <TextField labelText="Fixed charge" type="number" value={draft.fixedCharge} onChange={(value) => update(setDraft, draft, "fixedCharge", value)} />
      <TextField labelText="Common area amount" type="number" value={draft.commonAreaAmount} onChange={(value) => update(setDraft, draft, "commonAreaAmount", value)} />
      <TextField labelText="Tax amount" type="number" value={draft.taxAmount} onChange={(value) => update(setDraft, draft, "taxAmount", value)} />
      <TextField labelText="Paid amount" type="number" value={draft.paidAmount} onChange={(value) => update(setDraft, draft, "paidAmount", value)} />
      <SelectField labelText="Status" value={draft.status} onChange={(value) => update(setDraft, draft, "status", value)}>{options.billStatuses.map((item) => <option key={item} value={item}>{label(item)}</option>)}</SelectField>
      <TextField labelText="Remarks" value={draft.remarks} onChange={(value) => update(setDraft, draft, "remarks", value)} />
    </>
  );
}
