"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { CompanyContextBanner } from "@/components/common/company-context-banner";
import { DataTable } from "@/components/common/data-table";
import { SectionCard } from "@/components/common/section-card";
import { SidebarDrawer } from "@/components/common/sidebar-drawer";
import { AppShell } from "@/components/layout/app-shell";
import { approvalApi, roleApi } from "@/lib/api";
import type { ApprovalOptionsRecord, ApprovalRequestRecord, ApprovalWorkflowConfigRecord, RoleRecord } from "@/lib/types";
import { useIsClient } from "@/hooks/use-is-client";
import { useAppStore } from "@/store/app-store";

type Tab = "requests" | "configs";
type ConfigForm = { transactionType: string; levelNo: string; approverRoleId: string; minAmount: string; maxAmount: string; active: boolean };
type RequestForm = { transactionType: string; entityId: string; referenceNumber: string; amount: string; remarks: string };

const defaultOptions: ApprovalOptionsRecord = {
  transactionTypes: ["LEASE_APPROVAL", "LEASE_TERMINATION", "RENT_DISCOUNT", "INVOICE_CANCELLATION", "HIGH_VALUE_MAINTENANCE", "PURCHASE_ORDER", "VENDOR_BILL", "SECURITY_DEPOSIT_REFUND"],
  statuses: ["PENDING", "APPROVED", "REJECTED", "RESUBMITTED", "CANCELLED"],
  actions: ["SUBMITTED", "APPROVED", "REJECTED", "RESUBMITTED"],
};
const configDefaults: ConfigForm = { transactionType: "LEASE_APPROVAL", levelNo: "1", approverRoleId: "", minAmount: "", maxAmount: "", active: true };
const requestDefaults: RequestForm = { transactionType: "LEASE_APPROVAL", entityId: "", referenceNumber: "", amount: "", remarks: "" };

