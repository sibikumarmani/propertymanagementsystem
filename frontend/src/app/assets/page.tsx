"use client";

import axios from "axios";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { CompanyContextBanner } from "@/components/common/company-context-banner";
import { DataTable } from "@/components/common/data-table";
import { SectionCard } from "@/components/common/section-card";
import { SidebarDrawer } from "@/components/common/sidebar-drawer";
import { AppShell } from "@/components/layout/app-shell";
import { assetApi, buildingApi, propertyApi, unitApi, vendorApi } from "@/lib/api";
import type { AssetMaintenanceScheduleRecord, AssetOptionsRecord, AssetRecord, AssetServiceHistoryRecord, BuildingRecord, PropertyRecord, UnitRecord, VendorRecord } from "@/lib/types";
import { useIsClient } from "@/hooks/use-is-client";
import { useAppStore } from "@/store/app-store";

type ActiveTab = "assets" | "schedules" | "history";
type FormState = Record<string, string>;

const defaultOptions: AssetOptionsRecord = {
  assetCategories: ["LIFT", "GENERATOR", "HVAC", "PUMP", "CCTV", "FIRE_EXTINGUISHER", "FURNITURE", "ELECTRICAL_PANEL", "OTHER"],
  conditionStatuses: ["NEW", "GOOD", "FAIR", "POOR", "UNDER_REPAIR", "OUT_OF_SERVICE", "RETIRED"],
  maintenanceFrequencies: ["NONE", "WEEKLY", "MONTHLY", "QUARTERLY", "HALF_YEARLY", "YEARLY"],
  assetStatuses: ["ACTIVE", "INACTIVE", "UNDER_REPAIR", "RETIRED", "DISPOSED"],
  maintenanceTypes: ["PREVENTIVE", "CORRECTIVE", "INSPECTION", "WARRANTY_SERVICE", "EMERGENCY_REPAIR"],
  priorities: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
  scheduleStatuses: ["SCHEDULED", "DUE", "IN_PROGRESS", "COMPLETED", "OVERDUE", "CANCELLED"],
  serviceStatuses: ["COMPLETED", "PARTIALLY_COMPLETED", "FAILED", "CANCELLED"],
};

