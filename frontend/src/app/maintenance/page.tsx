"use client";

import axios from "axios";
import type { ChangeEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { CompanyContextBanner } from "@/components/common/company-context-banner";
import { DataTable } from "@/components/common/data-table";
import { SectionCard } from "@/components/common/section-card";
import { SidebarDrawer } from "@/components/common/sidebar-drawer";
import { AppShell } from "@/components/layout/app-shell";
import { maintenanceApi, propertyApi, tenantApi, unitApi, userApi, vendorApi } from "@/lib/api";
import type {
  MaintenanceAttachmentRecord,
  MaintenanceOptionsRecord,
  MaintenanceRequestRecord,
  MaintenanceWorkOrderRecord,
  PreventiveMaintenanceRecord,
  PropertyRecord,
  TenantRecord,
  UnitRecord,
  UserRecord,
  VendorRecord,
} from "@/lib/types";
import { useIsClient } from "@/hooks/use-is-client";
import { useAppStore } from "@/store/app-store";

type ActiveTab = "requests" | "workOrders" | "preventive";

type RequestFormState = {
  requestNumber: string;
  tenantId: string;
  propertyId: string;
  unitId: string;
  category: string;
  priority: string;
  description: string;
  assignedVendorId: string;
  assignedUserId: string;
  estimatedCost: string;
  actualCost: string;
  status: string;
  approvalStatus: string;
  attachments: MaintenanceAttachmentRecord[];
  completionRemarks: string;
};

type WorkOrderFormState = {
  workOrderNumber: string;
  maintenanceRequestId: string;
  vendorId: string;
  technicianUserId: string;
  materialsUsed: string;
  laborCharges: string;
  vendorInvoiceDocument: MaintenanceAttachmentRecord | null;
  completionRemarks: string;
  approvalStatus: string;
  status: string;
};

type PreventiveFormState = {
  scheduleNumber: string;
  propertyId: string;
  unitId: string;
  assetName: string;
  maintenanceType: string;
  recurrenceFrequency: string;
  nextDueDate: string;
  responsibleUserId: string;
  vendorId: string;
  notifyBeforeDays: string;
  completionStatus: string;
  lastCompletedDate: string;
  completionRemarks: string;
  status: string;
};

const defaultOptions: MaintenanceOptionsRecord = {
  requestStatuses: ["OPEN", "ASSIGNED", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CLOSED", "CANCELLED"],
  priorities: ["LOW", "MEDIUM", "HIGH", "EMERGENCY"],
  approvalStatuses: ["NOT_REQUIRED", "PENDING_APPROVAL", "APPROVED", "REJECTED"],
  workOrderStatuses: ["DRAFT", "ISSUED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
  preventiveFrequencies: ["WEEKLY", "MONTHLY", "QUARTERLY", "HALF_YEARLY", "YEARLY"],
  preventiveCompletionStatuses: ["SCHEDULED", "DUE", "COMPLETED", "OVERDUE", "SKIPPED"],
  preventiveStatuses: ["ACTIVE", "INACTIVE"],
};

const defaultRequestForm: RequestFormState = {
  requestNumber: "",
  tenantId: "",
  propertyId: "",
  unitId: "",
  category: "",
  priority: "MEDIUM",
  description: "",
  assignedVendorId: "",
  assignedUserId: "",
  estimatedCost: "",
  actualCost: "",
  status: "OPEN",
  approvalStatus: "NOT_REQUIRED",
  attachments: [],
  completionRemarks: "",
};

const defaultWorkOrderForm: WorkOrderFormState = {
  workOrderNumber: "",
  maintenanceRequestId: "",
  vendorId: "",
  technicianUserId: "",
  materialsUsed: "",
  laborCharges: "",
  vendorInvoiceDocument: null,
  completionRemarks: "",
  approvalStatus: "PENDING_APPROVAL",
  status: "DRAFT",
};

const defaultPreventiveForm: PreventiveFormState = {
  scheduleNumber: "",
  propertyId: "",
  unitId: "",
  assetName: "",
  maintenanceType: "",
  recurrenceFrequency: "MONTHLY",
  nextDueDate: "",
  responsibleUserId: "",
  vendorId: "",
  notifyBeforeDays: "3",
  completionStatus: "SCHEDULED",
  lastCompletedDate: "",
  completionRemarks: "",
  status: "ACTIVE",
};

function readError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error) && typeof error.response?.data?.message === "string") {
    return error.response.data.message;
  }
  return fallback;
}