function readError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error) && typeof error.response?.data?.message === "string") return error.response.data.message;
  return fallback;
}
function id(value: string | number | null | undefined) { return value == null ? null : String(value); }
function label(value: string | null | undefined) { return value ? value.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ") : "Not set"; }
function amount(value: number | null | undefined) { return value == null ? "Any" : value.toLocaleString(undefined, { maximumFractionDigits: 2 }); }

export default function ApprovalsPage() {
  const isClient = useIsClient();
  const { accessToken, hasHydrated, user } = useAppStore();
  const [tab, setTab] = useState<Tab>("requests");
  const [options, setOptions] = useState<ApprovalOptionsRecord>(defaultOptions);
  const [configs, setConfigs] = useState<ApprovalWorkflowConfigRecord[]>([]);
  const [requests, setRequests] = useState<ApprovalRequestRecord[]>([]);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [configDraft, setConfigDraft] = useState<ConfigForm>(configDefaults);
  const [requestDraft, setRequestDraft] = useState<RequestForm>(requestDefaults);
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [decisionRemarks, setDecisionRemarks] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  async function loadAll() {
    const [optionsResponse, configsResponse, requestsResponse, rolesResponse] = await Promise.all([
      approvalApi.getOptions(),
      approvalApi.getConfigs(),
      approvalApi.getRequests(),
      roleApi.getRoles(),
    ]);
    setOptions(optionsResponse.data.data as ApprovalOptionsRecord);
    setConfigs((configsResponse.data.data as Array<ApprovalWorkflowConfigRecord & { id: number | string; companyId: number | string; approverRoleId: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), approverRoleId: String(item.approverRoleId) })));
    setRequests((requestsResponse.data.data as Array<ApprovalRequestRecord & { id: number | string; companyId: number | string; entityId: number | string }>).map((item) => ({ ...item, id: String(item.id), companyId: String(item.companyId), entityId: String(item.entityId), requestedBy: id(item.requestedBy), history: (item.history ?? []).map((action) => ({ ...action, id: String(action.id), approverUserId: id(action.approverUserId), approverRoleId: id(action.approverRoleId) })) })));
    setRoles((rolesResponse.data.data as Array<RoleRecord & { id: number | string }>).map((item) => ({ ...item, id: String(item.id) })));
  }

  useEffect(() => {
    if (!isClient || !hasHydrated || !accessToken) return;
    let cancelled = false;
    async function run() {
      try {
        setIsLoading(true);
        await loadAll();
        if (!cancelled) setError(null);
      } catch (loadError) {
        if (!cancelled) setError(readError(loadError, "Approval workflow data could not be loaded."));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void run();
    return () => { cancelled = true; };
  }, [accessToken, hasHydrated, isClient]);

  function openConfig(row?: ApprovalWorkflowConfigRecord) {
    setTab("configs");
    setEditingConfigId(row?.id ?? null);
    setConfigDraft(row ? { transactionType: row.transactionType, levelNo: String(row.levelNo), approverRoleId: row.approverRoleId, minAmount: row.minAmount == null ? "" : String(row.minAmount), maxAmount: row.maxAmount == null ? "" : String(row.maxAmount), active: row.active } : configDefaults);
    setFormError(null);
    setDrawerOpen(true);
  }

  function openRequest() {
    setTab("requests");
    setRequestDraft(requestDefaults);
    setFormError(null);
    setDrawerOpen(true);
  }

  async function save() {
    try {
      setIsSaving(true);
      setFormError(null);
      if (tab === "configs") {
        const payload = { transactionType: configDraft.transactionType, levelNo: Number(configDraft.levelNo), approverRoleId: Number(configDraft.approverRoleId), minAmount: configDraft.minAmount ? Number(configDraft.minAmount) : null, maxAmount: configDraft.maxAmount ? Number(configDraft.maxAmount) : null, active: configDraft.active };
        if (editingConfigId) await approvalApi.updateConfig(editingConfigId, payload);
        else await approvalApi.createConfig(payload);
      } else {
        await approvalApi.submitRequest({ transactionType: requestDraft.transactionType, entityId: Number(requestDraft.entityId), referenceNumber: requestDraft.referenceNumber, amount: requestDraft.amount ? Number(requestDraft.amount) : null, remarks: requestDraft.remarks || null });
      }
      await loadAll();
      setDrawerOpen(false);
    } catch (saveError) {
      setFormError(readError(saveError, "Approval workflow could not be saved."));
    } finally {
      setIsSaving(false);
    }
  }

  async function decide(idValue: string, action: "approve" | "reject" | "resubmit") {
    try {
      const payload = { remarks: decisionRemarks[idValue] || null };
      if (action === "approve") await approvalApi.approveRequest(idValue, payload);
      if (action === "reject") await approvalApi.rejectRequest(idValue, payload);
      if (action === "resubmit") await approvalApi.resubmitRequest(idValue, payload);
      await loadAll();
    } catch (decisionError) {
      setError(readError(decisionError, "Approval decision could not be applied."));
    }
  }

  async function removeConfig(idValue: string) {
    try {
      await approvalApi.deleteConfig(idValue);
      await loadAll();
    } catch (deleteError) {
      setError(readError(deleteError, "Approval config could not be deleted."));
    }
  }

  const configColumns = [
    { key: "transactionType", header: "Transaction", render: (row: ApprovalWorkflowConfigRecord) => <div><div className="font-semibold">{label(row.transactionType)}</div><div className="text-xs text-[color:var(--foreground-muted)]">Level {row.levelNo}</div></div> },
    { key: "approverRoleName", header: "Approver Role", render: (row: ApprovalWorkflowConfigRecord) => row.approverRoleName ?? row.approverRoleId },
    { key: "amount", header: "Amount Band", render: (row: ApprovalWorkflowConfigRecord) => `${amount(row.minAmount)} - ${amount(row.maxAmount)}` },
    { key: "active", header: "Status", render: (row: ApprovalWorkflowConfigRecord) => row.active ? "Active" : "Inactive" },
    { key: "actions", header: "Actions", render: (row: ApprovalWorkflowConfigRecord) => <div className="flex gap-2"><button className="btn-secondary rounded-full px-3 py-1 text-xs" onClick={() => openConfig(row)}>Edit</button><button className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600" onClick={() => removeConfig(row.id)}>Delete</button></div> },
  ];
  const requestColumns = [
    { key: "referenceNumber", header: "Request", render: (row: ApprovalRequestRecord) => <div><div className="font-semibold">{row.referenceNumber}</div><div className="text-xs text-[color:var(--foreground-muted)]">{label(row.transactionType)} · Entity {row.entityId}</div></div> },
    { key: "amount", header: "Amount", render: (row: ApprovalRequestRecord) => amount(row.amount) },
    { key: "status", header: "Status", render: (row: ApprovalRequestRecord) => `${label(row.status)} · Level ${row.currentLevel}` },
    { key: "history", header: "History", render: (row: ApprovalRequestRecord) => row.history.length ? row.history.map((item) => `${label(item.action)} L${item.levelNo}`).join(", ") : "No history" },
    { key: "actions", header: "Actions", render: (row: ApprovalRequestRecord) => <div className="min-w-56 space-y-2"><input className="field w-full rounded-full px-3 py-1 text-xs" onChange={(event) => setDecisionRemarks((current) => ({ ...current, [row.id]: event.target.value }))} placeholder="Remarks" value={decisionRemarks[row.id] ?? ""} /><div className="flex flex-wrap gap-2"><button className="btn-secondary rounded-full px-3 py-1 text-xs" onClick={() => decide(row.id, "approve")}>Approve</button><button className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600" onClick={() => decide(row.id, "reject")}>Reject</button><button className="btn-secondary rounded-full px-3 py-1 text-xs" onClick={() => decide(row.id, "resubmit")}>Resubmit</button></div></div> },
  ];

  return (
    <AppShell title="Approval Workflow" subtitle="Configurable role-based approvals and full decision history">
      <div className="space-y-6">
        <CompanyContextBanner companyName={user?.activeCompany?.companyName ?? null} />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[color:var(--accent)]">Administration</p>
            <h1 className="text-3xl font-semibold tracking-tight">Approval Workflow</h1>
            <p className="mt-2 max-w-3xl text-sm text-[color:var(--foreground-muted)]">Control lease approvals, terminations, rent discounts, invoice cancellations, high-value maintenance, purchase orders, vendor bills, and deposit refunds.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary rounded-full px-4 py-2 text-sm font-semibold" onClick={() => openConfig()}>Add Level</button>
            <button className="btn-primary rounded-full px-5 py-2 text-sm font-semibold" onClick={openRequest}>Submit Approval</button>
          </div>
        </div>
        <div className="flex gap-2">
          <button className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === "requests" ? "btn-primary" : "btn-secondary"}`} onClick={() => setTab("requests")}>Requests</button>
          <button className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === "configs" ? "btn-primary" : "btn-secondary"}`} onClick={() => setTab("configs")}>Workflow Config</button>
        </div>
        {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div> : null}
        <SectionCard title={tab === "requests" ? "Approval Requests" : "Approval Levels"} action={<button className="btn-secondary rounded-full px-4 py-2 text-sm font-semibold" onClick={() => void loadAll()}>Refresh</button>}>
          {isLoading ? (
            <p className="text-sm text-[color:var(--foreground-muted)]">Loading approvals...</p>
          ) : tab === "requests" ? (
            <DataTable columns={requestColumns} rows={requests} />
          ) : (
            <DataTable columns={configColumns} rows={configs} />
          )}
        </SectionCard>
      </div>
      <SidebarDrawer description={tab === "configs" ? "Configure levels and role-based approvers." : "Submit a transaction into approval workflow."} eyebrow="Approval" onClose={() => setDrawerOpen(false)} open={drawerOpen} title={tab === "configs" ? "Approval Level" : "Approval Request"}>
        <div className="space-y-5">
          {formError ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{formError}</div> : null}
          {tab === "configs" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectInput label="Transaction Type" options={options.transactionTypes} value={configDraft.transactionType} onChange={(value) => setConfigDraft((c) => ({ ...c, transactionType: value }))} />
              <TextInput label="Level" value={configDraft.levelNo} onChange={(value) => setConfigDraft((c) => ({ ...c, levelNo: value }))} />
              <SelectInput label="Approver Role" options={roles.map((role) => ({ value: role.id, label: role.roleName }))} value={configDraft.approverRoleId} onChange={(value) => setConfigDraft((c) => ({ ...c, approverRoleId: value }))} />
              <label className="mt-8 flex items-center gap-2 text-sm font-semibold"><input checked={configDraft.active} onChange={(event) => setConfigDraft((c) => ({ ...c, active: event.target.checked }))} type="checkbox" /> Active</label>
              <TextInput label="Min Amount" value={configDraft.minAmount} onChange={(value) => setConfigDraft((c) => ({ ...c, minAmount: value }))} />
              <TextInput label="Max Amount" value={configDraft.maxAmount} onChange={(value) => setConfigDraft((c) => ({ ...c, maxAmount: value }))} />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectInput label="Transaction Type" options={options.transactionTypes} value={requestDraft.transactionType} onChange={(value) => setRequestDraft((c) => ({ ...c, transactionType: value }))} />
              <TextInput label="Entity ID" value={requestDraft.entityId} onChange={(value) => setRequestDraft((c) => ({ ...c, entityId: value }))} />
              <TextInput label="Reference Number" value={requestDraft.referenceNumber} onChange={(value) => setRequestDraft((c) => ({ ...c, referenceNumber: value }))} />
              <TextInput label="Amount" value={requestDraft.amount} onChange={(value) => setRequestDraft((c) => ({ ...c, amount: value }))} />
              <div className="sm:col-span-2"><TextareaInput label="Remarks" value={requestDraft.remarks} onChange={(value) => setRequestDraft((c) => ({ ...c, remarks: value }))} /></div>
            </div>
          )}
          <div className="flex justify-end gap-3 border-t border-line pt-4">
            <button className="btn-secondary rounded-full px-5 py-2 text-sm font-semibold" onClick={() => setDrawerOpen(false)}>Cancel</button>
            <button className="btn-primary rounded-full px-5 py-2 text-sm font-semibold disabled:opacity-60" disabled={isSaving} onClick={save}>{isSaving ? "Saving..." : "Save"}</button>
          </div>
        </div>
      </SidebarDrawer>
    </AppShell>
  );
}

function TextInput({ label: inputLabel, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block text-sm font-semibold text-brand-strong">{inputLabel}<input className="field mt-2 w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => onChange(event.target.value)} value={value} /></label>;
}
function SelectInput({ label: inputLabel, options, value, onChange }: { label: string; options: string[] | Array<{ value: string; label: string }>; value: string; onChange: (value: string) => void }) {
  const normalized = options.map((option) => typeof option === "string" ? { value: option, label: label(option) } : option);
  return <label className="block text-sm font-semibold text-brand-strong">{inputLabel}<select className="field mt-2 w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => onChange(event.target.value)} value={value}><option value="">Select</option>{normalized.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}
function TextareaInput({ label: inputLabel, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block text-sm font-semibold text-brand-strong">{inputLabel}<textarea className="field mt-2 min-h-28 w-full rounded-2xl px-4 py-3 ring-0" onChange={(event) => onChange(event.target.value)} value={value} /></label>;
}