const defaults: Record<ActiveTab, FormState> = {
  assets: { assetCode: "", assetName: "", assetCategory: "LIFT", propertyId: "", buildingId: "", unitId: "", serialNumber: "", manufacturer: "", modelNumber: "", purchaseDate: "", purchaseCost: "", installationDate: "", conditionStatus: "GOOD", warrantyProvider: "", warrantyStartDate: "", warrantyEndDate: "", warrantyTerms: "", maintenanceFrequency: "MONTHLY", nextMaintenanceDate: "", status: "ACTIVE", remarks: "" },
  schedules: { scheduleNumber: "", assetId: "", maintenanceType: "PREVENTIVE", frequency: "MONTHLY", plannedDate: "", assignedVendorId: "", estimatedCost: "", priority: "MEDIUM", status: "SCHEDULED", remarks: "" },
  history: { serviceNumber: "", assetId: "", maintenanceScheduleId: "", serviceDate: "", serviceType: "PREVENTIVE", vendorId: "", technicianName: "", conditionBefore: "", conditionAfter: "GOOD", workPerformed: "", partsReplaced: "", serviceCost: "", nextServiceDate: "", status: "COMPLETED", remarks: "" },
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

function toId(value: string) {
  return value ? Number(value) : null;
}

function toNumber(value: string) {
  if (!value.trim()) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function money(value: number | null | undefined) {
  return value == null ? "0" : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function AssetsPage() {
  const isClient = useIsClient();
  const { accessToken, hasHydrated, user } = useAppStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>("assets");
  const [options, setOptions] = useState<AssetOptionsRecord>(defaultOptions);
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [schedules, setSchedules] = useState<AssetMaintenanceScheduleRecord[]>([]);
  const [history, setHistory] = useState<AssetServiceHistoryRecord[]>([]);
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [buildings, setBuildings] = useState<BuildingRecord[]>([]);
  const [units, setUnits] = useState<UnitRecord[]>([]);
  const [vendors, setVendors] = useState<VendorRecord[]>([]);
  const [draft, setDraft] = useState<FormState>(defaults.assets);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const activeCompany = user?.activeCompany;
  const filteredBuildings = useMemo(() => buildings.filter((building) => !draft.propertyId || building.propertyId === draft.propertyId), [buildings, draft.propertyId]);
  const filteredUnits = useMemo(() => units.filter((unit) => !draft.propertyId || unit.propertyId === draft.propertyId).filter((unit) => !draft.buildingId || unit.buildingId === draft.buildingId), [draft.buildingId, draft.propertyId, units]);
  const filteredSchedules = useMemo(() => schedules.filter((schedule) => !draft.assetId || schedule.assetId === draft.assetId), [draft.assetId, schedules]);

  async function loadAll() {
    const [optionResponse, assetResponse, scheduleResponse, historyResponse, propertyResponse, buildingResponse, unitResponse, vendorResponse] = await Promise.all([
      assetApi.getOptions(),
      assetApi.getAssets(),
      assetApi.getSchedules(),
      assetApi.getServiceHistory(),
      propertyApi.getProperties(),
      buildingApi.getBuildings(),
      unitApi.getUnits(),
      vendorApi.getVendors(),
    ]);
    setOptions(optionResponse.data.data as AssetOptionsRecord);
    setAssets((assetResponse.data.data as Array<AssetRecord & { id: number | string; companyId: number | string; propertyId: number | string; buildingId: number | string | null; unitId: number | string | null }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), propertyId: String(item.propertyId), buildingId: normalizeId(item.buildingId), unitId: normalizeId(item.unitId) })));
    setSchedules((scheduleResponse.data.data as Array<AssetMaintenanceScheduleRecord & { id: number | string; companyId: number | string; assetId: number | string; assignedVendorId: number | string | null }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), assetId: String(item.assetId), assignedVendorId: normalizeId(item.assignedVendorId) })));
    setHistory((historyResponse.data.data as Array<AssetServiceHistoryRecord & { id: number | string; companyId: number | string; assetId: number | string; maintenanceScheduleId: number | string | null; vendorId: number | string | null }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), assetId: String(item.assetId), maintenanceScheduleId: normalizeId(item.maintenanceScheduleId), vendorId: normalizeId(item.vendorId) })));
    setProperties((propertyResponse.data.data as Array<PropertyRecord & { id: number | string; companyId: number | string; branchId: number | string | null; propertyManagerUserId: number | string | null }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), branchId: normalizeId(item.branchId), propertyManagerUserId: normalizeId(item.propertyManagerUserId), documentAttachments: Array.isArray(item.documentAttachments) ? item.documentAttachments : [] })));
    setBuildings((buildingResponse.data.data as Array<BuildingRecord & { id: number | string; companyId: number | string; propertyId: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), propertyId: String(item.propertyId) })));
    setUnits((unitResponse.data.data as Array<UnitRecord & { id: number | string; companyId: number | string; propertyId: number | string; buildingId: number | string; floorId: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), propertyId: String(item.propertyId), buildingId: String(item.buildingId), floorId: String(item.floorId), photoAttachments: [], documentAttachments: [] })));
    setVendors((vendorResponse.data.data as Array<VendorRecord & { id: number | string; companyId: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId) })));
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
        if (!cancelled) setError(readError(loadError, "Asset management data could not be loaded."));
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

  function openEdit(row: AssetRecord | AssetMaintenanceScheduleRecord | AssetServiceHistoryRecord) {
    setEditingId(row.id);
    setFormError(null);
    setDraft({ ...defaults[activeTab], ...Object.fromEntries(Object.entries(row).map(([key, value]) => [key, value == null ? "" : String(value)])) });
    setDrawerOpen(true);
  }

  async function save() {
    try {
      setIsSaving(true);
      setFormError(null);
      if (activeTab === "assets") {
        const payload = { assetCode: draft.assetCode, assetName: draft.assetName, assetCategory: draft.assetCategory, propertyId: Number(draft.propertyId), buildingId: toId(draft.buildingId), unitId: toId(draft.unitId), serialNumber: draft.serialNumber || null, manufacturer: draft.manufacturer || null, modelNumber: draft.modelNumber || null, purchaseDate: draft.purchaseDate || null, purchaseCost: toNumber(draft.purchaseCost), installationDate: draft.installationDate || null, conditionStatus: draft.conditionStatus, warrantyProvider: draft.warrantyProvider || null, warrantyStartDate: draft.warrantyStartDate || null, warrantyEndDate: draft.warrantyEndDate || null, warrantyTerms: draft.warrantyTerms || null, maintenanceFrequency: draft.maintenanceFrequency || null, nextMaintenanceDate: draft.nextMaintenanceDate || null, status: draft.status, remarks: draft.remarks || null };
        if (editingId) await assetApi.updateAsset(editingId, payload);
        else await assetApi.createAsset(payload);
      }
      if (activeTab === "schedules") {
        const payload = { scheduleNumber: draft.scheduleNumber, assetId: Number(draft.assetId), maintenanceType: draft.maintenanceType, frequency: draft.frequency, plannedDate: draft.plannedDate, assignedVendorId: toId(draft.assignedVendorId), estimatedCost: toNumber(draft.estimatedCost), priority: draft.priority, status: draft.status, remarks: draft.remarks || null };
        if (editingId) await assetApi.updateSchedule(editingId, payload);
        else await assetApi.createSchedule(payload);
      }
      if (activeTab === "history") {
        const payload = { serviceNumber: draft.serviceNumber, assetId: Number(draft.assetId), maintenanceScheduleId: toId(draft.maintenanceScheduleId), serviceDate: draft.serviceDate, serviceType: draft.serviceType, vendorId: toId(draft.vendorId), technicianName: draft.technicianName || null, conditionBefore: draft.conditionBefore || null, conditionAfter: draft.conditionAfter, workPerformed: draft.workPerformed, partsReplaced: draft.partsReplaced || null, serviceCost: toNumber(draft.serviceCost), nextServiceDate: draft.nextServiceDate || null, status: draft.status, remarks: draft.remarks || null };
        if (editingId) await assetApi.updateServiceHistory(editingId, payload);
        else await assetApi.createServiceHistory(payload);
      }
      await loadAll();
      setDrawerOpen(false);
    } catch (saveError: unknown) {
      setFormError(readError(saveError, "Asset record could not be saved."));
    } finally {
      setIsSaving(false);
    }
  }

  async function remove(id: string) {
    try {
      if (activeTab === "assets") await assetApi.deleteAsset(id);
      if (activeTab === "schedules") await assetApi.deleteSchedule(id);
      if (activeTab === "history") await assetApi.deleteServiceHistory(id);
      await loadAll();
    } catch (deleteError: unknown) {
      setError(readError(deleteError, "Asset record could not be deleted."));
    }
  }

  async function updateScheduleStatus(id: string, action: "complete" | "cancel") {
    try {
      if (action === "complete") await assetApi.completeSchedule(id);
      else await assetApi.cancelSchedule(id);
      await loadAll();
    } catch (statusError: unknown) {
      setError(readError(statusError, "Asset schedule status could not be updated."));
    }
  }

  const statCards = [
    { label: "Assets", value: String(assets.length), detail: "Tracked property equipment" },
    { label: "Due Schedules", value: String(schedules.filter((item) => ["SCHEDULED", "DUE", "OVERDUE"].includes(item.status)).length), detail: "Upcoming maintenance work" },
    { label: "Service Spend", value: money(history.reduce((sum, item) => sum + (item.serviceCost ?? 0), 0)), detail: "Recorded service history" },
  ];

  const assetColumns = [
    { key: "assetName", header: "Asset", render: (row: AssetRecord) => <div><div className="font-semibold">{row.assetName}</div><div className="text-xs text-[color:var(--foreground-muted)]">{row.assetCode} · {label(row.assetCategory)}</div></div> },
    { key: "location", header: "Location", render: (row: AssetRecord) => `${row.propertyName ?? "Property"}${row.buildingName ? ` / ${row.buildingName}` : ""}${row.unitNumber ? ` / ${row.unitNumber}` : ""}` },
    { key: "conditionStatus", header: "Condition", render: (row: AssetRecord) => label(row.conditionStatus) },
    { key: "warrantyEndDate", header: "Warranty", render: (row: AssetRecord) => row.warrantyEndDate ?? "Not set" },
    { key: "nextMaintenanceDate", header: "Next Service", render: (row: AssetRecord) => row.nextMaintenanceDate ?? "Not set" },
    { key: "status", header: "Status", render: (row: AssetRecord) => label(row.status) },
    { key: "actions", header: "Actions", render: (row: AssetRecord) => <ActionButtons onEdit={() => openEdit(row)} onDelete={() => remove(row.id)} /> },
  ];
  const scheduleColumns = [
    { key: "scheduleNumber", header: "Schedule", render: (row: AssetMaintenanceScheduleRecord) => <div><div className="font-semibold">{row.scheduleNumber}</div><div className="text-xs text-[color:var(--foreground-muted)]">{row.plannedDate}</div></div> },
    { key: "assetName", header: "Asset", render: (row: AssetMaintenanceScheduleRecord) => row.assetName ?? row.assetCode ?? "Asset" },
    { key: "maintenanceType", header: "Type", render: (row: AssetMaintenanceScheduleRecord) => label(row.maintenanceType) },
    { key: "assignedVendorName", header: "Vendor", render: (row: AssetMaintenanceScheduleRecord) => row.assignedVendorName ?? "Not assigned" },
    { key: "estimatedCost", header: "Cost", render: (row: AssetMaintenanceScheduleRecord) => money(row.estimatedCost) },
    { key: "status", header: "Status", render: (row: AssetMaintenanceScheduleRecord) => label(row.status) },
    { key: "actions", header: "Actions", render: (row: AssetMaintenanceScheduleRecord) => <div className="flex flex-wrap gap-2"><ActionButtons onEdit={() => openEdit(row)} onDelete={() => remove(row.id)} /><button className="btn-secondary rounded-full px-3 py-1 text-xs" onClick={() => updateScheduleStatus(row.id, "complete")}>Complete</button></div> },
  ];
  const historyColumns = [
    { key: "serviceNumber", header: "Service", render: (row: AssetServiceHistoryRecord) => <div><div className="font-semibold">{row.serviceNumber}</div><div className="text-xs text-[color:var(--foreground-muted)]">{row.serviceDate}</div></div> },
    { key: "assetName", header: "Asset", render: (row: AssetServiceHistoryRecord) => row.assetName ?? row.assetCode ?? "Asset" },
    { key: "serviceType", header: "Type", render: (row: AssetServiceHistoryRecord) => label(row.serviceType) },
    { key: "vendorName", header: "Vendor", render: (row: AssetServiceHistoryRecord) => row.vendorName ?? "Internal" },
    { key: "conditionAfter", header: "Condition", render: (row: AssetServiceHistoryRecord) => label(row.conditionAfter) },
    { key: "serviceCost", header: "Cost", render: (row: AssetServiceHistoryRecord) => money(row.serviceCost) },
    { key: "actions", header: "Actions", render: (row: AssetServiceHistoryRecord) => <ActionButtons onEdit={() => openEdit(row)} onDelete={() => remove(row.id)} /> },
  ];

  return (
    <AppShell title="Asset Management" subtitle="Property equipment, warranty, maintenance schedules, and service history">
      <div className="space-y-6">
        <CompanyContextBanner companyName={activeCompany?.companyName ?? null} />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[color:var(--accent)]">Operations</p>
            <h1 className="text-3xl font-semibold tracking-tight">Asset Management</h1>
            <p className="mt-2 max-w-3xl text-sm text-[color:var(--foreground-muted)]">Manage lifts, generators, HVAC, pumps, CCTV, fire extinguishers, furniture, panels, warranties, planned maintenance, and service history.</p>
          </div>
          <button className="btn-primary rounded-full px-5 py-3 text-sm font-semibold" onClick={openCreate}>Add {activeTab === "assets" ? "Asset" : activeTab === "schedules" ? "Schedule" : "Service Record"}</button>
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

        <SectionCard title="Asset Register">
          <div className="mb-5 flex flex-wrap gap-2">
            {(["assets", "schedules", "history"] as ActiveTab[]).map((tab) => (
              <button key={tab} className={`${activeTab === tab ? "btn-primary" : "btn-secondary"} rounded-full px-4 py-2 text-sm font-semibold`} onClick={() => switchTab(tab)}>
                {tab === "assets" ? "Assets" : tab === "schedules" ? "Maintenance Schedules" : "Service History"}
              </button>
            ))}
          </div>
          {error ? <p className="mb-4 rounded-md border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-600">{error}</p> : null}
          {isLoading ? <p className="text-sm text-[color:var(--foreground-muted)]">Loading asset data...</p> : null}
          {!isLoading && activeTab === "assets" ? <DataTable columns={assetColumns} rows={assets} /> : null}
          {!isLoading && activeTab === "schedules" ? <DataTable columns={scheduleColumns} rows={schedules} /> : null}
          {!isLoading && activeTab === "history" ? <DataTable columns={historyColumns} rows={history} /> : null}
        </SectionCard>
      </div>

      <SidebarDrawer open={drawerOpen} title={editingId ? "Edit asset record" : "New asset record"} onClose={() => setDrawerOpen(false)}>
        <div className="space-y-4">
          {formError ? <p className="rounded-md border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-600">{formError}</p> : null}
          {activeTab === "assets" ? <AssetFields draft={draft} setDraft={setDraft} options={options} properties={properties} buildings={filteredBuildings} units={filteredUnits} /> : null}
          {activeTab === "schedules" ? <ScheduleFields draft={draft} setDraft={setDraft} options={options} assets={assets} vendors={vendors} /> : null}
          {activeTab === "history" ? <HistoryFields draft={draft} setDraft={setDraft} options={options} assets={assets} schedules={filteredSchedules} vendors={vendors} /> : null}
          <button className="btn-primary w-full rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-60" disabled={isSaving} onClick={save}>{isSaving ? "Saving..." : "Save"}</button>
        </div>
      </SidebarDrawer>
    </AppShell>
  );
}

