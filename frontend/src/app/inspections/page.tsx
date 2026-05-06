"use client";

import axios from "axios";
import type { ChangeEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { CompanyContextBanner } from "@/components/common/company-context-banner";
import { DataTable } from "@/components/common/data-table";
import { SectionCard } from "@/components/common/section-card";
import { SidebarDrawer } from "@/components/common/sidebar-drawer";
import { AppShell } from "@/components/layout/app-shell";
import { inspectionApi, leaseApi, propertyApi, tenantApi, unitApi } from "@/lib/api";
import type { InspectionAttachmentRecord, InspectionChecklistItemRecord, InspectionOptionsRecord, InspectionRecord, LeaseRecord, PropertyRecord, TenantRecord, UnitRecord } from "@/lib/types";
import { useIsClient } from "@/hooks/use-is-client";
import { useAppStore } from "@/store/app-store";

type FormState = {
  inspectionNumber: string;
  inspectionType: string;
  propertyId: string;
  unitId: string;
  leaseId: string;
  tenantId: string;
  scheduledDate: string;
  inspectionDate: string;
  inspectorName: string;
  overallCondition: string;
  damageStatus: string;
  estimatedRepairCost: string;
  checklist: InspectionChecklistItemRecord[];
  photoAttachments: InspectionAttachmentRecord[];
  damageNotes: string;
  tenantAcknowledgementStatus: string;
  tenantAcknowledgedBy: string;
  status: string;
  remarks: string;
};

const defaultOptions: InspectionOptionsRecord = {
  inspectionTypes: ["MOVE_IN", "MOVE_OUT", "PERIODIC", "SPECIAL"],
  conditionStatuses: ["EXCELLENT", "GOOD", "FAIR", "POOR", "DAMAGED", "NOT_APPLICABLE"],
  damageStatuses: ["NONE", "MINOR", "MODERATE", "MAJOR", "CRITICAL"],
  acknowledgementStatuses: ["NOT_REQUIRED", "PENDING", "ACKNOWLEDGED", "DISPUTED"],
  inspectionStatuses: ["DRAFT", "SCHEDULED", "SUBMITTED", "COMPLETED", "CANCELLED"],
};

const defaultChecklist: InspectionChecklistItemRecord[] = [
  { itemName: "Walls and paint", conditionStatus: "GOOD", damaged: false, damageDescription: null, estimatedRepairCost: null, remarks: null },
  { itemName: "Flooring", conditionStatus: "GOOD", damaged: false, damageDescription: null, estimatedRepairCost: null, remarks: null },
  { itemName: "Electrical fixtures", conditionStatus: "GOOD", damaged: false, damageDescription: null, estimatedRepairCost: null, remarks: null },
  { itemName: "Plumbing fixtures", conditionStatus: "GOOD", damaged: false, damageDescription: null, estimatedRepairCost: null, remarks: null },
];

const defaultForm: FormState = {
  inspectionNumber: "",
  inspectionType: "MOVE_IN",
  propertyId: "",
  unitId: "",
  leaseId: "",
  tenantId: "",
  scheduledDate: "",
  inspectionDate: "",
  inspectorName: "",
  overallCondition: "GOOD",
  damageStatus: "NONE",
  estimatedRepairCost: "",
  checklist: defaultChecklist,
  photoAttachments: [],
  damageNotes: "",
  tenantAcknowledgementStatus: "PENDING",
  tenantAcknowledgedBy: "",
  status: "DRAFT",
  remarks: "",
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

function readFileAsDataUrl(file: File) {
  return new Promise<InspectionAttachmentRecord>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("File could not be read."));
        return;
      }
      resolve({ fileName: file.name, contentType: file.type || "application/octet-stream", dataUrl: reader.result, fileSize: file.size });
    };
    reader.onerror = () => reject(new Error(`File ${file.name} could not be read.`));
    reader.readAsDataURL(file);
  });
}

