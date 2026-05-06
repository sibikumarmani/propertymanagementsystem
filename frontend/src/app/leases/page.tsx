"use client";

import axios from "axios";
import type { ChangeEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/common/data-table";
import { SectionCard } from "@/components/common/section-card";
import { SidebarDrawer } from "@/components/common/sidebar-drawer";
import { AppShell } from "@/components/layout/app-shell";
import { leaseApi, tenantApi, unitApi } from "@/lib/api";
import type { LeaseAttachmentRecord, LeaseOptionsRecord, LeaseRecord, LeaseRenewalRecord, TenantRecord, UnitRecord } from "@/lib/types";
import { useIsClient } from "@/hooks/use-is-client";
import { useAppStore } from "@/store/app-store";

type DrawerMode = "lease" | "renew" | "terminate";

type LeaseFormState = {
  leaseNumber: string;
  tenantId: string;
  unitId: string;
  leaseStartDate: string;
  leaseEndDate: string;
  rentAmount: string;
  securityDepositAmount: string;
  billingCycle: string;
  dueDay: string;
  gracePeriodDays: string;
  lateFeeRule: string;
  agreementDocument: LeaseAttachmentRecord | null;
  status: string;
};

type RenewalFormState = {
  renewalNumber: string;
  newStartDate: string;
  newEndDate: string;
  newRentAmount: string;
  securityDepositAmount: string;
  agreementDocument: LeaseAttachmentRecord | null;
  renewalNotes: string;
};

type TerminationFormState = {
  terminationDate: string;
  terminationReason: string;
  finalSettlementAmount: string;
  securityDepositRefundAmount: string;
  terminationDocument: LeaseAttachmentRecord | null;
};

const fallbackOptions: LeaseOptionsRecord = {
  leaseStatuses: ["DRAFT", "PENDING_APPROVAL", "APPROVED", "ACTIVE", "EXPIRED", "TERMINATED", "RENEWED", "CANCELLED"],
  billingCycles: ["MONTHLY", "QUARTERLY", "HALF_YEARLY", "YEARLY"],
};

const defaultLeaseForm: LeaseFormState = {
  leaseNumber: "",
  tenantId: "",
  unitId: "",
  leaseStartDate: "",
  leaseEndDate: "",
  rentAmount: "",
  securityDepositAmount: "",
  billingCycle: "MONTHLY",
  dueDay: "1",
  gracePeriodDays: "0",
  lateFeeRule: "",
  agreementDocument: null,
  status: "DRAFT",
};

const defaultRenewalForm: RenewalFormState = {
  renewalNumber: "",
  newStartDate: "",
  newEndDate: "",
  newRentAmount: "",
  securityDepositAmount: "",
  agreementDocument: null,
  renewalNotes: "",
};

const defaultTerminationForm: TerminationFormState = {
  terminationDate: "",
  terminationReason: "",
  finalSettlementAmount: "",
  securityDepositRefundAmount: "",
  terminationDocument: null,
};

function readError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error) && typeof error.response?.data?.message === "string") {
    return error.response.data.message;
  }
  return fallback;
}

function prettify(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (match) => match.toUpperCase());
}