function ActionButtons({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return <div className="flex gap-2"><button className="btn-secondary rounded-full px-3 py-1 text-xs" onClick={onEdit}>Edit</button><button className="btn-secondary rounded-full px-3 py-1 text-xs text-red-600" onClick={onDelete}>Delete</button></div>;
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

function AssetFields({ draft, setDraft, options, properties, buildings, units }: { draft: FormState; setDraft: (value: FormState) => void; options: AssetOptionsRecord; properties: PropertyRecord[]; buildings: BuildingRecord[]; units: UnitRecord[] }) {
  return (
    <>
      <TextField labelText="Asset code" value={draft.assetCode} onChange={(value) => update(setDraft, draft, "assetCode", value)} />
      <TextField labelText="Asset name" value={draft.assetName} onChange={(value) => update(setDraft, draft, "assetName", value)} />
      <SelectField labelText="Category" value={draft.assetCategory} onChange={(value) => update(setDraft, draft, "assetCategory", value)}>{options.assetCategories.map((item) => <option key={item} value={item}>{label(item)}</option>)}</SelectField>
      <SelectField labelText="Property" value={draft.propertyId} onChange={(value) => setDraft({ ...draft, propertyId: value, buildingId: "", unitId: "" })}><option value="">Select property</option>{properties.map((item) => <option key={item.id} value={item.id}>{item.propertyName}</option>)}</SelectField>
      <SelectField labelText="Building" value={draft.buildingId} onChange={(value) => setDraft({ ...draft, buildingId: value, unitId: "" })}><option value="">Property level</option>{buildings.map((item) => <option key={item.id} value={item.id}>{item.buildingName}</option>)}</SelectField>
      <SelectField labelText="Unit" value={draft.unitId} onChange={(value) => update(setDraft, draft, "unitId", value)}><option value="">Shared/common asset</option>{units.map((item) => <option key={item.id} value={item.id}>{item.unitNumber}</option>)}</SelectField>
      <TextField labelText="Serial number" value={draft.serialNumber} onChange={(value) => update(setDraft, draft, "serialNumber", value)} />
      <TextField labelText="Manufacturer" value={draft.manufacturer} onChange={(value) => update(setDraft, draft, "manufacturer", value)} />
      <TextField labelText="Model number" value={draft.modelNumber} onChange={(value) => update(setDraft, draft, "modelNumber", value)} />
      <TextField labelText="Purchase date" type="date" value={draft.purchaseDate} onChange={(value) => update(setDraft, draft, "purchaseDate", value)} />
      <TextField labelText="Purchase cost" type="number" value={draft.purchaseCost} onChange={(value) => update(setDraft, draft, "purchaseCost", value)} />
      <TextField labelText="Installation date" type="date" value={draft.installationDate} onChange={(value) => update(setDraft, draft, "installationDate", value)} />
      <SelectField labelText="Condition" value={draft.conditionStatus} onChange={(value) => update(setDraft, draft, "conditionStatus", value)}>{options.conditionStatuses.map((item) => <option key={item} value={item}>{label(item)}</option>)}</SelectField>
      <TextField labelText="Warranty provider" value={draft.warrantyProvider} onChange={(value) => update(setDraft, draft, "warrantyProvider", value)} />
      <TextField labelText="Warranty start" type="date" value={draft.warrantyStartDate} onChange={(value) => update(setDraft, draft, "warrantyStartDate", value)} />
      <TextField labelText="Warranty end" type="date" value={draft.warrantyEndDate} onChange={(value) => update(setDraft, draft, "warrantyEndDate", value)} />
      <TextField labelText="Warranty terms" value={draft.warrantyTerms} onChange={(value) => update(setDraft, draft, "warrantyTerms", value)} />
      <SelectField labelText="Maintenance frequency" value={draft.maintenanceFrequency} onChange={(value) => update(setDraft, draft, "maintenanceFrequency", value)}>{options.maintenanceFrequencies.map((item) => <option key={item} value={item}>{label(item)}</option>)}</SelectField>
      <TextField labelText="Next maintenance date" type="date" value={draft.nextMaintenanceDate} onChange={(value) => update(setDraft, draft, "nextMaintenanceDate", value)} />
      <SelectField labelText="Status" value={draft.status} onChange={(value) => update(setDraft, draft, "status", value)}>{options.assetStatuses.map((item) => <option key={item} value={item}>{label(item)}</option>)}</SelectField>
      <TextField labelText="Remarks" value={draft.remarks} onChange={(value) => update(setDraft, draft, "remarks", value)} />
    </>
  );
}

function ScheduleFields({ draft, setDraft, options, assets, vendors }: { draft: FormState; setDraft: (value: FormState) => void; options: AssetOptionsRecord; assets: AssetRecord[]; vendors: VendorRecord[] }) {
  return (
    <>
      <TextField labelText="Schedule number" value={draft.scheduleNumber} onChange={(value) => update(setDraft, draft, "scheduleNumber", value)} />
      <SelectField labelText="Asset" value={draft.assetId} onChange={(value) => update(setDraft, draft, "assetId", value)}><option value="">Select asset</option>{assets.map((item) => <option key={item.id} value={item.id}>{item.assetName}</option>)}</SelectField>
      <SelectField labelText="Maintenance type" value={draft.maintenanceType} onChange={(value) => update(setDraft, draft, "maintenanceType", value)}>{options.maintenanceTypes.map((item) => <option key={item} value={item}>{label(item)}</option>)}</SelectField>
      <SelectField labelText="Frequency" value={draft.frequency} onChange={(value) => update(setDraft, draft, "frequency", value)}>{options.maintenanceFrequencies.map((item) => <option key={item} value={item}>{label(item)}</option>)}</SelectField>
      <TextField labelText="Planned date" type="date" value={draft.plannedDate} onChange={(value) => update(setDraft, draft, "plannedDate", value)} />
      <SelectField labelText="Vendor" value={draft.assignedVendorId} onChange={(value) => update(setDraft, draft, "assignedVendorId", value)}><option value="">Internal</option>{vendors.map((item) => <option key={item.id} value={item.id}>{item.vendorName}</option>)}</SelectField>
      <TextField labelText="Estimated cost" type="number" value={draft.estimatedCost} onChange={(value) => update(setDraft, draft, "estimatedCost", value)} />
      <SelectField labelText="Priority" value={draft.priority} onChange={(value) => update(setDraft, draft, "priority", value)}>{options.priorities.map((item) => <option key={item} value={item}>{label(item)}</option>)}</SelectField>
      <SelectField labelText="Status" value={draft.status} onChange={(value) => update(setDraft, draft, "status", value)}>{options.scheduleStatuses.map((item) => <option key={item} value={item}>{label(item)}</option>)}</SelectField>
      <TextField labelText="Remarks" value={draft.remarks} onChange={(value) => update(setDraft, draft, "remarks", value)} />
    </>
  );
}

function HistoryFields({ draft, setDraft, options, assets, schedules, vendors }: { draft: FormState; setDraft: (value: FormState) => void; options: AssetOptionsRecord; assets: AssetRecord[]; schedules: AssetMaintenanceScheduleRecord[]; vendors: VendorRecord[] }) {
  return (
    <>
      <TextField labelText="Service number" value={draft.serviceNumber} onChange={(value) => update(setDraft, draft, "serviceNumber", value)} />
      <SelectField labelText="Asset" value={draft.assetId} onChange={(value) => setDraft({ ...draft, assetId: value, maintenanceScheduleId: "" })}><option value="">Select asset</option>{assets.map((item) => <option key={item.id} value={item.id}>{item.assetName}</option>)}</SelectField>
      <SelectField labelText="Schedule" value={draft.maintenanceScheduleId} onChange={(value) => update(setDraft, draft, "maintenanceScheduleId", value)}><option value="">Unscheduled service</option>{schedules.map((item) => <option key={item.id} value={item.id}>{item.scheduleNumber}</option>)}</SelectField>
      <TextField labelText="Service date" type="date" value={draft.serviceDate} onChange={(value) => update(setDraft, draft, "serviceDate", value)} />
      <SelectField labelText="Service type" value={draft.serviceType} onChange={(value) => update(setDraft, draft, "serviceType", value)}>{options.maintenanceTypes.map((item) => <option key={item} value={item}>{label(item)}</option>)}</SelectField>
      <SelectField labelText="Vendor" value={draft.vendorId} onChange={(value) => update(setDraft, draft, "vendorId", value)}><option value="">Internal</option>{vendors.map((item) => <option key={item.id} value={item.id}>{item.vendorName}</option>)}</SelectField>
      <TextField labelText="Technician" value={draft.technicianName} onChange={(value) => update(setDraft, draft, "technicianName", value)} />
      <SelectField labelText="Condition before" value={draft.conditionBefore} onChange={(value) => update(setDraft, draft, "conditionBefore", value)}><option value="">Not set</option>{options.conditionStatuses.map((item) => <option key={item} value={item}>{label(item)}</option>)}</SelectField>
      <SelectField labelText="Condition after" value={draft.conditionAfter} onChange={(value) => update(setDraft, draft, "conditionAfter", value)}>{options.conditionStatuses.map((item) => <option key={item} value={item}>{label(item)}</option>)}</SelectField>
      <TextField labelText="Work performed" value={draft.workPerformed} onChange={(value) => update(setDraft, draft, "workPerformed", value)} />
      <TextField labelText="Parts replaced" value={draft.partsReplaced} onChange={(value) => update(setDraft, draft, "partsReplaced", value)} />
      <TextField labelText="Service cost" type="number" value={draft.serviceCost} onChange={(value) => update(setDraft, draft, "serviceCost", value)} />
      <TextField labelText="Next service date" type="date" value={draft.nextServiceDate} onChange={(value) => update(setDraft, draft, "nextServiceDate", value)} />
      <SelectField labelText="Status" value={draft.status} onChange={(value) => update(setDraft, draft, "status", value)}>{options.serviceStatuses.map((item) => <option key={item} value={item}>{label(item)}</option>)}</SelectField>
      <TextField labelText="Remarks" value={draft.remarks} onChange={(value) => update(setDraft, draft, "remarks", value)} />
    </>
  );
}