export default function InspectionsPage() {
  const isClient = useIsClient();
  const { accessToken, hasHydrated, user } = useAppStore();
  const [options, setOptions] = useState<InspectionOptionsRecord>(defaultOptions);
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [units, setUnits] = useState<UnitRecord[]>([]);
  const [leases, setLeases] = useState<LeaseRecord[]>([]);
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [draft, setDraft] = useState<FormState>(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const activeCompany = user?.activeCompany;
  const filteredUnits = useMemo(() => units.filter((unit) => !draft.propertyId || unit.propertyId === draft.propertyId), [draft.propertyId, units]);
  const filteredLeases = useMemo(() => leases.filter((lease) => !draft.unitId || lease.unitId === draft.unitId).filter((lease) => !draft.propertyId || lease.propertyId === draft.propertyId), [draft.propertyId, draft.unitId, leases]);
  const repairCost = useMemo(() => draft.checklist.reduce((sum, item) => sum + (item.estimatedRepairCost ?? 0), 0), [draft.checklist]);

  async function loadAll() {
    const [optionResponse, inspectionResponse, propertyResponse, unitResponse, leaseResponse, tenantResponse] = await Promise.all([
      inspectionApi.getOptions(),
      inspectionApi.getInspections(),
      propertyApi.getProperties(),
      unitApi.getUnits(),
      leaseApi.getLeases(),
      tenantApi.getTenants(),
    ]);
    setOptions(optionResponse.data.data as InspectionOptionsRecord);
    setInspections((inspectionResponse.data.data as Array<InspectionRecord & { id: number | string; companyId: number | string; propertyId: number | string; unitId: number | string | null; leaseId: number | string | null; tenantId: number | string | null }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), propertyId: String(item.propertyId), unitId: normalizeId(item.unitId), leaseId: normalizeId(item.leaseId), tenantId: normalizeId(item.tenantId), checklist: Array.isArray(item.checklist) ? item.checklist : [], photoAttachments: Array.isArray(item.photoAttachments) ? item.photoAttachments : [] })));
    setProperties((propertyResponse.data.data as Array<PropertyRecord & { id: number | string; companyId: number | string; branchId: number | string | null; propertyManagerUserId: number | string | null }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), branchId: normalizeId(item.branchId), propertyManagerUserId: normalizeId(item.propertyManagerUserId), documentAttachments: Array.isArray(item.documentAttachments) ? item.documentAttachments : [] })));
    setUnits((unitResponse.data.data as Array<UnitRecord & { id: number | string; companyId: number | string; propertyId: number | string; buildingId: number | string; floorId: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), propertyId: String(item.propertyId), buildingId: String(item.buildingId), floorId: String(item.floorId), photoAttachments: [], documentAttachments: [] })));
    setLeases((leaseResponse.data.data as Array<LeaseRecord & { id: number | string; companyId: number | string; tenantId: number | string; propertyId: number | string; unitId: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), tenantId: String(item.tenantId), propertyId: String(item.propertyId), unitId: String(item.unitId) })));
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
        if (!cancelled) setError(readError(loadError, "Inspection data could not be loaded."));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [accessToken, hasHydrated, isClient]);

  function openCreate() {
    setDraft({ ...defaultForm, checklist: defaultChecklist.map((item) => ({ ...item })) });
    setEditingId(null);
    setFormError(null);
    setDrawerOpen(true);
  }

  function openEdit(row: InspectionRecord) {
    setEditingId(row.id);
    setFormError(null);
    setDraft({
      inspectionNumber: row.inspectionNumber,
      inspectionType: row.inspectionType,
      propertyId: row.propertyId,
      unitId: row.unitId ?? "",
      leaseId: row.leaseId ?? "",
      tenantId: row.tenantId ?? "",
      scheduledDate: row.scheduledDate ?? "",
      inspectionDate: row.inspectionDate,
      inspectorName: row.inspectorName ?? "",
      overallCondition: row.overallCondition,
      damageStatus: row.damageStatus,
      estimatedRepairCost: String(row.estimatedRepairCost ?? ""),
      checklist: row.checklist.length ? row.checklist : defaultChecklist.map((item) => ({ ...item })),
      photoAttachments: row.photoAttachments,
      damageNotes: row.damageNotes ?? "",
      tenantAcknowledgementStatus: row.tenantAcknowledgementStatus,
      tenantAcknowledgedBy: row.tenantAcknowledgedBy ?? "",
      status: row.status,
      remarks: row.remarks ?? "",
    });
    setDrawerOpen(true);
  }

  async function save() {
    try {
      setIsSaving(true);
      setFormError(null);
      const payload = {
        inspectionNumber: draft.inspectionNumber,
        inspectionType: draft.inspectionType,
        propertyId: Number(draft.propertyId),
        unitId: toId(draft.unitId),
        leaseId: toId(draft.leaseId),
        tenantId: toId(draft.tenantId),
        scheduledDate: draft.scheduledDate || null,
        inspectionDate: draft.inspectionDate,
        inspectorName: draft.inspectorName || null,
        overallCondition: draft.overallCondition,
        damageStatus: draft.damageStatus,
        estimatedRepairCost: toNumber(draft.estimatedRepairCost) ?? repairCost,
        checklist: draft.checklist,
        photoAttachments: draft.photoAttachments,
        damageNotes: draft.damageNotes || null,
        tenantAcknowledgementStatus: draft.tenantAcknowledgementStatus,
        tenantAcknowledgedBy: draft.tenantAcknowledgedBy || null,
        status: draft.status,
        remarks: draft.remarks || null,
      };
      if (editingId) await inspectionApi.updateInspection(editingId, payload);
      else await inspectionApi.createInspection(payload);
      await loadAll();
      setDrawerOpen(false);
    } catch (saveError: unknown) {
      setFormError(readError(saveError, "Inspection could not be saved."));
    } finally {
      setIsSaving(false);
    }
  }

  async function remove(id: string) {
    try {
      await inspectionApi.deleteInspection(id);
      await loadAll();
    } catch (deleteError: unknown) {
      setError(readError(deleteError, "Inspection could not be deleted."));
    }
  }

  async function action(id: string, mode: "submit" | "complete" | "acknowledge") {
    try {
      if (mode === "submit") await inspectionApi.submitInspection(id);
      if (mode === "complete") await inspectionApi.completeInspection(id);
      if (mode === "acknowledge") await inspectionApi.acknowledgeInspection(id);
      await loadAll();
    } catch (actionError: unknown) {
      setError(readError(actionError, "Inspection status could not be updated."));
    }
  }

  function updateChecklist(index: number, patch: Partial<InspectionChecklistItemRecord>) {
    setDraft({ ...draft, checklist: draft.checklist.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) });
  }

  function addChecklistItem() {
    setDraft({ ...draft, checklist: [...draft.checklist, { itemName: "", conditionStatus: "GOOD", damaged: false, damageDescription: null, estimatedRepairCost: null, remarks: null }] });
  }

  async function addPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    try {
      const attachments = await Promise.all(files.map(readFileAsDataUrl));
      setDraft({ ...draft, photoAttachments: [...draft.photoAttachments, ...attachments].slice(0, 20) });
    } catch {
      setFormError("One or more photos could not be read.");
    } finally {
      event.target.value = "";
    }
  }

  const stats = [
    { label: "Inspections", value: String(inspections.length), detail: "Move-in, move-out, and periodic" },
    { label: "Damaged", value: String(inspections.filter((item) => item.damageStatus !== "NONE").length), detail: "Inspections with damage" },
    { label: "Repair Estimate", value: money(inspections.reduce((sum, item) => sum + (item.estimatedRepairCost ?? 0), 0)), detail: "Tracked damage exposure" },
  ];

  const columns = [
    { key: "inspectionNumber", header: "Inspection", render: (row: InspectionRecord) => <div><div className="font-semibold">{row.inspectionNumber}</div><div className="text-xs text-[color:var(--foreground-muted)]">{label(row.inspectionType)} · {row.inspectionDate}</div></div> },
    { key: "location", header: "Location", render: (row: InspectionRecord) => `${row.propertyName ?? "Property"}${row.unitNumber ? ` / ${row.unitNumber}` : ""}` },
    { key: "tenantDisplayName", header: "Tenant", render: (row: InspectionRecord) => row.tenantDisplayName ?? "Not linked" },
    { key: "overallCondition", header: "Condition", render: (row: InspectionRecord) => label(row.overallCondition) },
    { key: "damageStatus", header: "Damage", render: (row: InspectionRecord) => label(row.damageStatus) },
    { key: "estimatedRepairCost", header: "Estimate", render: (row: InspectionRecord) => money(row.estimatedRepairCost) },
    { key: "ack", header: "Ack", render: (row: InspectionRecord) => label(row.tenantAcknowledgementStatus) },
    { key: "status", header: "Status", render: (row: InspectionRecord) => label(row.status) },
    { key: "actions", header: "Actions", render: (row: InspectionRecord) => <div className="flex flex-wrap gap-2"><ActionButton onClick={() => openEdit(row)}>Edit</ActionButton><ActionButton onClick={() => action(row.id, "complete")}>Complete</ActionButton><ActionButton onClick={() => action(row.id, "acknowledge")}>Ack</ActionButton><ActionButton danger onClick={() => remove(row.id)}>Delete</ActionButton></div> },
  ];

  return (
    <AppShell title="Inspection Management" subtitle="Condition inspections, damage tracking, photos, and tenant acknowledgement">
      <div className="space-y-6">
        <CompanyContextBanner companyName={activeCompany?.companyName ?? null} />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[color:var(--accent)]">Operations</p>
            <h1 className="text-3xl font-semibold tracking-tight">Inspection Management</h1>
            <p className="mt-2 max-w-3xl text-sm text-[color:var(--foreground-muted)]">Capture move-in, move-out, and periodic inspections with checklist conditions, photo evidence, damage estimates, and tenant acknowledgement.</p>
          </div>
          <button className="btn-primary rounded-full px-5 py-3 text-sm font-semibold" onClick={openCreate}>Add Inspection</button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <SectionCard key={stat.label} title={stat.label}>
              <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--foreground-subtle)]">{stat.label}</p>
              <p className="mt-3 text-3xl font-semibold">{stat.value}</p>
              <p className="mt-1 text-sm text-[color:var(--foreground-muted)]">{stat.detail}</p>
            </SectionCard>
          ))}
        </div>

        <SectionCard title="Inspection Register">
          {error ? <p className="mb-4 rounded-md border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-600">{error}</p> : null}
          {isLoading ? <p className="text-sm text-[color:var(--foreground-muted)]">Loading inspections...</p> : <DataTable columns={columns} rows={inspections} />}
        </SectionCard>
      </div>

      <SidebarDrawer open={drawerOpen} title={editingId ? "Edit inspection" : "New inspection"} onClose={() => setDrawerOpen(false)}>
        <div className="space-y-4">
          {formError ? <p className="rounded-md border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-600">{formError}</p> : null}
          <TextField labelText="Inspection number" value={draft.inspectionNumber} onChange={(value) => setDraft({ ...draft, inspectionNumber: value })} />
          <SelectField labelText="Inspection type" value={draft.inspectionType} onChange={(value) => setDraft({ ...draft, inspectionType: value })}>{options.inspectionTypes.map((item) => <option key={item} value={item}>{label(item)}</option>)}</SelectField>
          <SelectField labelText="Property" value={draft.propertyId} onChange={(value) => setDraft({ ...draft, propertyId: value, unitId: "", leaseId: "" })}><option value="">Select property</option>{properties.map((item) => <option key={item.id} value={item.id}>{item.propertyName}</option>)}</SelectField>
          <SelectField labelText="Unit" value={draft.unitId} onChange={(value) => setDraft({ ...draft, unitId: value, leaseId: "" })}><option value="">Property level</option>{filteredUnits.map((item) => <option key={item.id} value={item.id}>{item.unitNumber}</option>)}</SelectField>
          <SelectField labelText="Lease" value={draft.leaseId} onChange={(value) => setDraft({ ...draft, leaseId: value })}><option value="">No lease</option>{filteredLeases.map((item) => <option key={item.id} value={item.id}>{item.leaseNumber}</option>)}</SelectField>
          <SelectField labelText="Tenant" value={draft.tenantId} onChange={(value) => setDraft({ ...draft, tenantId: value })}><option value="">No tenant</option>{tenants.map((item) => <option key={item.id} value={item.id}>{item.displayName}</option>)}</SelectField>
          <TextField labelText="Scheduled date" type="date" value={draft.scheduledDate} onChange={(value) => setDraft({ ...draft, scheduledDate: value })} />
          <TextField labelText="Inspection date" type="date" value={draft.inspectionDate} onChange={(value) => setDraft({ ...draft, inspectionDate: value })} />
          <TextField labelText="Inspector" value={draft.inspectorName} onChange={(value) => setDraft({ ...draft, inspectorName: value })} />
          <SelectField labelText="Overall condition" value={draft.overallCondition} onChange={(value) => setDraft({ ...draft, overallCondition: value })}>{options.conditionStatuses.map((item) => <option key={item} value={item}>{label(item)}</option>)}</SelectField>
          <SelectField labelText="Damage status" value={draft.damageStatus} onChange={(value) => setDraft({ ...draft, damageStatus: value })}>{options.damageStatuses.map((item) => <option key={item} value={item}>{label(item)}</option>)}</SelectField>
          <TextField labelText="Estimated repair cost" type="number" value={draft.estimatedRepairCost} onChange={(value) => setDraft({ ...draft, estimatedRepairCost: value })} />
          <TextField labelText="Damage notes" value={draft.damageNotes} onChange={(value) => setDraft({ ...draft, damageNotes: value })} />
          <SelectField labelText="Tenant acknowledgement" value={draft.tenantAcknowledgementStatus} onChange={(value) => setDraft({ ...draft, tenantAcknowledgementStatus: value })}>{options.acknowledgementStatuses.map((item) => <option key={item} value={item}>{label(item)}</option>)}</SelectField>
          <TextField labelText="Acknowledged by" value={draft.tenantAcknowledgedBy} onChange={(value) => setDraft({ ...draft, tenantAcknowledgedBy: value })} />
          <SelectField labelText="Status" value={draft.status} onChange={(value) => setDraft({ ...draft, status: value })}>{options.inspectionStatuses.map((item) => <option key={item} value={item}>{label(item)}</option>)}</SelectField>

          <div className="rounded-2xl border border-line p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">Checklist</p>
              <button className="btn-secondary rounded-full px-3 py-1 text-xs" onClick={addChecklistItem}>Add item</button>
            </div>
            <div className="space-y-3">
              {draft.checklist.map((item, index) => (
                <div key={`${item.itemName}-${index}`} className="grid gap-2 rounded-xl border border-line p-3">
                  <TextField labelText="Item" value={item.itemName} onChange={(value) => updateChecklist(index, { itemName: value })} />
                  <SelectField labelText="Condition" value={item.conditionStatus} onChange={(value) => updateChecklist(index, { conditionStatus: value })}>{options.conditionStatuses.map((option) => <option key={option} value={option}>{label(option)}</option>)}</SelectField>
                  <SelectField labelText="Damaged" value={item.damaged ? "true" : "false"} onChange={(value) => updateChecklist(index, { damaged: value === "true" })}><option value="false">No</option><option value="true">Yes</option></SelectField>
                  <TextField labelText="Damage description" value={item.damageDescription ?? ""} onChange={(value) => updateChecklist(index, { damageDescription: value || null })} />
                  <TextField labelText="Repair estimate" type="number" value={item.estimatedRepairCost == null ? "" : String(item.estimatedRepairCost)} onChange={(value) => updateChecklist(index, { estimatedRepairCost: toNumber(value) })} />
                </div>
              ))}
            </div>
          </div>

          <label className="block text-sm font-medium">Photos<input className="field mt-1 w-full rounded-2xl px-3 py-2" type="file" accept="image/*" multiple onChange={addPhotos} /></label>
          <p className="text-xs text-[color:var(--foreground-muted)]">{draft.photoAttachments.length} photo(s) attached</p>
          <TextField labelText="Remarks" value={draft.remarks} onChange={(value) => setDraft({ ...draft, remarks: value })} />
          <button className="btn-primary w-full rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-60" disabled={isSaving} onClick={save}>{isSaving ? "Saving..." : "Save"}</button>
        </div>
      </SidebarDrawer>
    </AppShell>
  );
}

function ActionButton({ children, danger, onClick }: { children: string; danger?: boolean; onClick: () => void }) {
  return <button className={`btn-secondary rounded-full px-3 py-1 text-xs ${danger ? "text-red-600" : ""}`} onClick={onClick}>{children}</button>;
}

function TextField({ labelText, value, onChange, type = "text" }: { labelText: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="block text-sm font-medium">{labelText}<input className="field mt-1 w-full rounded-2xl px-3 py-2" type={type} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function SelectField({ labelText, value, onChange, children }: { labelText: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <label className="block text-sm font-medium">{labelText}<select className="field mt-1 w-full rounded-2xl px-3 py-2" value={value} onChange={(event) => onChange(event.target.value)}>{children}</select></label>;
}