function label(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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

function normalizeId(value: string | number | null | undefined) {
  return value == null ? null : String(value);
}

function formatMoney(value: number | null) {
  return value == null ? "Not set" : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function readFileAsDataUrl(file: File) {
  return new Promise<MaintenanceAttachmentRecord>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("File could not be read."));
        return;
      }
      resolve({
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
        dataUrl: reader.result,
        fileSize: file.size,
      });
    };
    reader.onerror = () => reject(new Error(`File ${file.name} could not be read.`));
    reader.readAsDataURL(file);
  });
}

export default function MaintenancePage() {
  const isClient = useIsClient();
  const { accessToken, hasHydrated, user } = useAppStore();
  const activeCompany = user?.activeCompany;

  const [activeTab, setActiveTab] = useState<ActiveTab>("requests");
  const [options, setOptions] = useState<MaintenanceOptionsRecord>(defaultOptions);
  const [requests, setRequests] = useState<MaintenanceRequestRecord[]>([]);
  const [workOrders, setWorkOrders] = useState<MaintenanceWorkOrderRecord[]>([]);
  const [preventiveSchedules, setPreventiveSchedules] = useState<PreventiveMaintenanceRecord[]>([]);
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [units, setUnits] = useState<UnitRecord[]>([]);
  const [vendors, setVendors] = useState<VendorRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [editingRequest, setEditingRequest] = useState<MaintenanceRequestRecord | null>(null);
  const [editingWorkOrder, setEditingWorkOrder] = useState<MaintenanceWorkOrderRecord | null>(null);
  const [editingPreventive, setEditingPreventive] = useState<PreventiveMaintenanceRecord | null>(null);
  const [requestDraft, setRequestDraft] = useState<RequestFormState>(defaultRequestForm);
  const [workOrderDraft, setWorkOrderDraft] = useState<WorkOrderFormState>(defaultWorkOrderForm);
  const [preventiveDraft, setPreventiveDraft] = useState<PreventiveFormState>(defaultPreventiveForm);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const activeUnits = useMemo(() => {
    const propertyId = activeTab === "preventive" ? preventiveDraft.propertyId : requestDraft.propertyId;
    return units.filter((unit) => !propertyId || unit.propertyId === propertyId);
  }, [activeTab, preventiveDraft.propertyId, requestDraft.propertyId, units]);

  async function loadAll() {
    const [optionsResponse, requestResponse, workOrderResponse, preventiveResponse, tenantResponse, propertyResponse, unitResponse, vendorResponse, userResponse] = await Promise.all([
      maintenanceApi.getOptions(),
      maintenanceApi.getRequests(),
      maintenanceApi.getWorkOrders(),
      maintenanceApi.getPreventiveSchedules(),
      tenantApi.getTenants(),
      propertyApi.getProperties(),
      unitApi.getUnits(),
      vendorApi.getVendors(),
      userApi.getUsers(),
    ]);

    setOptions(optionsResponse.data.data as MaintenanceOptionsRecord);
    setRequests((requestResponse.data.data as Array<MaintenanceRequestRecord & { id: number | string; companyId: number | string; tenantId: number | string; propertyId: number | string; unitId: number | string; assignedVendorId: number | string | null; assignedUserId: number | string | null }>).map((item) => ({
      ...item,
      id: String(item.id),
      companyId: String(item.companyId),
      tenantId: String(item.tenantId),
      propertyId: String(item.propertyId),
      unitId: String(item.unitId),
      assignedVendorId: normalizeId(item.assignedVendorId),
      assignedUserId: normalizeId(item.assignedUserId),
      attachments: Array.isArray(item.attachments) ? item.attachments : [],
    })));
    setWorkOrders((workOrderResponse.data.data as Array<MaintenanceWorkOrderRecord & { id: number | string; companyId: number | string; maintenanceRequestId: number | string; vendorId: number | string | null; technicianUserId: number | string | null }>).map((item) => ({
      ...item,
      id: String(item.id),
      companyId: String(item.companyId),
      maintenanceRequestId: String(item.maintenanceRequestId),
      vendorId: normalizeId(item.vendorId),
      technicianUserId: normalizeId(item.technicianUserId),
    })));
    setPreventiveSchedules((preventiveResponse.data.data as Array<PreventiveMaintenanceRecord & { id: number | string; companyId: number | string; propertyId: number | string; unitId: number | string | null; responsibleUserId: number | string | null; vendorId: number | string | null }>).map((item) => ({
      ...item,
      id: String(item.id),
      companyId: String(item.companyId),
      propertyId: String(item.propertyId),
      unitId: normalizeId(item.unitId),
      responsibleUserId: normalizeId(item.responsibleUserId),
      vendorId: normalizeId(item.vendorId),
    })));
    setTenants((tenantResponse.data.data as Array<TenantRecord & { id: number | string; companyId: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId) })));
    setProperties((propertyResponse.data.data as Array<PropertyRecord & { id: number | string; companyId: number | string; branchId: number | string | null; propertyManagerUserId: number | string | null }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), branchId: normalizeId(item.branchId), propertyManagerUserId: normalizeId(item.propertyManagerUserId), documentAttachments: Array.isArray(item.documentAttachments) ? item.documentAttachments : [] })));
    setUnits((unitResponse.data.data as Array<UnitRecord & { id: number | string; companyId: number | string; propertyId: number | string; buildingId: number | string; floorId: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), propertyId: String(item.propertyId), buildingId: String(item.buildingId), floorId: String(item.floorId), photoAttachments: Array.isArray(item.photoAttachments) ? item.photoAttachments : [], documentAttachments: Array.isArray(item.documentAttachments) ? item.documentAttachments : [] })));
    setVendors((vendorResponse.data.data as Array<VendorRecord & { id: number | string; companyId: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId) })));
    setUsers((userResponse.data.data as UserRecord[]).map((item) => ({ ...item, id: String(item.id), roles: item.roles.map((role) => ({ ...role, id: String(role.id) })), companies: item.companies.map((company) => ({ ...company, id: String(company.id) })), defaultCompanyId: normalizeId(item.defaultCompanyId) })));
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
        if (!cancelled) {
          setError(null);
        }
      } catch (loadError: unknown) {
        if (!cancelled) {
          setError(readError(loadError, "Maintenance data could not be loaded."));
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

  async function saveRequest() {
    if (!requestDraft.tenantId || !requestDraft.propertyId || !requestDraft.unitId) {
      setFormError("Tenant, property, and unit are required.");
      return;
    }
    try {
      setIsSaving(true);
      setFormError(null);
      const payload = {
        requestNumber: requestDraft.requestNumber,
        tenantId: Number(requestDraft.tenantId),
        propertyId: Number(requestDraft.propertyId),
        unitId: Number(requestDraft.unitId),
        category: requestDraft.category,
        priority: requestDraft.priority,
        description: requestDraft.description,
        assignedVendorId: toId(requestDraft.assignedVendorId),
        assignedUserId: toId(requestDraft.assignedUserId),
        estimatedCost: toNumber(requestDraft.estimatedCost),
        actualCost: toNumber(requestDraft.actualCost),
        status: requestDraft.status,
        approvalStatus: requestDraft.approvalStatus,
        attachments: requestDraft.attachments,
        completionRemarks: requestDraft.completionRemarks || null,
      };
      if (editingRequest) {
        await maintenanceApi.updateRequest(editingRequest.id, payload);
      } else {
        await maintenanceApi.createRequest(payload);
      }
      await finishSave();
    } catch (saveError: unknown) {
      setFormError(readError(saveError, "Maintenance request could not be saved."));
    } finally {
      setIsSaving(false);
    }
  }

  async function saveWorkOrder() {
    if (!workOrderDraft.maintenanceRequestId) {
      setFormError("Maintenance request is required.");
      return;
    }
    try {
      setIsSaving(true);
      setFormError(null);
      const payload = {
        workOrderNumber: workOrderDraft.workOrderNumber,
        maintenanceRequestId: Number(workOrderDraft.maintenanceRequestId),
        vendorId: toId(workOrderDraft.vendorId),
        technicianUserId: toId(workOrderDraft.technicianUserId),
        materialsUsed: workOrderDraft.materialsUsed || null,
        laborCharges: toNumber(workOrderDraft.laborCharges),
        vendorInvoiceDocument: workOrderDraft.vendorInvoiceDocument,
        completionRemarks: workOrderDraft.completionRemarks || null,
        approvalStatus: workOrderDraft.approvalStatus,
        status: workOrderDraft.status,
      };
      if (editingWorkOrder) {
        await maintenanceApi.updateWorkOrder(editingWorkOrder.id, payload);
      } else {
        await maintenanceApi.createWorkOrder(payload);
      }
      await finishSave();
    } catch (saveError: unknown) {
      setFormError(readError(saveError, "Work order could not be saved."));
    } finally {
      setIsSaving(false);
    }
  }

  async function savePreventive() {
    if (!preventiveDraft.propertyId) {
      setFormError("Property is required.");
      return;
    }
    try {
      setIsSaving(true);
      setFormError(null);
      const payload = {
        scheduleNumber: preventiveDraft.scheduleNumber,
        propertyId: Number(preventiveDraft.propertyId),
        unitId: toId(preventiveDraft.unitId),
        assetName: preventiveDraft.assetName,
        maintenanceType: preventiveDraft.maintenanceType,
        recurrenceFrequency: preventiveDraft.recurrenceFrequency,
        nextDueDate: preventiveDraft.nextDueDate,
        responsibleUserId: toId(preventiveDraft.responsibleUserId),
        vendorId: toId(preventiveDraft.vendorId),
        notifyBeforeDays: toNumber(preventiveDraft.notifyBeforeDays),
        completionStatus: preventiveDraft.completionStatus,
        lastCompletedDate: preventiveDraft.lastCompletedDate || null,
        completionRemarks: preventiveDraft.completionRemarks || null,
        status: preventiveDraft.status,
      };
      if (editingPreventive) {
        await maintenanceApi.updatePreventiveSchedule(editingPreventive.id, payload);
      } else {
        await maintenanceApi.createPreventiveSchedule(payload);
      }
      await finishSave();
    } catch (saveError: unknown) {
      setFormError(readError(saveError, "Preventive maintenance schedule could not be saved."));
    } finally {
      setIsSaving(false);
    }
  }

  async function finishSave() {
    setDrawerOpen(false);
    setEditingRequest(null);
    setEditingWorkOrder(null);
    setEditingPreventive(null);
    setRequestDraft(defaultRequestForm);
    setWorkOrderDraft(defaultWorkOrderForm);
    setPreventiveDraft(defaultPreventiveForm);
    await loadAll();
  }

  async function uploadRequestFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files?.length) {
      return;
    }
    const uploaded = await Promise.all(Array.from(files).map((file) => readFileAsDataUrl(file)));
    setRequestDraft((current) => ({ ...current, attachments: [...current.attachments, ...uploaded] }));
    event.target.value = "";
  }

  async function uploadInvoiceFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setWorkOrderDraft((current) => ({ ...current, vendorInvoiceDocument: null }));
    const uploaded = await readFileAsDataUrl(file);
    setWorkOrderDraft((current) => ({ ...current, vendorInvoiceDocument: uploaded }));
    event.target.value = "";
  }

  function openCreate(tab: ActiveTab) {
    setActiveTab(tab);
    setEditingRequest(null);
    setEditingWorkOrder(null);
    setEditingPreventive(null);
    setRequestDraft(defaultRequestForm);
    setWorkOrderDraft(defaultWorkOrderForm);
    setPreventiveDraft(defaultPreventiveForm);
    setFormError(null);
    setDrawerOpen(true);
  }

  return (
    <AppShell title="Maintenance management" subtitle="Track tenant complaints, repair work orders, vendor invoices, and recurring asset maintenance schedules.">
      {error ? <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

      <div className="mb-5 flex flex-wrap gap-2">
        {(["requests", "workOrders", "preventive"] as const).map((tab) => (
          <button key={tab} className={`rounded-full px-4 py-2 text-sm font-semibold ${activeTab === tab ? "bg-brand-strong text-white" : "border border-line bg-[color:var(--surface-raised)]"}`} onClick={() => setActiveTab(tab)} type="button">
            {tab === "requests" ? "Maintenance Requests" : tab === "workOrders" ? "Work Orders" : "Preventive Maintenance"}
          </button>
        ))}
      </div>

      <SectionCard
        title={activeTab === "requests" ? "Maintenance requests" : activeTab === "workOrders" ? "Work orders" : "Preventive maintenance calendar"}
        eyebrow="Maintenance"
        action={
          <button className="rounded-full bg-brand-strong px-5 py-3 text-sm font-semibold text-white" onClick={() => openCreate(activeTab)} type="button">
            {activeTab === "requests" ? "Raise Request" : activeTab === "workOrders" ? "Create Work Order" : "Schedule Maintenance"}
          </button>
        }
      >
        {isLoading ? (
          <div className="rounded-[22px] border border-line bg-[color:var(--surface-soft)] px-4 py-8 text-sm text-[color:var(--foreground-muted)]">Loading maintenance records...</div>
        ) : activeTab === "requests" ? (
          <DataTable
            rows={requests}
            columns={[
              { key: "requestNumber", header: "Request" },
              { key: "tenantDisplayName", header: "Tenant", render: (row) => row.tenantDisplayName || "Not set" },
              { key: "propertyName", header: "Property", render: (row) => row.propertyName || "Not set" },
              { key: "unitNumber", header: "Unit", render: (row) => row.unitNumber || "Not set" },
              { key: "priority", header: "Priority", render: (row) => label(row.priority) },
              { key: "estimatedCost", header: "Estimate", render: (row) => formatMoney(row.estimatedCost) },
              { key: "approvalStatus", header: "Approval", render: (row) => label(row.approvalStatus) },
              { key: "status", header: "Status", render: (row) => label(row.status) },
              {
                key: "actions",
                header: "Actions",
                render: (row) => (
                  <div className="flex gap-2">
                    <button
                      className="rounded-full border border-line px-3 py-2 text-xs font-semibold text-brand-strong"
                      onClick={() => {
                        setEditingRequest(row);
                        setRequestDraft({
                          requestNumber: row.requestNumber,
                          tenantId: row.tenantId,
                          propertyId: row.propertyId,
                          unitId: row.unitId,
                          category: row.category,
                          priority: row.priority,
                          description: row.description,
                          assignedVendorId: row.assignedVendorId || "",
                          assignedUserId: row.assignedUserId || "",
                          estimatedCost: row.estimatedCost == null ? "" : String(row.estimatedCost),
                          actualCost: row.actualCost == null ? "" : String(row.actualCost),
                          status: row.status,
                          approvalStatus: row.approvalStatus,
                          attachments: row.attachments || [],
                          completionRemarks: row.completionRemarks || "",
                        });
                        setFormError(null);
                        setDrawerOpen(true);
                      }}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
                      onClick={async () => {
                        try {
                          await maintenanceApi.deleteRequest(row.id);
                          await loadAll();
                        } catch (deleteError: unknown) {
                          setError(readError(deleteError, "Maintenance request could not be deleted."));
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
        ) : activeTab === "workOrders" ? (
          <DataTable
            rows={workOrders}
            columns={[
              { key: "workOrderNumber", header: "Work Order" },
              { key: "requestNumber", header: "Request", render: (row) => row.requestNumber || "Not set" },
              { key: "vendorName", header: "Vendor", render: (row) => row.vendorName || "Internal" },
              { key: "technicianName", header: "Technician", render: (row) => row.technicianName || "Not assigned" },
              { key: "laborCharges", header: "Labor", render: (row) => formatMoney(row.laborCharges) },
              { key: "approvalStatus", header: "Approval", render: (row) => label(row.approvalStatus) },
              { key: "status", header: "Status", render: (row) => label(row.status) },
              {
                key: "actions",
                header: "Actions",
                render: (row) => (
                  <div className="flex gap-2">
                    <button
                      className="rounded-full border border-line px-3 py-2 text-xs font-semibold text-brand-strong"
                      onClick={() => {
                        setEditingWorkOrder(row);
                        setWorkOrderDraft({
                          workOrderNumber: row.workOrderNumber,
                          maintenanceRequestId: row.maintenanceRequestId,
                          vendorId: row.vendorId || "",
                          technicianUserId: row.technicianUserId || "",
                          materialsUsed: row.materialsUsed || "",
                          laborCharges: row.laborCharges == null ? "" : String(row.laborCharges),
                          vendorInvoiceDocument: row.vendorInvoiceDocument,
                          completionRemarks: row.completionRemarks || "",
                          approvalStatus: row.approvalStatus,
                          status: row.status,
                        });
                        setFormError(null);
                        setDrawerOpen(true);
                      }}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
                      onClick={async () => {
                        try {
                          await maintenanceApi.deleteWorkOrder(row.id);
                          await loadAll();
                        } catch (deleteError: unknown) {
                          setError(readError(deleteError, "Work order could not be deleted."));
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
        ) : (
          <DataTable
            rows={preventiveSchedules}
            columns={[
              { key: "scheduleNumber", header: "Schedule" },
              { key: "assetName", header: "Asset" },
              { key: "maintenanceType", header: "Type" },
              { key: "propertyName", header: "Property", render: (row) => row.propertyName || "Not set" },
              { key: "recurrenceFrequency", header: "Frequency", render: (row) => label(row.recurrenceFrequency) },
              { key: "nextDueDate", header: "Next Due" },
              { key: "responsibleUserName", header: "Responsible", render: (row) => row.responsibleUserName || row.vendorName || "Not assigned" },
              { key: "completionStatus", header: "Completion", render: (row) => label(row.completionStatus) },
              { key: "status", header: "Status", render: (row) => label(row.status) },
              {
                key: "actions",
                header: "Actions",
                render: (row) => (
                  <div className="flex gap-2">
                    <button
                      className="rounded-full border border-line px-3 py-2 text-xs font-semibold text-brand-strong"
                      onClick={() => {
                        setEditingPreventive(row);
                        setPreventiveDraft({
                          scheduleNumber: row.scheduleNumber,
                          propertyId: row.propertyId,
                          unitId: row.unitId || "",
                          assetName: row.assetName,
                          maintenanceType: row.maintenanceType,
                          recurrenceFrequency: row.recurrenceFrequency,
                          nextDueDate: row.nextDueDate,
                          responsibleUserId: row.responsibleUserId || "",
                          vendorId: row.vendorId || "",
                          notifyBeforeDays: String(row.notifyBeforeDays),
                          completionStatus: row.completionStatus,
                          lastCompletedDate: row.lastCompletedDate || "",
                          completionRemarks: row.completionRemarks || "",
                          status: row.status,
                        });
                        setFormError(null);
                        setDrawerOpen(true);
                      }}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
                      onClick={async () => {
                        try {
                          await maintenanceApi.deletePreventiveSchedule(row.id);
                          await loadAll();
                        } catch (deleteError: unknown) {
                          setError(readError(deleteError, "Preventive maintenance schedule could not be deleted."));
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
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={activeTab === "requests" ? (editingRequest ? "Edit request" : "Raise maintenance request") : activeTab === "workOrders" ? (editingWorkOrder ? "Edit work order" : "Create work order") : editingPreventive ? "Edit preventive schedule" : "Schedule preventive maintenance"}
      >
        <div className="grid gap-4">
          {formError ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{formError}</p> : null}
          <CompanyContextBanner companyName={activeCompany?.companyName} />

          {activeTab === "requests" ? (
            <>
              <TextInput label="Request Number" value={requestDraft.requestNumber} onChange={(value) => setRequestDraft((current) => ({ ...current, requestNumber: value }))} />
              <SelectInput labelName="Tenant" value={requestDraft.tenantId} onChange={(value) => setRequestDraft((current) => ({ ...current, tenantId: value }))} options={tenants.map((tenant) => ({ value: tenant.id, label: tenant.displayName }))} />
              <SelectInput labelName="Property" value={requestDraft.propertyId} onChange={(value) => setRequestDraft((current) => ({ ...current, propertyId: value, unitId: "" }))} options={properties.map((property) => ({ value: property.id, label: property.propertyName }))} />
              <SelectInput labelName="Unit" value={requestDraft.unitId} onChange={(value) => setRequestDraft((current) => ({ ...current, unitId: value }))} options={activeUnits.map((unit) => ({ value: unit.id, label: `${unit.unitNumber} (${unit.unitCode})` }))} />
              <TextInput label="Category" value={requestDraft.category} onChange={(value) => setRequestDraft((current) => ({ ...current, category: value }))} placeholder="Lift, plumbing, electrical..." />
              <SelectInput labelName="Priority" value={requestDraft.priority} onChange={(value) => setRequestDraft((current) => ({ ...current, priority: value }))} options={options.priorities.map((item) => ({ value: item, label: label(item) }))} />
              <SelectInput labelName="Assigned Vendor" value={requestDraft.assignedVendorId} onChange={(value) => setRequestDraft((current) => ({ ...current, assignedVendorId: value }))} options={vendors.map((vendor) => ({ value: vendor.id, label: vendor.vendorName }))} optionalLabel="Internal / not assigned" />
              <SelectInput labelName="Assigned Technician" value={requestDraft.assignedUserId} onChange={(value) => setRequestDraft((current) => ({ ...current, assignedUserId: value }))} options={users.map((item) => ({ value: item.id, label: item.fullName }))} optionalLabel="Not assigned" />
              <TextInput label="Estimated Cost" value={requestDraft.estimatedCost} onChange={(value) => setRequestDraft((current) => ({ ...current, estimatedCost: value }))} type="number" />
              <TextInput label="Actual Cost" value={requestDraft.actualCost} onChange={(value) => setRequestDraft((current) => ({ ...current, actualCost: value }))} type="number" />
              <SelectInput labelName="Status" value={requestDraft.status} onChange={(value) => setRequestDraft((current) => ({ ...current, status: value }))} options={options.requestStatuses.map((item) => ({ value: item, label: label(item) }))} />
              <SelectInput labelName="Approval Status" value={requestDraft.approvalStatus} onChange={(value) => setRequestDraft((current) => ({ ...current, approvalStatus: value }))} options={options.approvalStatuses.map((item) => ({ value: item, label: label(item) }))} />
              <TextareaInput label="Description" value={requestDraft.description} onChange={(value) => setRequestDraft((current) => ({ ...current, description: value }))} />
              <TextareaInput label="Completion Remarks" value={requestDraft.completionRemarks} onChange={(value) => setRequestDraft((current) => ({ ...current, completionRemarks: value }))} />
              <label className="grid gap-2 text-sm font-medium">Photos / Documents<input className="field w-full rounded-2xl px-4 py-3 ring-0" multiple onChange={uploadRequestFiles} type="file" /></label>
              {requestDraft.attachments.length ? <p className="text-sm text-[color:var(--foreground-muted)]">{requestDraft.attachments.length} attachment(s) ready</p> : null}
              <SaveButton isSaving={isSaving} label={editingRequest ? "Update Request" : "Create Request"} onClick={saveRequest} />
            </>
          ) : activeTab === "workOrders" ? (
            <>
              <TextInput label="Work Order Number" value={workOrderDraft.workOrderNumber} onChange={(value) => setWorkOrderDraft((current) => ({ ...current, workOrderNumber: value }))} />
              <SelectInput labelName="Maintenance Request" value={workOrderDraft.maintenanceRequestId} onChange={(value) => setWorkOrderDraft((current) => ({ ...current, maintenanceRequestId: value }))} options={requests.map((request) => ({ value: request.id, label: `${request.requestNumber} - ${request.unitNumber || "Unit"}` }))} />
              <SelectInput labelName="Vendor" value={workOrderDraft.vendorId} onChange={(value) => setWorkOrderDraft((current) => ({ ...current, vendorId: value }))} options={vendors.map((vendor) => ({ value: vendor.id, label: vendor.vendorName }))} optionalLabel="Internal technician" />
              <SelectInput labelName="Technician" value={workOrderDraft.technicianUserId} onChange={(value) => setWorkOrderDraft((current) => ({ ...current, technicianUserId: value }))} options={users.map((item) => ({ value: item.id, label: item.fullName }))} optionalLabel="Not assigned" />
              <TextInput label="Labor Charges" value={workOrderDraft.laborCharges} onChange={(value) => setWorkOrderDraft((current) => ({ ...current, laborCharges: value }))} type="number" />
              <SelectInput labelName="Approval Status" value={workOrderDraft.approvalStatus} onChange={(value) => setWorkOrderDraft((current) => ({ ...current, approvalStatus: value }))} options={options.approvalStatuses.map((item) => ({ value: item, label: label(item) }))} />
              <SelectInput labelName="Status" value={workOrderDraft.status} onChange={(value) => setWorkOrderDraft((current) => ({ ...current, status: value }))} options={options.workOrderStatuses.map((item) => ({ value: item, label: label(item) }))} />
              <TextareaInput label="Materials Used" value={workOrderDraft.materialsUsed} onChange={(value) => setWorkOrderDraft((current) => ({ ...current, materialsUsed: value }))} />
              <TextareaInput label="Completion Remarks" value={workOrderDraft.completionRemarks} onChange={(value) => setWorkOrderDraft((current) => ({ ...current, completionRemarks: value }))} />
              <label className="grid gap-2 text-sm font-medium">Vendor Invoice<input className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={uploadInvoiceFile} type="file" /></label>
              {workOrderDraft.vendorInvoiceDocument ? <p className="text-sm text-[color:var(--foreground-muted)]">{workOrderDraft.vendorInvoiceDocument.fileName}</p> : null}
              <SaveButton isSaving={isSaving} label={editingWorkOrder ? "Update Work Order" : "Create Work Order"} onClick={saveWorkOrder} />
            </>
          ) : (
            <>
              <TextInput label="Schedule Number" value={preventiveDraft.scheduleNumber} onChange={(value) => setPreventiveDraft((current) => ({ ...current, scheduleNumber: value }))} />
              <SelectInput labelName="Property" value={preventiveDraft.propertyId} onChange={(value) => setPreventiveDraft((current) => ({ ...current, propertyId: value, unitId: "" }))} options={properties.map((property) => ({ value: property.id, label: property.propertyName }))} />
              <SelectInput labelName="Unit / Asset Location" value={preventiveDraft.unitId} onChange={(value) => setPreventiveDraft((current) => ({ ...current, unitId: value }))} options={activeUnits.map((unit) => ({ value: unit.id, label: `${unit.unitNumber} (${unit.unitCode})` }))} optionalLabel="Property-level asset" />
              <TextInput label="Asset Name" value={preventiveDraft.assetName} onChange={(value) => setPreventiveDraft((current) => ({ ...current, assetName: value }))} placeholder="Lift, generator, water tank..." />
              <TextInput label="Maintenance Type" value={preventiveDraft.maintenanceType} onChange={(value) => setPreventiveDraft((current) => ({ ...current, maintenanceType: value }))} placeholder="Service, inspection, cleaning..." />
              <SelectInput labelName="Frequency" value={preventiveDraft.recurrenceFrequency} onChange={(value) => setPreventiveDraft((current) => ({ ...current, recurrenceFrequency: value }))} options={options.preventiveFrequencies.map((item) => ({ value: item, label: label(item) }))} />
              <TextInput label="Next Due Date" value={preventiveDraft.nextDueDate} onChange={(value) => setPreventiveDraft((current) => ({ ...current, nextDueDate: value }))} type="date" />
              <SelectInput labelName="Responsible Person" value={preventiveDraft.responsibleUserId} onChange={(value) => setPreventiveDraft((current) => ({ ...current, responsibleUserId: value }))} options={users.map((item) => ({ value: item.id, label: item.fullName }))} optionalLabel="Not assigned" />
              <SelectInput labelName="Vendor" value={preventiveDraft.vendorId} onChange={(value) => setPreventiveDraft((current) => ({ ...current, vendorId: value }))} options={vendors.map((vendor) => ({ value: vendor.id, label: vendor.vendorName }))} optionalLabel="Internal" />
              <TextInput label="Notify Before Days" value={preventiveDraft.notifyBeforeDays} onChange={(value) => setPreventiveDraft((current) => ({ ...current, notifyBeforeDays: value }))} type="number" />
              <SelectInput labelName="Completion Status" value={preventiveDraft.completionStatus} onChange={(value) => setPreventiveDraft((current) => ({ ...current, completionStatus: value }))} options={options.preventiveCompletionStatuses.map((item) => ({ value: item, label: label(item) }))} />
              <TextInput label="Last Completed Date" value={preventiveDraft.lastCompletedDate} onChange={(value) => setPreventiveDraft((current) => ({ ...current, lastCompletedDate: value }))} type="date" />
              <SelectInput labelName="Schedule Status" value={preventiveDraft.status} onChange={(value) => setPreventiveDraft((current) => ({ ...current, status: value }))} options={options.preventiveStatuses.map((item) => ({ value: item, label: label(item) }))} />
              <TextareaInput label="Completion Remarks" value={preventiveDraft.completionRemarks} onChange={(value) => setPreventiveDraft((current) => ({ ...current, completionRemarks: value }))} />
              <SaveButton isSaving={isSaving} label={editingPreventive ? "Update Schedule" : "Create Schedule"} onClick={savePreventive} />
            </>
          )}
        </div>
      </SidebarDrawer>
    </AppShell>
  );
}

function TextInput({ label: inputLabel, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {inputLabel}
      <input className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type={type} value={value} />
    </label>
  );
}

function TextareaInput({ label: inputLabel, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {inputLabel}
      <textarea className="field min-h-[110px] w-full rounded-3xl px-4 py-3 ring-0" onChange={(event) => onChange(event.target.value)} value={value} />
    </label>
  );
}

function SelectInput({ labelName, value, onChange, options, optionalLabel = "Select" }: { labelName: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }>; optionalLabel?: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {labelName}
      <select className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => onChange(event.target.value)} value={value}>
        <option value="">{optionalLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SaveButton({ isSaving, label: buttonLabel, onClick }: { isSaving: boolean; label: string; onClick: () => void }) {
  return (
    <button className="rounded-full bg-brand-strong px-5 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={isSaving} onClick={onClick} type="button">
      {isSaving ? "Saving..." : buttonLabel}
    </button>
  );
}