function toNumber(value: string) {
  if (!value.trim()) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function money(value: number | null | undefined) {
  if (value == null) {
    return "Not set";
  }
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(value);
}

function readFileAsDataUrl(file: File) {
  return new Promise<LeaseAttachmentRecord>((resolve, reject) => {
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

export default function LeasesPage() {
  const isClient = useIsClient();
  const { accessToken, hasHydrated, user } = useAppStore();
  const activeCompanyId = user?.activeCompany?.id ? String(user.activeCompany.id) : null;

  const [leases, setLeases] = useState<LeaseRecord[]>([]);
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [units, setUnits] = useState<UnitRecord[]>([]);
  const [renewals, setRenewals] = useState<LeaseRenewalRecord[]>([]);
  const [options, setOptions] = useState<LeaseOptionsRecord>(fallbackOptions);
  const [editingLease, setEditingLease] = useState<LeaseRecord | null>(null);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("lease");
  const [leaseDraft, setLeaseDraft] = useState<LeaseFormState>(defaultLeaseForm);
  const [renewalDraft, setRenewalDraft] = useState<RenewalFormState>(defaultRenewalForm);
  const [terminationDraft, setTerminationDraft] = useState<TerminationFormState>(defaultTerminationForm);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const tenantOptions = useMemo(
    () => tenants.filter((tenant) => tenant.companyId === activeCompanyId && !["BLACKLISTED", "INACTIVE"].includes(tenant.tenantStatus)),
    [activeCompanyId, tenants],
  );

  const unitOptions = useMemo(
    () =>
      units.filter(
        (unit) =>
          unit.companyId === activeCompanyId &&
          (["AVAILABLE", "RESERVED"].includes(unit.unitStatus) || unit.id === leaseDraft.unitId || unit.id === editingLease?.unitId),
      ),
    [activeCompanyId, editingLease?.unitId, leaseDraft.unitId, units],
  );

  const selectedUnit = units.find((unit) => unit.id === leaseDraft.unitId);

  async function loadData() {
    const [leaseResponse, tenantResponse, unitResponse, optionResponse] = await Promise.all([
      leaseApi.getLeases(),
      tenantApi.getTenants(),
      unitApi.getUnits(),
      leaseApi.getOptions(),
    ]);
    setLeases((leaseResponse.data.data as Array<LeaseRecord & { id: number | string; companyId: number | string; tenantId: number | string; propertyId: number | string; unitId: number | string; renewedFromLeaseId: number | string | null }>).map((lease) => ({
      ...lease,
      id: String(lease.id),
      companyId: String(lease.companyId),
      tenantId: String(lease.tenantId),
      propertyId: String(lease.propertyId),
      unitId: String(lease.unitId),
      renewedFromLeaseId: lease.renewedFromLeaseId == null ? null : String(lease.renewedFromLeaseId),
    })));
    setTenants((tenantResponse.data.data as Array<TenantRecord & { id: number | string; companyId: number | string }>).map((tenant) => ({
      ...tenant,
      id: String(tenant.id),
      companyId: String(tenant.companyId),
      idProofAttachments: Array.isArray(tenant.idProofAttachments) ? tenant.idProofAttachments : [],
      addressProofAttachments: Array.isArray(tenant.addressProofAttachments) ? tenant.addressProofAttachments : [],
      financialAttachments: Array.isArray(tenant.financialAttachments) ? tenant.financialAttachments : [],
    })));
    setUnits((unitResponse.data.data as Array<UnitRecord & { id: number | string; companyId: number | string; propertyId: number | string; buildingId: number | string; floorId: number | string }>).map((unit) => ({
      ...unit,
      id: String(unit.id),
      companyId: String(unit.companyId),
      propertyId: String(unit.propertyId),
      buildingId: String(unit.buildingId),
      floorId: String(unit.floorId),
      photoAttachments: Array.isArray(unit.photoAttachments) ? unit.photoAttachments : [],
      documentAttachments: Array.isArray(unit.documentAttachments) ? unit.documentAttachments : [],
    })));
    setOptions({
      leaseStatuses: optionResponse.data.data.leaseStatuses ?? fallbackOptions.leaseStatuses,
      billingCycles: optionResponse.data.data.billingCycles ?? fallbackOptions.billingCycles,
    });
  }

  useEffect(() => {
    if (!isClient || !hasHydrated || !accessToken) {
      return;
    }
    let cancelled = false;
    async function run() {
      try {
        setIsLoading(true);
        await loadData();
        if (!cancelled) {
          setError(null);
        }
      } catch (loadError: unknown) {
        if (!cancelled) {
          setError(readError(loadError, "Leases could not be loaded."));
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

  async function uploadDocument(event: ChangeEvent<HTMLInputElement>, target: "agreement" | "renewal" | "termination") {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      const uploaded = await readFileAsDataUrl(file);
      if (target === "agreement") {
        setLeaseDraft((current) => ({ ...current, agreementDocument: uploaded }));
      } else if (target === "renewal") {
        setRenewalDraft((current) => ({ ...current, agreementDocument: uploaded }));
      } else {
        setTerminationDraft((current) => ({ ...current, terminationDocument: uploaded }));
      }
      setFormError(null);
    } catch (uploadError) {
      setFormError(uploadError instanceof Error ? uploadError.message : "Document could not be uploaded.");
    } finally {
      event.target.value = "";
    }
  }

  function openCreate() {
    setDrawerMode("lease");
    setEditingLease(null);
    setLeaseDraft(defaultLeaseForm);
    setFormError(null);
    setIsDrawerOpen(true);
  }

  function openEdit(lease: LeaseRecord) {
    setDrawerMode("lease");
    setEditingLease(lease);
    setLeaseDraft({
      leaseNumber: lease.leaseNumber,
      tenantId: lease.tenantId,
      unitId: lease.unitId,
      leaseStartDate: lease.leaseStartDate,
      leaseEndDate: lease.leaseEndDate,
      rentAmount: String(lease.rentAmount),
      securityDepositAmount: String(lease.securityDepositAmount),
      billingCycle: lease.billingCycle,
      dueDay: String(lease.dueDay),
      gracePeriodDays: lease.gracePeriodDays == null ? "0" : String(lease.gracePeriodDays),
      lateFeeRule: lease.lateFeeRule ?? "",
      agreementDocument: lease.agreementDocument,
      status: lease.status,
    });
    setFormError(null);
    setIsDrawerOpen(true);
  }

  async function openRenew(lease: LeaseRecord) {
    setDrawerMode("renew");
    setEditingLease(lease);
    setRenewalDraft({
      ...defaultRenewalForm,
      renewalNumber: `${lease.leaseNumber}-RN-${String(Date.now()).slice(-4)}`,
      newStartDate: lease.leaseEndDate,
      newRentAmount: String(lease.rentAmount),
      securityDepositAmount: String(lease.securityDepositAmount),
    });
    setFormError(null);
    setIsDrawerOpen(true);
    try {
      const response = await leaseApi.getRenewals(lease.id);
      setRenewals((response.data.data as Array<LeaseRenewalRecord & { id: number | string; companyId: number | string; leaseId: number | string }>).map((renewal) => ({
        ...renewal,
        id: String(renewal.id),
        companyId: String(renewal.companyId),
        leaseId: String(renewal.leaseId),
      })));
    } catch {
      setRenewals([]);
    }
  }

  function openTerminate(lease: LeaseRecord) {
    setDrawerMode("terminate");
    setEditingLease(lease);
    setTerminationDraft({
      ...defaultTerminationForm,
      terminationDate: new Date().toISOString().slice(0, 10),
      securityDepositRefundAmount: String(lease.securityDepositAmount),
    });
    setFormError(null);
    setIsDrawerOpen(true);
  }

  async function handleSaveLease() {
    const rentAmount = toNumber(leaseDraft.rentAmount);
    const securityDepositAmount = toNumber(leaseDraft.securityDepositAmount);
    const dueDay = toNumber(leaseDraft.dueDay);
    if (!leaseDraft.tenantId || !leaseDraft.unitId || rentAmount == null || securityDepositAmount == null || dueDay == null) {
      setFormError("Tenant, unit, rent amount, security deposit, and due day are required.");
      return;
    }
    try {
      setIsSaving(true);
      const payload = {
        leaseNumber: leaseDraft.leaseNumber,
        tenantId: Number(leaseDraft.tenantId),
        unitId: Number(leaseDraft.unitId),
        leaseStartDate: leaseDraft.leaseStartDate,
        leaseEndDate: leaseDraft.leaseEndDate,
        rentAmount,
        securityDepositAmount,
        billingCycle: leaseDraft.billingCycle,
        dueDay,
        gracePeriodDays: toNumber(leaseDraft.gracePeriodDays),
        lateFeeRule: leaseDraft.lateFeeRule || null,
        agreementDocument: leaseDraft.agreementDocument,
        status: leaseDraft.status,
      };
      if (editingLease) {
        await leaseApi.updateLease(editingLease.id, payload);
      } else {
        await leaseApi.createLease(payload);
      }
      setIsDrawerOpen(false);
      await loadData();
    } catch (saveError: unknown) {
      setFormError(readError(saveError, "Lease could not be saved."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRenewLease() {
    if (!editingLease) {
      return;
    }
    const newRentAmount = toNumber(renewalDraft.newRentAmount);
    if (newRentAmount == null) {
      setFormError("New rent amount is required.");
      return;
    }
    try {
      setIsSaving(true);
      await leaseApi.renewLease(editingLease.id, {
        renewalNumber: renewalDraft.renewalNumber,
        newStartDate: renewalDraft.newStartDate,
        newEndDate: renewalDraft.newEndDate,
        newRentAmount,
        securityDepositAmount: toNumber(renewalDraft.securityDepositAmount),
        agreementDocument: renewalDraft.agreementDocument,
        renewalNotes: renewalDraft.renewalNotes || null,
      });
      setIsDrawerOpen(false);
      await loadData();
    } catch (renewError: unknown) {
      setFormError(readError(renewError, "Lease could not be renewed."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleTerminateLease() {
    if (!editingLease) {
      return;
    }
    try {
      setIsSaving(true);
      await leaseApi.terminateLease(editingLease.id, {
        terminationDate: terminationDraft.terminationDate,
        terminationReason: terminationDraft.terminationReason,
        finalSettlementAmount: toNumber(terminationDraft.finalSettlementAmount),
        securityDepositRefundAmount: toNumber(terminationDraft.securityDepositRefundAmount),
        terminationDocument: terminationDraft.terminationDocument,
      });
      setIsDrawerOpen(false);
      await loadData();
    } catch (terminateError: unknown) {
      setFormError(readError(terminateError, "Lease could not be terminated."));
    } finally {
      setIsSaving(false);
    }
  }

  async function runWorkflow(lease: LeaseRecord, action: "submit" | "approve" | "activate" | "cancel") {
    try {
      if (action === "submit") {
        await leaseApi.submitLease(lease.id);
      } else if (action === "approve") {
        await leaseApi.approveLease(lease.id);
      } else if (action === "activate") {
        await leaseApi.activateLease(lease.id);
      } else {
        await leaseApi.cancelLease(lease.id);
      }
      await loadData();
      setError(null);
    } catch (workflowError: unknown) {
      setError(readError(workflowError, "Lease workflow action failed."));
    }
  }

  return (
    <AppShell title="Lease management" subtitle="Create leases, approve activation, renew agreements, terminate occupancy, and keep unit availability synchronized.">
      {error ? <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      <SectionCard title="Lease register" eyebrow="Lease Management">
        <div className="mb-4 flex justify-end">
          <button className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white" onClick={openCreate} type="button">
            Create lease
          </button>
        </div>
        {isLoading ? (
          <div className="rounded-[22px] border border-line bg-[color:var(--surface-soft)] px-4 py-8 text-sm text-[color:var(--foreground-muted)]">Loading leases...</div>
        ) : (
          <DataTable
            rows={leases}
            columns={[
              { key: "leaseNumber", header: "Lease No." },
              { key: "tenantDisplayName", header: "Tenant", render: (row) => row.tenantDisplayName || "Not set" },
              { key: "propertyName", header: "Property", render: (row) => row.propertyName || "Not set" },
              { key: "unitNumber", header: "Unit", render: (row) => row.unitNumber || row.unitCode || "Not set" },
              { key: "leaseStartDate", header: "Start" },
              { key: "leaseEndDate", header: "End" },
              { key: "rentAmount", header: "Rent", render: (row) => money(row.rentAmount) },
              { key: "billingCycle", header: "Billing", render: (row) => prettify(row.billingCycle) },
              { key: "status", header: "Status", render: (row) => prettify(row.status) },
              {
                key: "actions",
                header: "Actions",
                render: (row) => (
                  <div className="flex flex-wrap gap-2">
                    <button className="rounded-full border border-line px-3 py-2 text-xs font-semibold" onClick={() => openEdit(row)} type="button">Edit</button>
                    {row.status === "DRAFT" ? <button className="rounded-full border border-line px-3 py-2 text-xs font-semibold" onClick={() => void runWorkflow(row, "submit")} type="button">Submit</button> : null}
                    {row.status === "PENDING_APPROVAL" ? <button className="rounded-full border border-line px-3 py-2 text-xs font-semibold" onClick={() => void runWorkflow(row, "approve")} type="button">Approve</button> : null}
                    {row.status === "APPROVED" ? <button className="rounded-full border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700" onClick={() => void runWorkflow(row, "activate")} type="button">Activate</button> : null}
                    {["ACTIVE", "APPROVED"].includes(row.status) ? <button className="rounded-full border border-line px-3 py-2 text-xs font-semibold" onClick={() => void openRenew(row)} type="button">Renew</button> : null}
                    {["ACTIVE", "APPROVED"].includes(row.status) ? <button className="rounded-full border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-700" onClick={() => openTerminate(row)} type="button">Terminate</button> : null}
                    {["DRAFT", "PENDING_APPROVAL", "APPROVED"].includes(row.status) ? <button className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700" onClick={() => void runWorkflow(row, "cancel")} type="button">Cancel</button> : null}
                  </div>
                ),
              },
            ]}
          />
        )}
      </SectionCard>

      <SidebarDrawer
        description={drawerMode === "renew" ? "Renew the existing lease and move it back through approval." : drawerMode === "terminate" ? "Capture termination, final settlement, deposit refund, and release the unit." : "Create or edit a lease before approval and activation."}
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
        title={drawerMode === "renew" ? "Renew lease" : drawerMode === "terminate" ? "Terminate lease" : editingLease ? editingLease.leaseNumber : "Create lease"}
        widthClassName="sm:max-w-4xl"
      >
        {formError ? <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{formError}</p> : null}
        {drawerMode === "lease" ? (
          <form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); void handleSaveLease(); }}>
            <Field label="Lease number" value={leaseDraft.leaseNumber} onChange={(value) => setLeaseDraft((current) => ({ ...current, leaseNumber: value }))} />
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-brand-strong">Tenant</span>
              <select className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setLeaseDraft((current) => ({ ...current, tenantId: event.target.value }))} value={leaseDraft.tenantId}>
                <option value="">Select tenant</option>
                {tenantOptions.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>{tenant.displayName} ({tenant.tenantCode})</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-brand-strong">Unit</span>
              <select className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setLeaseDraft((current) => ({ ...current, unitId: event.target.value }))} value={leaseDraft.unitId}>
                <option value="">Select unit</option>
                {unitOptions.map((unit) => (
                  <option key={unit.id} value={unit.id}>{unit.unitNumber} ({unit.unitCode}) - {unit.propertyName}</option>
                ))}
              </select>
            </label>
            <Field disabled label="Property" value={selectedUnit?.propertyName ?? ""} onChange={() => undefined} />
            <Field label="Lease start date" type="date" value={leaseDraft.leaseStartDate} onChange={(value) => setLeaseDraft((current) => ({ ...current, leaseStartDate: value }))} />
            <Field label="Lease end date" type="date" value={leaseDraft.leaseEndDate} onChange={(value) => setLeaseDraft((current) => ({ ...current, leaseEndDate: value }))} />
            <Field label="Rent amount" type="number" value={leaseDraft.rentAmount} onChange={(value) => setLeaseDraft((current) => ({ ...current, rentAmount: value }))} />
            <Field label="Security deposit" type="number" value={leaseDraft.securityDepositAmount} onChange={(value) => setLeaseDraft((current) => ({ ...current, securityDepositAmount: value }))} />
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-brand-strong">Billing cycle</span>
              <select className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setLeaseDraft((current) => ({ ...current, billingCycle: event.target.value }))} value={leaseDraft.billingCycle}>
                {options.billingCycles.map((option) => <option key={option} value={option}>{prettify(option)}</option>)}
              </select>
            </label>
            <Field label="Due day" type="number" value={leaseDraft.dueDay} onChange={(value) => setLeaseDraft((current) => ({ ...current, dueDay: value }))} />
            <Field label="Grace period days" type="number" value={leaseDraft.gracePeriodDays} onChange={(value) => setLeaseDraft((current) => ({ ...current, gracePeriodDays: value }))} />
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-brand-strong">Status</span>
              <select className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setLeaseDraft((current) => ({ ...current, status: event.target.value }))} value={leaseDraft.status}>
                {options.leaseStatuses.filter((status) => status !== "ACTIVE").map((option) => <option key={option} value={option}>{prettify(option)}</option>)}
              </select>
            </label>
            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-brand-strong">Late fee rule</span>
              <textarea className="field min-h-24 w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setLeaseDraft((current) => ({ ...current, lateFeeRule: event.target.value }))} value={leaseDraft.lateFeeRule} />
            </label>
            <DocumentField attachment={leaseDraft.agreementDocument} label="Lease agreement" onChange={(event) => void uploadDocument(event, "agreement")} onRemove={() => setLeaseDraft((current) => ({ ...current, agreementDocument: null }))} />
            <button className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60 md:col-span-2" disabled={isSaving} type="submit">
              {isSaving ? "Saving..." : editingLease ? "Update lease" : "Create lease"}
            </button>
          </form>
        ) : null}

        {drawerMode === "renew" ? (
          <form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); void handleRenewLease(); }}>
            <Field label="Renewal number" value={renewalDraft.renewalNumber} onChange={(value) => setRenewalDraft((current) => ({ ...current, renewalNumber: value }))} />
            <Field label="New start date" type="date" value={renewalDraft.newStartDate} onChange={(value) => setRenewalDraft((current) => ({ ...current, newStartDate: value }))} />
            <Field label="New end date" type="date" value={renewalDraft.newEndDate} onChange={(value) => setRenewalDraft((current) => ({ ...current, newEndDate: value }))} />
            <Field label="New rent amount" type="number" value={renewalDraft.newRentAmount} onChange={(value) => setRenewalDraft((current) => ({ ...current, newRentAmount: value }))} />
            <Field label="Security deposit" type="number" value={renewalDraft.securityDepositAmount} onChange={(value) => setRenewalDraft((current) => ({ ...current, securityDepositAmount: value }))} />
            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-brand-strong">Renewal notes</span>
              <textarea className="field min-h-24 w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setRenewalDraft((current) => ({ ...current, renewalNotes: event.target.value }))} value={renewalDraft.renewalNotes} />
            </label>
            <DocumentField attachment={renewalDraft.agreementDocument} label="New agreement" onChange={(event) => void uploadDocument(event, "renewal")} onRemove={() => setRenewalDraft((current) => ({ ...current, agreementDocument: null }))} />
            {renewals.length ? <div className="rounded-2xl border border-line bg-[color:var(--surface-soft)] p-4 text-sm md:col-span-2">Renewal history: {renewals.map((renewal) => renewal.renewalNumber).join(", ")}</div> : null}
            <button className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60 md:col-span-2" disabled={isSaving} type="submit">
              {isSaving ? "Saving..." : "Submit renewal for approval"}
            </button>
          </form>
        ) : null}

        {drawerMode === "terminate" ? (
          <form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); void handleTerminateLease(); }}>
            <Field label="Termination date" type="date" value={terminationDraft.terminationDate} onChange={(value) => setTerminationDraft((current) => ({ ...current, terminationDate: value }))} />
            <Field label="Final settlement" type="number" value={terminationDraft.finalSettlementAmount} onChange={(value) => setTerminationDraft((current) => ({ ...current, finalSettlementAmount: value }))} />
            <Field label="Security deposit refund" type="number" value={terminationDraft.securityDepositRefundAmount} onChange={(value) => setTerminationDraft((current) => ({ ...current, securityDepositRefundAmount: value }))} />
            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-brand-strong">Termination reason</span>
              <textarea className="field min-h-24 w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => setTerminationDraft((current) => ({ ...current, terminationReason: event.target.value }))} value={terminationDraft.terminationReason} />
            </label>
            <DocumentField attachment={terminationDraft.terminationDocument} label="Termination document" onChange={(event) => void uploadDocument(event, "termination")} onRemove={() => setTerminationDraft((current) => ({ ...current, terminationDocument: null }))} />
            <button className="rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60 md:col-span-2" disabled={isSaving} type="submit">
              {isSaving ? "Terminating..." : "Terminate lease and release unit"}
            </button>
          </form>
        ) : null}
      </SidebarDrawer>
    </AppShell>
  );
}

function Field({ disabled = false, label, onChange, type = "text", value }: { disabled?: boolean; label: string; onChange: (value: string) => void; type?: string; value: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-brand-strong">{label}</span>
      <input className="field w-full rounded-2xl px-4 py-3 ring-0 disabled:cursor-not-allowed disabled:opacity-75" disabled={disabled} onChange={(event) => onChange(event.target.value)} type={type} value={value} />
    </label>
  );
}

function DocumentField({ attachment, label, onChange, onRemove }: { attachment: LeaseAttachmentRecord | null; label: string; onChange: (event: ChangeEvent<HTMLInputElement>) => void; onRemove: () => void }) {
  return (
    <label className="block md:col-span-2">
      <span className="mb-2 block text-sm font-semibold text-brand-strong">{label}</span>
      <input accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp" className="field w-full rounded-2xl px-4 py-3 ring-0" onChange={onChange} type="file" />
      {attachment ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3 text-sm">
          <span className="font-semibold text-brand-strong">{attachment.fileName}</span>
          <button className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700" onClick={onRemove} type="button">Remove</button>
        </div>
      ) : null}
    </label>
  );
}
